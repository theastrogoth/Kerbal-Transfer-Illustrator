import MultiFlybyCalculator from "../main/libs/multi-flyby-calculator";

declare var self: DedicatedWorkerGlobalScope;
export {};

self.onmessage = (event: MessageEvent<IMultiFlyby>) => {
    const multiFlyby = event.data;
    const calculator = new MultiFlybyCalculator(multiFlyby);
    calculator.computeFullTrajectory();

    let bestFitness = calculator.soiPatchFitness;
    let bestData = calculator.data;
    let posErr = calculator.soiPatchPositionError;
    let timeErr = calculator.soiPatchTimeError;
    let dv = calculator.deltaV;

    console.log("\t\tInitial errors: ", posErr, timeErr)
    console.log("\t\tInitial delta v: ", dv);
    console.log("\t\tInitial fitness score: ", bestFitness);

    // naive iterative approach
    console.log("\tPerforming naive iteration...")
    calculator.iterateSoiPatches();
    if(calculator.soiPatchFitness < bestFitness) {
        bestFitness = calculator.soiPatchFitness;
        bestData = calculator.data;
        posErr = calculator.soiPatchPositionError;
        timeErr = calculator.soiPatchTimeError;
        dv = calculator.deltaV;
        console.log("\t\terrors: ", posErr, timeErr)
        console.log("\t\tdelta v: ", dv);
        console.log("\t\tfitness score: ", bestFitness);
    } else {
        console.log("\t\tNaive iteration failed to improve the SoI patch fitness.")
    }

    // global optimization with Differential Evolution (only do this if the error is sufficiently bad)
    if(calculator.soiPatchPositionError + calculator.soiPatchTimeError > 500) {
        console.log("\tPerforming global optimization via differential evolution...")
        calculator.optimizeDE();
        if(calculator.soiPatchFitness < bestFitness) {
            bestFitness = calculator.soiPatchFitness;
            bestData = calculator.data;
            posErr = calculator.soiPatchPositionError;
            timeErr = calculator.soiPatchTimeError;
            dv = calculator.deltaV;
            console.log("\t\terrors: ", posErr, timeErr)
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
        calculator.optimizeNM(step);
        if(calculator.soiPatchFitness < bestFitness) {
            bestFitness = calculator.soiPatchFitness;
            bestData = calculator.data;
            posErr = calculator.soiPatchPositionError;
            timeErr = calculator.soiPatchTimeError;
            dv = calculator.deltaV;
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