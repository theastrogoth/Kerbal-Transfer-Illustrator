import Kepler from "./kepler";
import DepartArrive from "./departarrive";
import { lerp, vec3, magSq3, div3, normalize3, cross3, dot3, acosClamped, roderigues, alignVectorsAngleAxis, wrapAngle } from "./math";
import { brentMinimize } from "./optim";

namespace FlybyCalcs {
    export function minFlybyRadius(body: IOrbitingBody): number {
        const margin = 1000; // leave a 1km buffer
        const atmoHeight = body.atmosphereHeight || 0;
        const terrainHeight = body.maxTerrainHeight || 0;
        if(atmoHeight > terrainHeight) {
            return body.radius + atmoHeight + margin;
        } else {
            return body.radius + terrainHeight + margin;
        }
    }

    export function maxFlybyRadius(body: IOrbitingBody) {
        return body.soi;
    }

    export function legDurationBounds(orb1: IOrbit, orb2: IOrbit, attractor: ICelestialBody) {
        // const isResonant = Kepler.orbitsAreEqual(orb1, orb2);
        // if(isResonant) {
        //     return {lb: orb1.siderealPeriod, ub: orb1.siderealPeriod * 2}
        // }
        const meanSMA = 0.5 * (orb1.semiMajorAxis + orb2.semiMajorAxis);
        const midPeriod = Kepler.siderealPeriod(meanSMA, attractor.stdGravParam);
        return {lb: midPeriod / 25, ub: midPeriod * 2}
    }

    export function flybyParameters({velIn, velOut, body, time}: FlybyInputs): FlybyParams {
        const mu = body.stdGravParam;
        const soi = body.soi;

        const inVelSq = magSq3(velIn);
        const outVelSq = magSq3(velOut);
        const inDir = div3(velIn, Math.sqrt(inVelSq));
        const outDir = div3(velOut, Math.sqrt(outVelSq));

        const inEnergy  = inVelSq  / 2 - mu / soi; // account for gravitational potential energy as well as
        const outEnergy = outVelSq / 2 - mu / soi; // kinetic energy.
        const inSMA  = -mu / (2 * inEnergy);  
        const outSMA = -mu / (2 * outEnergy);  

        const hDir = normalize3(cross3(inDir, outDir));     // direction of angular moment vector, normal to the flyby plane
        const delta = acosClamped(dot3(inDir, outDir));     // angle between incoming and outgoing velocity vectors (flyby angle)

        // require that the incoming and outgoing orbits intersect at their periapses.
        // find the periapsis height that gives the correct flyby angle
        const objective = (periapsis: number) => {
            const inEcc  = 1 - periapsis / inSMA;
            const outEcc = 1 - periapsis / outSMA;
            const inSLR  = inSMA  * (1 - inEcc  * inEcc); 
            const outSLR = outSMA * (1 - outEcc * outEcc);
            const inNu   = -Kepler.trueAnomalyAtDistance(soi, inEcc,  inSLR);     // true anomaly at encounter
            const outNu  =  Kepler.trueAnomalyAtDistance(soi, outEcc, outSLR);    // true anomaly at escape

            const deltaIn  = Kepler.motionAngleAtTrueAnomaly(inNu,  inEcc);
            const deltaOut = Kepler.motionAngleAtTrueAnomaly(outNu, outEcc);
            const obj = Math.abs(delta - wrapAngle(deltaOut - deltaIn))
            return isNaN(obj) ? Math.PI : obj;
        }
        const periapsis = brentMinimize(objective, minFlybyRadius(body), maxFlybyRadius(body), 1e-8)
        const error = objective(periapsis);

        const inEcc  = 1 - periapsis / inSMA;
        const outEcc = 1 - periapsis / outSMA;
        
        const periapsisSpeedIn  = Math.sqrt((inEnergy  + mu / periapsis) * 2); 
        const periapsisSpeedOut = Math.sqrt((outEnergy + mu / periapsis) * 2);
        const deltaV = Math.abs(periapsisSpeedOut - periapsisSpeedIn);    
        // console.log(deltaV)

        return {
            inSemiMajorAxis:    inSMA,
            inEccentricity:     inEcc,
            inDirection:        inDir,
            outSemiMajorAxis:   outSMA,
            outEccentricity:    outEcc,
            outDirection:       outDir,
            normalDirection:    hDir,
            deltaV,
            error,
            time,
        }
    }

    export function flybyFromParameters(params: FlybyParams, body: IOrbitingBody): Trajectory {
        const soi = body.soi;
        const mu = body.stdGravParam;
        
        const inSMA  = params.inSemiMajorAxis;
        const outSMA = params.outSemiMajorAxis;
        const inEcc  = params.inEccentricity;

        const periapsis = inSMA * (1 - inEcc);

        const inSLR  = inSMA  * (1 - inEcc  * inEcc); 
        const inNu = -Kepler.trueAnomalyAtDistance(soi, inEcc,  inSLR);
        const inPerifocalDirection  = Kepler.motionDirectionAtTrueAnomaly(inNu,  inEcc);

        // rotate so that the incoming direction is correct
        const axisAngle1 = alignVectorsAngleAxis(inPerifocalDirection, params.inDirection);
        const tempPeriapsisPos = roderigues(vec3(periapsis, 0, 0), axisAngle1.axis, axisAngle1.angle);

        // rotate around the incoming direction so that the normal direction is correct (this should also ensure the proper outgoing direction)
        const axisAngle2 = alignVectorsAngleAxis(cross3(tempPeriapsisPos, params.inDirection), params.normalDirection);
        const periapsisPos = roderigues(tempPeriapsisPos, axisAngle2.axis, axisAngle2.angle);

        // calculate the speed before and after the burn
        const inPeriapsisSpeed  = Math.sqrt(mu * (2 / periapsis - 1 / inSMA));
        const outPeriapsisSpeed = Math.sqrt(mu * (2 / periapsis - 1 / outSMA));

        // calculate velocity based on the rotations to align the incoming and outgoing directions
        const inPeriapsisVel  = roderigues(roderigues(vec3(0, inPeriapsisSpeed,  0), axisAngle1.axis, axisAngle1.angle), axisAngle2.axis, axisAngle2.angle);
        const outPeriapsisVel = roderigues(roderigues(vec3(0, outPeriapsisSpeed, 0), axisAngle1.axis, axisAngle1.angle), axisAngle2.axis, axisAngle2.angle);

        const inPeriapsisState  = {date: params.time, pos: periapsisPos, vel: inPeriapsisVel};
        const outPeriapsisState = {date: params.time, pos: periapsisPos, vel: outPeriapsisVel};

        const inOrbit  = Kepler.stateToOrbit(inPeriapsisState,  body);
        const outOrbit = Kepler.stateToOrbit(outPeriapsisState, body);
        const maneuver = Kepler.maneuverFromOrbitalStates(inPeriapsisState, outPeriapsisState);
        
        const inDate  = DepartArrive.insertionDate(inOrbit, soi);
        const outDate = DepartArrive.ejectionDate(outOrbit, soi);

        // // testing: make sure directions and deltaV are correct
        // console.log(params.error)
        // console.log(params.inDirection, normalize3(Kepler.orbitToVelocityAtDate(inOrbit, body, inDate)));
        // console.log(params.outDirection, normalize3(Kepler.orbitToVelocityAtDate(outOrbit, body, outDate)));
        // console.log(params.deltaV, outPeriapsisSpeed - inPeriapsisSpeed)

        const trajectory: Trajectory = {
            orbits:         [inOrbit, outOrbit],
            intersectTimes: [inDate, params.time, outDate],
            maneuvers:      [maneuver],
        };

        return trajectory;
    }

    export function multiFlybyInputsFromAgent(agent: Agent, inputs: MultiFlybySearchInputs, numDSMs?: number | undefined, firstDSMindex?: number | undefined): MultiFlybyInputs {
        numDSMs = numDSMs || inputs.DSMperLeg.reduce((p,c) => p + c);
        firstDSMindex = firstDSMindex || (agent.length - 4 * numDSMs);
        const startDate = lerp(inputs.startDateMin, inputs.startDateMax, agent[0]);
        const flightTimes: number[] = [];
        for(let j=1; j<firstDSMindex; j++) {
            let ft = lerp(inputs.flightTimesMax[j-1], inputs.flightTimesMin[j-1], agent[j]);
            flightTimes.push(ft);
        }
        const DSMparams: DeepSpaceManeuverParams[] = [];
        let agentIndex = firstDSMindex;
        if (numDSMs > 0 && inputs.DSMperLeg) {
            for (let i=0; i<flightTimes.length; i++) {
                for (let j=0; j<inputs.DSMperLeg[i]; j++) {
                    DSMparams.push({
                        leg:    i,
                        alpha:  agent[agentIndex],
                        phi:    agent[agentIndex+1],
                        theta:  agent[agentIndex+2],
                        radius: agent[agentIndex+3],
                    })
                    agentIndex+=4;
                }
            }
        }
        return  {
            system:                 inputs.system,
            startOrbit:             inputs.startOrbit,
            endOrbit:               inputs.endOrbit,
            flybyIdSequence:        inputs.flybyIdSequence,
            startDate,
            flightTimes,
            DSMparams,
            ejectionInsertionType:  inputs.ejectionInsertionType,
            planeChange:            inputs.planeChange,
            matchStartMo:           inputs.matchStartMo,
            matchEndMo:             inputs.matchEndMo,
            noInsertionBurn:        inputs.noInsertionBurn,
        };
    }
}

export default FlybyCalcs;