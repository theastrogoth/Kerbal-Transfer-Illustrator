import MultiFlybyCalculator from "../main/libs/multi-flyby-calculator";

declare var self: DedicatedWorkerGlobalScope;
export {};

self.onmessage = (event: MessageEvent<IMultiFlyby>) => {
    const multiFlyby = event.data;
    const calculator = new MultiFlybyCalculator(multiFlyby);
    calculator.computeFullTrajectory();
    calculator.optimizeSoiPatches();
    self.postMessage(calculator.data); 
}