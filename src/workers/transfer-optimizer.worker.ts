import TransferCalculator from "../main/libs/transfer-calculator";

declare var self: DedicatedWorkerGlobalScope;
export {};

self.onmessage = (event: MessageEvent<ITransfer>) => {
    console.log("\tOptimizing transfer SoI patch positions and times.")

    const transfer = event.data;
    const transferCalculator = new TransferCalculator(transfer);

    let bestFitness = transferCalculator.soiPatchFitness;
    let bestData = transferCalculator.data;
    let posErr = transferCalculator.soiPatchPositionError;
    let timeErr = transferCalculator.soiPatchTimeError;
    let dv = transferCalculator.deltaV;

    console.log("\t\tInitial Errors: ", posErr, timeErr)
    console.log("\t\tInitial delta v: ", dv);
    console.log("\t\tInitial fitness score: ", bestFitness);

    // naive iterative approach
    console.log("\tPerforming naive iteration...")
    transferCalculator.iterateSoiPatches();
    if(transferCalculator.soiPatchFitness < bestFitness) {
        bestFitness = transferCalculator.soiPatchFitness;
        bestData = transferCalculator.data;
        posErr = transferCalculator.soiPatchPositionError;
        timeErr = transferCalculator.soiPatchTimeError;
        dv = transferCalculator.deltaV;
        console.log("\t\tErrors: ", posErr, timeErr)
        console.log("\t\tdelta v: ", dv);
        console.log("\t\tfitness score: ", bestFitness);
    } else {
        console.log("\t\tNaive iteration failed to improve the SoI patch fitness.")
    }

    // global optimization with Differential Evolution (only do this if the error is sufficiently bad)
    if(transferCalculator.soiPatchPositionError + transferCalculator.soiPatchTimeError > 50) {
        console.log("\tPerforming global optimization via differential evolution...")
        transferCalculator.optimizeDE();
        if(transferCalculator.soiPatchFitness < bestFitness) {
            bestFitness = transferCalculator.soiPatchFitness;
            bestData = transferCalculator.data;
            posErr = transferCalculator.soiPatchPositionError;
            timeErr = transferCalculator.soiPatchTimeError;
            dv = transferCalculator.deltaV;
            console.log("\t\tErrors: ", posErr, timeErr)
            console.log("\t\tdelta v: ", dv);
            console.log("\t\tfitness score: ", bestFitness);
        } else {
            console.log("\t\tDE failed to improve the SoI patch fitness.")
        }
    }
    // local optimization with Nelder-Mead (in a shrinking region around the current best solution)
    console.log("\tPerforming local optimization via Nelder-Mead...")
    let step = 0.1;
    let changed = false;
    while(step > 1e-7) {
        transferCalculator.optimizeNM(step);
        if(transferCalculator.soiPatchFitness < bestFitness) {
            bestFitness = transferCalculator.soiPatchFitness;
            bestData = transferCalculator.data;
            posErr = transferCalculator.soiPatchPositionError;
            timeErr = transferCalculator.soiPatchTimeError;
            dv = transferCalculator.deltaV;
            changed = true;
        }
        step = step/10;
    }
    if(!changed) {
        console.log("\t\tNM failed to improve the SoI patch fitness.")
    }

    console.log("\t\tFinal errors: ", posErr, timeErr)
    console.log("\t\tFinal delta v: ", dv);
    console.log("\t\tFinal fitness score: ", bestFitness);

    self.postMessage(bestData); 
}