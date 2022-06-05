import DepartArrive from "./departarrive";
import Kepler from "./kepler";
import { add3, mag3, sub3 } from "./math";
import { brentMinimize, brentRootFind } from "./optim";

function orbitDistanceFromBody(date: number, orbit: IOrbit, satelliteBody: IOrbitingBody) {
    const orbitPos = Kepler.orbitToPositionAtDate(orbit, date);
    const bodyPos  = Kepler.orbitToPositionAtDate(satelliteBody.orbit, date);
    return mag3(sub3(bodyPos, orbitPos)) - satelliteBody.soi;
}

function findNextOrbit(orbit: IOrbit, system: ISolarSystem, startDate: number, endDate: number = Infinity, nRevs: number = 3): IOrbit | null {
    // prepare attractor body
    const attractor = orbit.orbiting === 0 ? system.sun : system.orbiterIds.get(orbit.orbiting) as IOrbitingBody;
    // prepare satellite bodies
    const satelliteBodies: IOrbitingBody[] = [];
    for(let j=0; j<system.orbiters.length; j++) {
        if(system.orbiters[j].orbiting === attractor.id) {
            satelliteBodies.push(system.orbiters[j]);
        }
    }
    // set search bounds
    let maxDate: number = endDate;
    let escapes: boolean = orbit.eccentricity > 1;
    let escapeDate: number = NaN;
    const soi = attractor.soi === null ? Infinity : attractor.soi;
    if (!escapes && attractor.soi !== null) {
        const apoapsis = orbit.apoapsis ? orbit.apoapsis : orbit.semiMajorAxis * (1 + orbit.eccentricity);
        escapes = apoapsis > attractor.soi;
    }
    if (escapes) {
        if (soi === Infinity) {
            const maxDist = Math.max(...satelliteBodies.map(body => body.orbit.apoapsis ? body.orbit.apoapsis + body.soi : body.orbit.semiMajorAxis * (1 + body.orbit.eccentricity) + body.soi));
            escapeDate = Kepler.trueAnomalyToOrbitDate(Kepler.trueAnomalyAtDistance(maxDist, orbit.eccentricity, orbit.semiLatusRectum), orbit, startDate);
            maxDate = Math.min(maxDate, escapeDate);
        } else {
            escapeDate = DepartArrive.ejectionDate(orbit, attractor as IOrbitingBody);
        }
        maxDate = Math.min(maxDate, escapeDate);
    } else {
        maxDate = Math.min(maxDate, startDate + orbit.siderealPeriod * (nRevs + 1));
    }

    // perform search
    const maxIters = escapes ? 1 : nRevs + 1;
    let start = startDate;
    // let end = Math.min(maxDate, (escapes ? escapeDate : start + orbit.siderealPeriod));
    let end = escapes ? escapeDate : start + orbit.siderealPeriod;
    let interceptTime: number = Infinity;
    let interceptBody: IOrbitingBody | undefined = undefined;
    for(let i=0; i<maxIters; i++) {
        for(let j=0; j<satelliteBodies.length; j++) {
            const distObj = (d: number) => orbitDistanceFromBody(d, orbit, satelliteBodies[j]);
            const minDistTime = brentMinimize(distObj, Math.min(start, Math.max(start, end)), end);
            const minDist = distObj(minDistTime);
            if(minDist < -10 && minDistTime < interceptTime) {
                interceptTime = minDistTime;
                interceptBody = satelliteBodies[j];
            }
        }
        // stop the search once an intercept has been found, or if the specified endDate has been exceeded
        if(interceptTime !== Infinity || end > endDate) {
            break
        }
        start = end;
        end = Math.min(end + orbit.siderealPeriod, endDate);
    }

    // if no intercepts were found
    if(interceptBody === undefined) {
        // if the orbit escapes from the attractor's SoI...
        if(escapes && escapeDate <= maxDate) {
            // if the attractor body is the sun (has infinite SoI), return null (there is no next orbit)
            if(soi === Infinity) {
                // console.log("No next orbit found")
                return null;
            }
            // otherwise, patch the orbit into the attractor body's attractor
            const grandparentId = (attractor as IOrbitingBody).orbiting;
            const grandparent = grandparentId === 0 ? system.sun : system.orbiterIds.get(grandparentId) as ICelestialBody;
            const orbitState = Kepler.orbitToStateAtDate(orbit, attractor, escapeDate);
            const bodyState  = Kepler.orbitToStateAtDate((attractor as IOrbitingBody).orbit, grandparent, escapeDate);
            const postPatchState: OrbitalState = {
                date: escapeDate,
                pos:  add3(orbitState.pos, bodyState.pos),
                vel:  add3(orbitState.vel, bodyState.vel)
            }
            // console.log("Escape from " + attractor.name + ": " + String(escapeDate) + " s")
            return Kepler.stateToOrbit(postPatchState, grandparent);
        // if the orbit does not escape, return null (there is no next orbit)
        } else {
            // console.log("No next orbit found")
            return null;
        }
    // If an intercept was found, patch the orbit into the SoI of the satellite body
    } else {
        // for the soonest intercept, get the date where the SoI patch occurs
        const distObj = (d: number) => orbitDistanceFromBody(d, orbit, interceptBody as IOrbitingBody);
        const rootFind = (s: number, e: number, iter=0): number => {try { return brentRootFind(distObj, s, e) } catch { if(iter>10) { return rootFind(s + 10, e, iter+1) } else { return NaN } }}
        let soiPatchTime = rootFind(start, interceptTime);
        // if(isNaN(soiPatchTime)) { return null; }
        if(isNaN(soiPatchTime)) {
            if(distObj(start) < 0) {
                soiPatchTime = start;
            } else {
                return null;
            }
        }

        // if the intercept time is beyond the endDate, then no valid next orbit was found
        if(soiPatchTime > endDate) {
            // console.log("No next orbit found")
            return null;
        }

        const orbitState = Kepler.orbitToStateAtDate(orbit, attractor, soiPatchTime);
        const bodyState  = Kepler.orbitToStateAtDate((interceptBody as IOrbitingBody).orbit, attractor, soiPatchTime);
        const postPatchState: OrbitalState = {
            date: soiPatchTime,
            pos:  sub3(orbitState.pos, bodyState.pos),
            vel:  sub3(orbitState.vel, bodyState.vel),
        }
        // console.log("Encounter at " + interceptBody.name + ": " + String(soiPatchTime) + ' s')
        return Kepler.stateToOrbit(postPatchState, interceptBody as IOrbitingBody);
    }
}

// function sortManeuvers(man1: Maneuver, man2: Maneuver): number {
//     return man1.preState.date - man2.preState.date;
// }

export function propagateFlightPlan(startOrbit: IOrbit, system: ISolarSystem, startDate: number, maneuverComponents: ManeuverComponents[], nRevs: number = 3): Trajectory[] {
    // maneuvers should be in chronological order
    const sortedManeuverComponents = [...maneuverComponents].sort((a,b) => a.date - b.date);
    
    // store the single-system trajectories in an array
    const trajectories: Trajectory[] = [];

    // propagate starting orbit forward
    let orbits: IOrbit[] = [startOrbit];
    let intersectTimes: number[] = [startDate];
    let maneuvers: Maneuver[] = [];
    let currentOrbit: IOrbit = startOrbit;
    let sDate: number = startDate;
    let eDate: number = Infinity;
    // before each maneuver, check for intercepts up to the maximum specified nRevs
    for(let i=0; i<=sortedManeuverComponents.length; i++) {
        eDate = i !== sortedManeuverComponents.length ? sortedManeuverComponents[i].date : Infinity;
        // console.log("next maneuver at " + String(eDate))
        let nextOrbit: IOrbit | null = null;
        let noPatchFound = false;
        while(!noPatchFound) {
            nextOrbit = findNextOrbit(currentOrbit, system, sDate, eDate, nRevs);
            noPatchFound = nextOrbit === null;
            if(!noPatchFound) {
                sDate = (nextOrbit as IOrbit).epoch;
                intersectTimes.push(sDate);

                // since an SoI change happened, finish the current trajectory and start a new one
                const traj: Trajectory = {
                    orbits,        
                    intersectTimes,
                    maneuvers,
                };
                trajectories.push(traj);

                orbits = [nextOrbit as IOrbit]
                currentOrbit = nextOrbit as IOrbit;
                intersectTimes = [sDate];
                maneuvers = [];
            }
        }
        if(i !== sortedManeuverComponents.length) {
            const currentAttractor = currentOrbit.orbiting === 0 ? system.sun : system.orbiterIds.get(currentOrbit.orbiting) as IOrbitingBody;
            const preState = Kepler.orbitToStateAtDate(currentOrbit, currentAttractor, sortedManeuverComponents[i].date)
            const maneuver = Kepler.maneuverComponentsToManeuver(sortedManeuverComponents[i], preState);
            nextOrbit = Kepler.stateToOrbit(maneuver.postState, currentAttractor)
            sDate = nextOrbit.epoch;
            intersectTimes.push(sDate);
            orbits.push(nextOrbit);
            maneuvers.push(maneuver);
            currentOrbit = nextOrbit;
        } else {
            // finish off last trajectory
            intersectTimes.push(Infinity);
            const traj: Trajectory = {
                orbits,        
                intersectTimes,
                maneuvers,
            };
            trajectories.push(traj);
        }
    }
    return trajectories;
}

export function propagateVessel(vessel: IVessel, system: ISolarSystem, startDate: number = vessel.orbit.epoch, nRevs: number = 3) {
    return propagateFlightPlan(vessel.orbit, system, startDate, vessel.maneuvers, nRevs);
}

export function vesselToFlightPlan(vessel: IVessel, system: ISolarSystem, color: IColor = {r: 255, g: 255, b: 255}, startDate: number = vessel.orbit.epoch, nRevs: number = 3): FlightPlan {
    const fp = {
        name:           vessel.name,
        color,
        trajectories:   propagateVessel(vessel, system, startDate, nRevs),
    }
    return fp;
}

export function flightPlanToVessel(flightPlan: FlightPlan): IVessel {
    const maneuvers: ManeuverComponents[] = flightPlan.trajectories.map(t => t.maneuvers.map(m => Kepler.maneuverToComponents(m))).flat();
    return {
        name:       flightPlan.name,
        orbit:      flightPlan.trajectories[0].orbits[0],
        maneuvers,         
    }
}

export default vesselToFlightPlan;