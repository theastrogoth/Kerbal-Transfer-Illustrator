import DepartArrive from "./departarrive";
import Kepler from "./kepler";
import { add3, mag3, sub3 } from "./math";
import { brentMinimize, brentRootFind } from "./optim";

function orbitDistanceFromBody(date: number, orbit: IOrbit, satelliteBody: IOrbitingBody) {
    const orbitPos = Kepler.orbitToPositionAtDate(orbit, date);
    const bodyPos  = Kepler.orbitToPositionAtDate(satelliteBody.orbit, date);
    return mag3(sub3(bodyPos, orbitPos)) - satelliteBody.soi;
}

function findNextOrbit(orbit: IOrbit, system: ISolarSystem, startDate: number, endDate: number = Infinity, nRevs: number = 0): IOrbit | null {
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
    const soi = attractor.soi === null ? Infinity : attractor.soi;
    if (!escapes) {
        const apoapsis = orbit.apoapsis ? orbit.apoapsis : orbit.semiMajorAxis * (1 + orbit.eccentricity);
        escapes = apoapsis > attractor.soi;
    }
    if (escapes) {
        if (soi === Infinity) {
            const maxDist = Math.max(...satelliteBodies.map(body => body.orbit.apoapsis ? body.orbit.apoapsis + body.soi : body.orbit.semiMajorAxis * (1 + body.orbit.eccentricity) + body.soi));
            maxDate = Math.min(maxDate, Kepler.trueAnomalyToOrbitDate(Kepler.trueAnomalyAtDistance(maxDist, orbit.eccentricity, orbit.semiLatusRectum), orbit, startDate));
        } else {
            maxDate = Math.min(maxDate, DepartArrive.ejectionDate(orbit, attractor as IOrbitingBody));
        }
    } else {
        maxDate = Math.min(maxDate, startDate + orbit.siderealPeriod);
    }

    // perform search
    const maxIters = escapes ? 1 : nRevs + 1;
    let start = startDate;
    let end = maxDate;
    let interceptTime: number = Infinity;
    let interceptBody: IOrbitingBody | undefined = undefined;
    for(let i=0; i<maxIters; i++) {
        for(let j=0; j<satelliteBodies.length; j++) {
            const distObj = (d: number) => orbitDistanceFromBody(d, orbit, satelliteBodies[j]);
            const minDistTime = brentMinimize(distObj, start, end);
            const minDist = distObj(minDistTime);
            if(minDist <= satelliteBodies[j].soi && minDistTime < interceptTime) {
                interceptTime = minDistTime;
                interceptBody = satelliteBodies[j];
            }
        }
        // stop the search once an intercept has been found, or if the specified endDate has been exceeded
        if(interceptTime !== Infinity || end > endDate) {
            break
        }
        end = maxDate + orbit.siderealPeriod;
        start = end;
    }

    // if no intercepts were found
    if(interceptBody === undefined) {
        // if the orbit escapes from the attractor's SoI...
        if(escapes) {
            // if the attractor body is the sun (has infinite SoI), return null (there is no next orbit)
            if(soi === Infinity) {
                return null;
            }
            // otherwise, patch the orbit into the attractor body's attractor
            const grandparentId = (attractor as IOrbitingBody).orbiting;
            const grandparent = grandparentId === 0 ? system.sun : system.orbiterIds.get(grandparentId) as ICelestialBody;
            const orbitState = Kepler.orbitToStateAtDate(orbit, attractor, maxDate);
            const bodyState  = Kepler.orbitToStateAtDate((attractor as IOrbitingBody).orbit, grandparent, maxDate);
            const postPatchState: OrbitalState = {
                date: maxDate,
                pos:  add3(orbitState.pos, bodyState.pos),
                vel:  add3(orbitState.vel, bodyState.vel)
            }
            return Kepler.stateToOrbit(postPatchState, grandparent);
        // if the orbit does not escape, return null (there is no next orbit)
        } else {
            return null;
        }
    // If an intercept was found, patch the orbit into the SoI of the satellite body
    } else {
        // for the soonest intercept, get the date where the SoI patch occurs
        const distObj = (d: number) => orbitDistanceFromBody(d, orbit, interceptBody as IOrbitingBody);
        const soiPatchTime = brentRootFind(distObj, start, interceptTime);
        const orbitState = Kepler.orbitToStateAtDate(orbit, attractor, soiPatchTime);
        const bodyState  = Kepler.orbitToStateAtDate((interceptBody as IOrbitingBody).orbit, attractor, maxDate);
        const postPatchState: OrbitalState = {
            date: maxDate,
            pos:  sub3(orbitState.pos, bodyState.pos),
            vel:  sub3(orbitState.vel, bodyState.vel),
        }
        return Kepler.stateToOrbit(postPatchState, interceptBody as IOrbitingBody);
    }
}

// function sortManeuvers(man1: Maneuver, man2: Maneuver): number {
//     return man1.preState.date - man2.preState.date;
// }

export function propagateFlightPlan(startOrbit: IOrbit, system: ISolarSystem, startDate: number, maneuverComponents: ManeuverComponents[], maneuverDates: number[], nRevs: number = 0): Trajectory[] {
    // maneuvers are assumed to be in chronological order
    
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
    for(let i=0; i<=maneuverComponents.length; i++) {
        eDate = i !== maneuverComponents.length ? maneuverDates[i] : Infinity;
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
        if(i !== maneuverComponents.length) {
            const currentAttractor = currentOrbit.orbiting === 0 ? system.sun : system.orbiterIds.get(currentOrbit.orbiting) as IOrbitingBody;
            const preState = Kepler.orbitToStateAtDate(currentOrbit, currentAttractor, maneuverDates[i])
            const maneuver = Kepler.maneuverComponentsToManeuver(maneuverComponents[i], preState);
            nextOrbit = Kepler.stateToOrbit(maneuver.postState, currentAttractor)
            sDate = nextOrbit.epoch;
            intersectTimes.push(sDate);
            orbits.push(nextOrbit);
            maneuvers.push(maneuver);
            currentOrbit = nextOrbit;
        } else {
            // finish off last trajectory
            intersectTimes.push(currentOrbit.epoch + currentOrbit.siderealPeriod);
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

export default propagateFlightPlan;