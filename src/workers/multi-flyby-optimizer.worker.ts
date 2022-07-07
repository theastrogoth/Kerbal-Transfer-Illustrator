import MultiFlybyCalculator from "../main/libs/multi-flyby-calculator";
import { mag3 } from "../main/libs/math";

declare var self: DedicatedWorkerGlobalScope;
export {};

self.onmessage = (event: MessageEvent<IMultiFlyby>) => {
    const multiFlyby = event.data;
    const calculator = new MultiFlybyCalculator(multiFlyby);
    calculator.computeFullTrajectory();
    console.log("\t\tInitial Errors: ", calculator.soiPatchPositionError, calculator.soiPatchTimeError)
    console.log("\t\tInitial delta v: ", calculator.deltaV);

    // naive iterative approach (only do this if this is the first attempt at optimization)
    if(multiFlyby.soiPatchPositions.reduce((p,c) => p + mag3(c), 0) < 1) {
        console.log("\t\tPerforming naive iteration...")
        calculator.iterateSoiPatches();
        console.log("\t\tErrors: ", calculator.soiPatchPositionError, calculator.soiPatchTimeError)
        console.log("\t\tdelta v: ", calculator.deltaV);
    }
    
    self.postMessage(calculator.data); 
}