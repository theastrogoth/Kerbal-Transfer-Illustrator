import Kepler from "./kepler";
import Trajectories from "./trajectories";
import { mag3, sub3 } from "./math";

function signalRange(range1: number, range2: number) {
    return Math.sqrt(range1 * range2);
}

export function signalStrength(range1: number, range2: number, pos1: Vector3, pos2: Vector3, system: ISolarSystem) {
    const dist = mag3(sub3(pos2, pos1));
    const x = Math.max(0, 1 - (dist / signalRange(range1, range2)));
    return (3 - 2 * x) * x * x;
}
