import { Orbit } from "./orbit";

class Vessel implements IVessel {
    readonly name:          string;
    readonly orbit:         Orbit;
    readonly maneuvers:     ManeuverComponents[];

    constructor(data: IVessel, system: ISolarSystem) {
        this.name = data.name;
        const body = data.orbit.orbiting === 0 ? system.sun : (system.orbiterIds.get(data.orbit.orbiting) as IOrbitingBody);
        this.orbit = new Orbit(data.orbit, body);
        this.maneuvers = data.maneuvers ? data.maneuvers : [] as ManeuverComponents[];
    }
}

export default Vessel;