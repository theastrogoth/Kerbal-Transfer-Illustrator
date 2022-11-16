import Kepler from "./kepler";
import CelestialBody, { OrbitingBody } from "../objects/body";
import SolarSystem from "../objects/system";
import { vec3, mag3, sub3, mult3, dot3, normalize3 } from "./math";

function signalRange(range1: number, range2: number) {
    return Math.sqrt(range1 * range2);
}

export function signalStrength(range1: number, range2: number, pos1: Vector3, pos2: Vector3) {
    const dist = mag3(sub3(pos2, pos1));
    const x = Math.max(0, 1 - (dist / signalRange(range1, range2)));
    return (3 - 2 * x) * x * x;
}

export function signalIsOccluded(pos1: Vector3, pos2: Vector3, pos3: Vector3, radius: number) {
    const signalVec = normalize3(sub3(pos2, pos1));
    const blockVec = sub3(pos3, pos1);
    const dotprod1 = dot3(blockVec, signalVec);
    const dotprod2 = dot3(sub3(pos3, pos2), mult3(signalVec, -1));
    if ((dotprod1 < 0) || (dotprod2 < 0)) { return false }
    const dist = mag3(sub3(blockVec, mult3(signalVec, dotprod1)));
    return dist < radius;
}

export function bodyBlocksComms(pos1: Vector3, pos2: Vector3, bd: CelestialBody, centralBody: CelestialBody, system: SolarSystem, date: number) {
    let bdPos = vec3(0,0,0);
    if (bd.hasOwnProperty("orbiting")) {
        bdPos = Kepler.orbitPositionFromCentralBody((bd as OrbitingBody).orbit, system, centralBody, date);
    }
    return signalIsOccluded(pos1, pos2, bdPos, bd.radius);
}

export function bodiesBlockComms(pos1: Vector3, pos2: Vector3, bd: CelestialBody, centralBody: CelestialBody, system: SolarSystem, date: number) {
    if (bodyBlocksComms(pos1, pos2, bd, centralBody, system, date)) { return true };
    for (let i=0; i<bd.orbiters.length; i++) {
        if (bodiesBlockComms(pos1, pos2, bd.orbiters[i], centralBody, system, date)) { return true };
    }
    return false;
}
