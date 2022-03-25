import { Orbit } from "./orbit";

class Vessel implements IVessel {
    readonly name:      string;
    readonly orbit:     Orbit;

    constructor(data: IVessel, system: ISolarSystem) {
        this.name = data.name;
        const body = data.orbit.orbiting === 0 ? system.sun : (system.orbiterIds.get(data.orbit.orbiting) as IOrbitingBody);
        this.orbit = new Orbit(data.orbit, body);
    }
}

export default Vessel;