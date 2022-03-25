import Kepler from './kepler';
import Lambert from './lambert';
import DepartArrive from './departarrive';
import { vec3, add3, sub3, mag3, normalize3, cross3, dot3, roderigues, wrapAngle, acosClamped, HALF_PI, Z_DIR } from './math';

namespace Trajectories {
    export function transferTrajectory(startOrbit: IOrbit, endOrbit: IOrbit, transferBody: ICelestialBody, startDate: number, flightTime: number, endDate: number, 
                                       planeChange: boolean, startPatchPosition: Vector3 = vec3(0,0,0), endPatchPosition: Vector3 = vec3(0,0,0)): Trajectory {
        
        const startState = Kepler.orbitToStateAtDate(startOrbit, transferBody, startDate);
        const endState   = Kepler.orbitToStateAtDate(endOrbit,   transferBody, endDate); 
        const startPos = add3(startState.pos, startPatchPosition);
        const endPos   = add3(endState.pos,   endPatchPosition);

        if(planeChange) { // for plane-change-style transfer...
            // project the end position to the perifocal plane of the pre-transfer orbit, and compute a transfer
            let planeEndPos = Kepler.rotateToPerifocalFromInertial(endPos, startOrbit);
            planeEndPos = Kepler.rotateToInertialFromPerifocal(vec3(planeEndPos.x, planeEndPos.y, 0.0), startOrbit);

            const {v1} = Lambert.solve(startPos, planeEndPos, flightTime, transferBody);
            const transferOrbit1 = Kepler.stateToOrbit(
                {
                    date: startDate,
                    pos:  startPos,
                    vel:  v1
                },
                transferBody
            );
            
            // identify the true anomaly and date at the plane change (use PI/2 prior to target encounter)
            const startNu = Kepler.angleInOrbitPlane(startPos, transferOrbit1);
            // let startNu = Kepler.dateToOrbitTrueAnomaly(startDate, transferOrbit1);
            // if(isNaN(startNu)) {    // in case Newton root solving fails for the inverse Kepler equation (near parabolic orbits?)
            //     startNu = Kepler.angleInOrbitPlane(startPos, transferOrbit1);
            // }
            const endNu = Kepler.angleInOrbitPlane(planeEndPos, transferOrbit1);
            // let endNu = Kepler.dateToOrbitTrueAnomaly(endDate, transferOrbit1);
            // if(isNaN(endNu)) {      // in case Newton root solving fails for the inverse Kepler equation (near parabolic orbits?)
            //     endNu = Kepler.angleInOrbitPlane(planeEndPos, transferOrbit1);
            // }
            const planeChangeNu = startNu + Math.max(0.0, (wrapAngle(endNu - startNu) - HALF_PI));
            const planeChangeDate = Kepler.trueAnomalyToOrbitDate(planeChangeNu, transferOrbit1, startDate);

            // rotate the velocity vector at the plane change location to hit the target at encounter
            const planeChangePreState = {
                date: planeChangeDate,
                pos:  Kepler.positionAtTrueAnomaly(transferOrbit1, planeChangeNu),
                vel:  Kepler.velocityAtTrueAnomaly(transferOrbit1, transferBody.stdGravParam, planeChangeNu),
            };
            const n1vec = normalize3(cross3(planeChangePreState.pos, planeChangePreState.vel));
            const n2vec = normalize3(cross3(planeChangePreState.pos, endPos));
            const rotationAngle = acosClamped(dot3(n1vec, n2vec));
            let rotationAxis = rotationAngle === 0 ? Z_DIR : normalize3(cross3(n1vec, n2vec));
            rotationAxis = isNaN(rotationAxis.x) ? Z_DIR : rotationAxis;
            const newVel = roderigues(planeChangePreState.vel, rotationAxis, rotationAngle);

            // compute the transfer orbit from the plane change position and post-maneuver velocity;
            const planeChangePostState = {
                date: planeChangeDate, 
                pos: planeChangePreState.pos, 
                vel: newVel,
            };
            const transferOrbit2 = Kepler.stateToOrbit(planeChangePostState,transferBody);

            // prepare maneuvers at beginning and end of transfer
            const departState: OrbitalState = {
                date: startDate,
                pos:  startPos,
                vel:  v1,
            }
            let arriveState = Kepler.orbitToStateAtDate(transferOrbit2, transferBody, endDate);
            if(isNaN(arriveState.pos.x)) {  // in case Newton root solving fails for the inverse Kepler equation (near parabolic orbits?)
                const arriveNu = Kepler.angleInOrbitPlane(endPos, transferOrbit2);
                arriveState = {
                    date: endDate,
                    pos:  endPos,
                    vel:  Kepler.velocityAtTrueAnomaly(transferOrbit2, transferBody.stdGravParam, arriveNu),
                };
            }

            const departManeuver = Kepler.maneuverFromOrbitalStates(startState, departState);
            const arriveManeuver = Kepler.maneuverFromOrbitalStates(arriveState, endState);
            const planeManeuver  = Kepler.maneuverFromOrbitalStates(planeChangePreState, planeChangePostState)

            const trajectory = {orbits:         [transferOrbit1, transferOrbit2],
                                intersectTimes: [startDate, planeChangeDate, endDate],
                                maneuvers:      [departManeuver, planeManeuver, arriveManeuver]};
                   
            return trajectory;    
        } else {
            const {v1, v2} = Lambert.solve(startPos, endPos, flightTime, transferBody)

            // prepare maneuvers at beginning and end of transfer
            const departState: OrbitalState = {
                date: startDate,
                pos:  startPos,
                vel:  v1,
            }
            const arriveState: OrbitalState = {
                date: endDate,
                pos:  endPos,
                vel:  v2,
            }

            const departManeuver = Kepler.maneuverFromOrbitalStates(startState, departState);
            const arriveManeuver = Kepler.maneuverFromOrbitalStates(arriveState, endState);

            const trajectory = {orbits:         [Kepler.stateToOrbit({ date: startDate, pos: startPos, vel: v1}, transferBody)],
                                intersectTimes: [startDate, endDate],
                                maneuvers:      [departManeuver, arriveManeuver]};
            return trajectory;
        }
    }

    function bodyFromId(system: ISolarSystem, id: number) {
        if(id === 0) {
            return system.sun;
        } else {
            const body = system.orbiterIds.get(id);
            if(!body)
                throw new Error(`No body with id ${id}`);
            return body;
        }
    }

    export function ejectionTrajectories(system: ISolarSystem, startOrbit: IOrbit, transferOrbit: IOrbit, ejectionSequence: number[], transferStartDate: number, 
                                         matchStartMo: boolean = true, type: "fastdirect" | "direct" | "fastoberth" | "oberth" = "fastdirect", soiPatchPositions: Vector3[] = ejectionSequence.slice(-1).map((i) => vec3(0,0,0))): Trajectory[] {
        let ejectionInfos: Trajectory[] = [];
        
        let nextOrbit: IOrbit;
        let previousOrbit: IOrbit;

        let nextOrbitVel: Vector3;
        let currentBodyVel: Vector3;

        let escapeDate = transferStartDate;
        const nEjections = ejectionSequence.length - 1;
        for(let i=nEjections - 1; i>=0; i--) {
            // body around which the ejection orbit takes place
            const currentBody = (bodyFromId(system, ejectionSequence[i]) as IOrbitingBody);
            // body after escape
            const nextBody = bodyFromId(system, ejectionSequence[i+1]);
            // if this is the first ejection, use the starting orbit
            if(i === 0) {
                previousOrbit = startOrbit;
            // otherwise, use the orbit of the body that has just been escaped
            } else {
                const previousBody = (bodyFromId(system, ejectionSequence[i-1]) as IOrbitingBody);
                previousOrbit = previousBody.orbit;
            }
            // if this is the last ejection, use the transfer orbit as the next orbit
            if(i === nEjections - 1) {
                nextOrbit = transferOrbit;
                nextOrbitVel = Kepler.orbitToVelocityAtDate(nextOrbit, nextBody, escapeDate);
                currentBodyVel = Kepler.orbitToVelocityAtDate(currentBody.orbit, nextBody, escapeDate);
            // otherwise, use the next ejection orbit
            } else {
                const nextEjection = ejectionInfos[ejectionInfos.length-1];
                nextOrbit      = nextEjection.orbits[0];
                nextOrbitVel   = nextEjection.maneuvers[0].postState.vel;
                escapeDate     = nextEjection.maneuvers[0].postState.date;
                currentBodyVel = nextEjection.maneuvers[0].preState.vel;
            }
                        
            // get relative velocity to the current body at escape
            const relativeVel = sub3(nextOrbitVel, currentBodyVel);

            // always match the mean anomaly of a body's orbit
            const matchOrb = i > 0 ? true : matchStartMo;

            // calculate the ejection trajectory
            let currentEjection: Trajectory = type === "fastdirect" ? DepartArrive.fastDeparture(previousOrbit,       currentBody, relativeVel, escapeDate, matchOrb) :
                                              type === "direct"     ? DepartArrive.optimalDeparture(previousOrbit,    currentBody, relativeVel, escapeDate, matchOrb, "direct", soiPatchPositions[i]) :
                                              type === "fastoberth" ? DepartArrive.fastOberthDeparture(previousOrbit, currentBody, relativeVel, escapeDate, matchOrb, soiPatchPositions[i]) :
                                              type === "oberth"     ? DepartArrive.optimalDeparture(previousOrbit,    currentBody, relativeVel, escapeDate, matchOrb, "oberth", soiPatchPositions[i]) :
                                              DepartArrive.fastDeparture(previousOrbit,  currentBody, relativeVel, escapeDate, matchOrb);

            // if there is a nonzero SoI patch position for this ejection, and the "fastdirect" type was used, recalculate the ejection with the modified start position
            if(i > 0 && type === "fastdirect") {
                const currentPatch =soiPatchPositions[i-1]
                if(mag3(currentPatch) > 0) {
                    // optimize ejection eccentricity based on starting position
                    const patchedEjOrb = DepartArrive.departArriveForPosition(add3(currentEjection.maneuvers[0].preState.pos, currentPatch),
                                                                              currentBody,
                                                                              relativeVel,
                                                                              escapeDate,
                                                                              1).orbit;
                    // calculate the date when the exited body is at the right place
                    const previousOrbitNu = Kepler.angleInOrbitPlane(currentEjection.maneuvers[0].preState.pos, previousOrbit);
                    const ejEpoch = Kepler.trueAnomalyToOrbitDate(previousOrbitNu, previousOrbit, patchedEjOrb.epoch - previousOrbit.siderealPeriod / 2)
                    const soiDate = escapeDate + ejEpoch - patchedEjOrb.epoch;
                    patchedEjOrb.epoch = ejEpoch;

                    // prepare orbital states for exited body and ejection orbit at time of ejection
                    const ejPreVel = Kepler.velocityAtTrueAnomaly(previousOrbit, currentBody.stdGravParam, previousOrbitNu);
                    const ejPreState: OrbitalState = {date: ejEpoch, pos: currentEjection.maneuvers[0].preState.pos, vel: ejPreVel};
                    const ejPostState = Kepler.orbitToStateAtDate(patchedEjOrb, currentBody, patchedEjOrb.epoch);
                    const maneuver = Kepler.maneuverFromOrbitalStates(ejPreState, ejPostState);
                    currentEjection = {
                        orbits:             [patchedEjOrb],
                        intersectTimes:     [ejEpoch, soiDate],
                        maneuvers:          [maneuver],
                    }
                }
            }

            // add the calculated ejection to the list
            ejectionInfos.push(currentEjection);
        }

        return ejectionInfos.reverse();
    }

    export function insertionTrajectories(system: ISolarSystem, endOrbit: IOrbit, transferOrbit: IOrbit, insertionSequence: number[], transferEndDate: number, 
                                          matchEndMo: boolean = true, type: "fastdirect" | "direct" | "fastoberth" | "oberth" = "fastdirect", soiPatchPositions: Vector3[] = insertionSequence.slice(0,-1).map((i) => vec3(0,0,0))): Trajectory[] {
        let insertionInfos: Trajectory[] = [];

        let previousOrbit: IOrbit;
        let nextOrbit: IOrbit;

        let previousOrbitVel: Vector3;
        let currentBodyVel: Vector3;

        let encounterDate = transferEndDate;
        const nInsertions = insertionSequence.length - 1;
        for(let i=1; i<=nInsertions; i++) {
            // body around which the insertion orbit takes place
            const currentBody = (bodyFromId(system, insertionSequence[i]) as IOrbitingBody);
            // body prior to encounter
            const previousBody = bodyFromId(system, insertionSequence[i-1]);
            // if this is the last insertion, use the ending orbit
            if(i === nInsertions) {
                nextOrbit = endOrbit;
            // otherwise, use the orbit of the body about to be encountered
            } else {
                const nextBody = (bodyFromId(system, insertionSequence[i+1]) as IOrbitingBody);
                nextOrbit = nextBody.orbit;
            }
            // if this is the first insertion, use the transfer orbit as the next orbit
            if(i === 1) {
                previousOrbit = transferOrbit;
                previousOrbitVel = Kepler.orbitToVelocityAtDate(previousOrbit, previousBody, encounterDate);
                currentBodyVel = Kepler.orbitToVelocityAtDate(currentBody.orbit, previousBody, encounterDate);
            // otherwise, use the previous insertion orbit
            } else {
                const previousInsertion = insertionInfos[insertionInfos.length-1];
                const prevInLen  = previousInsertion.orbits.length;
                const prevManLen = previousInsertion.maneuvers.length;
                previousOrbit    = previousInsertion.orbits[prevInLen - 1];
                previousOrbitVel = previousInsertion.maneuvers[prevManLen - 1].preState.vel;
                encounterDate    = previousInsertion.maneuvers[prevManLen - 1].preState.date;
                currentBodyVel   = previousInsertion.maneuvers[prevManLen - 1].postState.vel;
            }

            // get relative velocity to the current body at encounter
            const relativeVel = sub3(previousOrbitVel, currentBodyVel);

            // always match the mean anomaly of a body's orbit
            const matchOrb = i < nInsertions ? true : matchEndMo;

            // calculate the insertion trajectory
            let currentInsertion = type === "fastdirect"   ? DepartArrive.fastArrival(nextOrbit,     currentBody, relativeVel, encounterDate, matchOrb) :
                                   type === "direct" ? DepartArrive.optimalArrival(nextOrbit,        currentBody, relativeVel, encounterDate, matchOrb, "direct", soiPatchPositions[i]) :
                                   type === "fastoberth" ? DepartArrive.fastOberthArrival(nextOrbit, currentBody, relativeVel, encounterDate, matchOrb, soiPatchPositions[i]) :
                                   type === "oberth" ? DepartArrive.optimalArrival(nextOrbit,        currentBody, relativeVel, encounterDate, matchOrb, "oberth", soiPatchPositions[i]) :
                                   DepartArrive.fastArrival(nextOrbit, currentBody, relativeVel, encounterDate, matchOrb);
            
            // if there is a nonzero SoI patch position for this insertion, and it's not the last one,  recalculate the ejection with the modified start position
            if(i < nInsertions && type === "fastdirect") {
                if(mag3(soiPatchPositions[i]) > 0) {
                    const manLen = currentInsertion.maneuvers.length;
                    const patchedInOrb = DepartArrive.departArriveForPosition(add3(currentInsertion.maneuvers[manLen - 1].postState.pos, soiPatchPositions[i]),
                                                                              currentBody,
                                                                              relativeVel,
                                                                              encounterDate,
                                                                              -1).orbit;
                    // calculate the date when the encountered body is at the right place
                    const nextOrbitNu = Kepler.angleInOrbitPlane(currentInsertion.maneuvers[manLen - 1].postState.pos, nextOrbit);
                    const inEpoch = Kepler.trueAnomalyToOrbitDate(nextOrbitNu, nextOrbit, patchedInOrb.epoch - nextOrbit.siderealPeriod / 2);
                    const soiDate = encounterDate + inEpoch - patchedInOrb.epoch;
                    patchedInOrb.epoch = inEpoch;

                    // prepare orbital states for encountered body and insertion orbit at time of encounter
                    const inPreVel = Kepler.velocityAtTrueAnomaly(nextOrbit, currentBody.stdGravParam, nextOrbitNu);
                    const inPostState: OrbitalState = {date: inEpoch, pos: currentInsertion.maneuvers[manLen - 1].postState.pos, vel: inPreVel};
                    const inPreState = Kepler.orbitToStateAtDate(patchedInOrb, currentBody, patchedInOrb.epoch);
                    const maneuver = Kepler.maneuverFromOrbitalStates(inPreState, inPostState);

                    currentInsertion = {
                        orbits:         [patchedInOrb],
                        intersectTimes: [soiDate, inEpoch],
                        maneuvers:      [maneuver],
                    }
                }
            }
            insertionInfos.push(currentInsertion);
        }
        return insertionInfos;
    }

}

export default Trajectories;