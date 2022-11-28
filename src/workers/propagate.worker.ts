import SolarSystem from "../main/objects/system";
import vesselToFlightPlan from "../main/libs/propagate";
import Kepler from "../main/libs/kepler";
import SolarSystemUtils from "../main/libs/systemutils";
import { degToRad } from "../main/libs/math";

declare var self: DedicatedWorkerGlobalScope;
export {};

self.onmessage = (event: MessageEvent<{vesselPlans: IVessel[], system: SolarSystem}>) => {
    const {vesselPlans, system} = event.data;
    const radsVesselPlans = vesselPlans.map(v => { 
        const body = SolarSystemUtils.bodyFromId(system, v.orbit.orbiting);
        return {...v, orbit: Kepler.orbitFromElements({
            ...v.orbit,
            inclination:        degToRad(v.orbit.inclination),
            argOfPeriapsis:     degToRad(v.orbit.argOfPeriapsis),
            ascNodeLongitude:   degToRad(v.orbit.ascNodeLongitude),
        }, body)};
    });
    const flightPlans = radsVesselPlans.map(v => vesselToFlightPlan(v, system));
    self.postMessage(flightPlans);
}