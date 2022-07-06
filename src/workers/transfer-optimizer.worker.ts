import { mag3 } from "../main/libs/math";
import TransferCalculator from "../main/libs/transfer-calculator";

declare var self: DedicatedWorkerGlobalScope;
export {};

self.onmessage = (event: MessageEvent<ITransfer>) => {
    console.log("\tOptimizing transfer SoI patch positions and times.")

    const transfer = event.data;
    const transferCalculator = new TransferCalculator(transfer);
    console.log("\t\tInitial Errors: ", transferCalculator.soiPatchPositionError, transferCalculator.soiPatchTimeError)

    // naive iterative approach (only do this if this is the first attempt at optimization)
    if(transfer.soiPatchPositions.reduce((p,c) => p + mag3(c), 0) < 1) {
        console.log("\t\tPerforming naive iteration...")
        transferCalculator.iterateSoiPatches();
        console.log("\t\tErrors: ", transferCalculator.soiPatchPositionError, transferCalculator.soiPatchTimeError)
    }
    // global optimization with Differential Evolution (only do this if the error is sufficiently bad)
    if(transferCalculator.soiPatchPositionError + transferCalculator.soiPatchTimeError > 50) {
        console.log("\t\tPerforming global optimization via differential evolution...")
        transferCalculator.optimizeDE();
        console.log("\t\tErrors: ", transferCalculator.soiPatchPositionError, transferCalculator.soiPatchTimeError)
    }
    // local optimization with Nelder-Mead (in a shrinking region around the DE solution)
    console.log("\t\tPerforming local optimization via Nelder-Mead...")
    let step = 0.25;
    while(step > 0) {
        transferCalculator.optimizeNM(step);
        step -= 0.025;
    }
    console.log("\t\tErrors: ", transferCalculator.soiPatchPositionError, transferCalculator.soiPatchTimeError)

    self.postMessage(transferCalculator.data); 
}