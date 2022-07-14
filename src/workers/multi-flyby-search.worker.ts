import DifferentialEvolution from "../main/libs/evolution";
import MultiFlybyCalculator from "../main/libs/multi-flyby-calculator";
import FlybyCalcs from "../main/libs/flybycalcs";

declare var self: DedicatedWorkerGlobalScope;
export {};

const getFitnessFun = (inputs: MultiFlybySearchInputs) => (agent: Agent) => {
    const mfinputs = FlybyCalcs.multiFlybyInputsFromAgent(agent, inputs);
    const calculator = new MultiFlybyCalculator(mfinputs);
    return calculator.computeFitness();
};

function evolveChunk(chunk: PopChunk, inputs: MultiFlybySearchInputs, cr: number, f: number) {
    const {pop, fit} = chunk;
    const newChunk = DifferentialEvolution.evolvePopulation(pop, fit, getFitnessFun(inputs), cr, f);
    return newChunk;
}

self.onmessage = (event: MessageEvent<{chunk: PopChunk, inputs: MultiFlybySearchInputs, cr: number, f: number}>) => {
    const {chunk, inputs, cr, f} = event.data;
    const newChunk = evolveChunk(chunk, inputs, cr, f)
    self.postMessage(newChunk); 
}