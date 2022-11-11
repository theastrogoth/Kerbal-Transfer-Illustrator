import { Orbit } from "./orbit";
import Color from "./color";

class Vessel implements IVessel {
    readonly name:          string;
    readonly orbit:         Orbit;
    readonly maneuvers:     ManeuverComponents[];
    readonly color:         Color;
    readonly type:          VesselType;
    readonly commRange:     number;

    constructor(data: IVessel, system: ISolarSystem) {
        this.name = data.name;
        const body = data.orbit.orbiting === 0 ? system.sun : (system.orbiterIds.get(data.orbit.orbiting) as IOrbitingBody);
        this.orbit = new Orbit(data.orbit, body);
        this.maneuvers = data.maneuvers ? data.maneuvers : [] as ManeuverComponents[];
        this.color = new Color(data.color || {r: 255, g: 255, b: 255});
        this.type = data.type || "Ship";
        this.commRange = data.commRange || 0;
    }
}

export default Vessel;