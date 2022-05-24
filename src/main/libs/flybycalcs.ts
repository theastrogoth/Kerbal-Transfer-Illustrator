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
        // const outEcc = params.outEccentricity;

        const periapsis = inSMA * (1 - inEcc);

        const inSLR  = inSMA  * (1 - inEcc  * inEcc); 
        const inNu = -Kepler.trueAnomalyAtDistance(soi, inEcc,  inSLR);
        const inPerifocalDirection  = Kepler.motionDirectionAtTrueAnomaly(inNu,  inEcc);

        const {axis, angle} = alignVectorsAngleAxis(inPerifocalDirection, params.inDirection);

        const periapsisPos = roderigues(vec3(periapsis, 0, 0), axis, angle);

        const inPeriapsisSpeed  = Math.sqrt(mu * (2 / periapsis - 1 / inSMA));
        const outPeriapsisSpeed = Math.sqrt(mu * (2 / periapsis - 1 / outSMA));

        const inPeriapsisVel  = roderigues(vec3(0, inPeriapsisSpeed,  0), axis, angle);
        const outPeriapsisVel = roderigues(vec3(0, outPeriapsisSpeed, 0), axis, angle);

        const inPeriapsisState  = {date: params.time, pos: periapsisPos, vel: inPeriapsisVel};
        const outPeriapsisState = {date: params.time, pos: periapsisPos, vel: outPeriapsisVel};

        const inOrbit  = Kepler.stateToOrbit(inPeriapsisState,  body);
        const outOrbit = Kepler.stateToOrbit(outPeriapsisState, body);
        const maneuver = Kepler.maneuverFromOrbitalStates(inPeriapsisState, outPeriapsisState);
        
        const inDate  = DepartArrive.insertionDate(inOrbit, body);
        const outDate = DepartArrive.ejectionDate(outOrbit, body);

        const trajectory: Trajectory = {
            orbits:         [inOrbit, outOrbit],
            intersectTimes: [inDate, params.time, outDate],
            maneuvers:      [maneuver],
        };

        return trajectory;
    }

    export function multiFlybyInputsFromAgent(agent: Agent, inputs: MultiFlybySearchInputs): MultiFlybyInputs {
        const startDate = lerp(inputs.startDateMin, inputs.startDateMax, agent[0]);
        const flightTimes: number[] = [];
        for(let j=0; j<agent.length-1; j++) {
            let ft = lerp(inputs.flightTimesMax[j], inputs.flightTimesMin[j], agent[j+1]);
            flightTimes.push(ft);
        }
        return  {
            system:                 inputs.system,
            startOrbit:             inputs.startOrbit,
            endOrbit:               inputs.endOrbit,
            flybyIdSequence:        inputs.flybyIdSequence,
            startDate,
            flightTimes,
            ejectionInsertionType:  inputs.ejectionInsertionType,
            planeChange:            inputs.planeChange,
            matchStartMo:           inputs.matchStartMo,
            matchEndMo:             inputs.matchEndMo,
            noInsertionBurn:        inputs.noInsertionBurn,
        };
    }
}

export default FlybyCalcs;