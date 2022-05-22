import SolarSystem from "../main/objects/system";
import vesselToFlightPlan from "../main/libs/propagate";

declare var self: DedicatedWorkerGlobalScope;
export {};

self.onmessage = (event: MessageEvent<{vesselPlans: IVessel[], system: SolarSystem}>) => {
    const {vesselPlans, system} = event.data;
    const flightPlans = vesselPlans.map(v => vesselToFlightPlan(v, system));
    self.postMessage(flightPlans);
}