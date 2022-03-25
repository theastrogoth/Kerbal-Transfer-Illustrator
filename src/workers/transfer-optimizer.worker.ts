import TransferCalculator from "../main/libs/transfer-calculator";

declare var self: DedicatedWorkerGlobalScope;
export {};

self.onmessage = (event: MessageEvent<ITransfer>) => {
    const transfer = event.data;
    const transferCalculator = new TransferCalculator(transfer);
    transferCalculator.optimizeSoiPatches();
    self.postMessage(transferCalculator.data)   ; 
}