import DifferentialEvolution from "../main/libs/evolution";
import MultiFlybyCalculator from "../main/libs/multi-flyby-calculator";
import FlybyCalcs from "../main/libs/flybycalcs";

declare var self: DedicatedWorkerGlobalScope;
export {};

self.onmessage = (event: MessageEvent<{inputs: MultiFlybySearchInputs, population: Agent[], fitnesses: number[], generation: number, x: number[], bestY: number[], meanY: number[]}>) => {
    const {inputs, population, fitnesses, generation, x, bestY, meanY} = event.data;

    function fitness(agent: Agent, inputs: MultiFlybySearchInputs) {
        const mfinputs = FlybyCalcs.multiFlybyInputsFromAgent(agent, inputs);
        const calculator = new MultiFlybyCalculator(mfinputs);
        return calculator.computeFitness();
    };
    
    const fitnessFun = (agent: Agent) => fitness(agent, inputs);

    let newPopulation: Agent[];
    let newFitnesses: number[];
    // initialize a random population on for the first generation
    if(generation === 0) {
        // console.log("\tinitialize population")
        const numLegs = inputs.flybyIdSequence.length + 1;
        const agentDim = 1 + numLegs;
        const popSize = 200 * agentDim;
        newPopulation = DifferentialEvolution.createRandomPopulation(popSize, agentDim);
        newFitnesses = DifferentialEvolution.evaluatePopulationFitness(newPopulation, fitnessFun);
    // otherwise, evolve the previous population
    } else {
        const res = DifferentialEvolution.evolvePopulation(population, fitnesses, fitnessFun);
        newPopulation = res.pop;
        newFitnesses  = res.fit;
    }
    const newX     = [...x,     generation+1];
    const newBestY = [...bestY, Math.min(...newFitnesses)];
    const newMeanY = [...meanY, newFitnesses.reduce((p,c) => p + c) / newFitnesses.length];

    self.postMessage({inputs, population: newPopulation, fitnesses: newFitnesses, generation: generation+1, x: newX, bestY: newBestY, meanY: newMeanY}); 
}