import { clamp, randint } from "./math";


 namespace DifferentialEvolution {
    function createRandomAgent(dim: number){
        const agent: Agent = Array<number>(dim);
        randomizeAgent(agent);
        return agent;
    }

     function randomizeAgent(agent: Agent){
        for(let i = 0; i < agent.length; i++){
            agent[i] = Math.random();
        }
    }

    export function createRandomPopulation(size: number, dim: number){
        const pop: Agent[] = [];
        for(let i = 0; i < size; i++){
            pop.push(createRandomAgent(dim));
        }
        return pop;
    }

    export function evaluatePopulationFitness(pop: Agent[], fitnessFun: (agent: Agent) => number){
        const fit: number[] = Array(pop.length);
        for(let i = 0; i < pop.length; i++) {
            fit[i] = fitnessFun(pop[i]);
        }
        return fit;
    }

    export function evolvePopulation(population: Agent[], fitnesses: number[], fitnessFun: (agent: Agent) => number, cr: number = 0.9, f: number = 0.8){
        const dim = population[0].length;

        const nextPop: Agent[]  = Array(population.length);
        const nextFit: number[] = Array(fitnesses.length);

        for(let j = 0; j < population.length; j++) {
            const x = population[j];
            const fx = fitnesses[j];
            
            const [a, b, c] = pick3(population, j);
            const ri = randint(0, dim - 1);
            const y: Agent = Array(dim).fill(0);
            for(let i = 0; i < dim; i++){
                if(Math.random() < cr || i === ri) {
                    y[i] = a[i] + f * (b[i] - c[i]);
                } else {
                    y[i] = x[i];
                }
                y[i] = clamp(y[i], 0, 1);
            }

            const fy = fitnessFun(y);
            if(fy < fx) {
                nextPop[j] = y;
                nextFit[j] = fy;
            } else {
                nextPop[j] = x;
                nextFit[j] = fx;
            }
        }

        return {
            pop: nextPop,
            fit: nextFit
        }
    }

    function pick3(population: Agent[], parentIndex: number) {
        const swap = (arr: any[], i: number, j: number) => {
            const t = arr[j];
            arr[j] = arr[i];
            arr[i] = t;
        }
        
        swap(population, parentIndex, 0);

        const picked: (Agent | null)[] = [null, null, null];
        const pickedIndices = [0, 0, 0];
        for(let i = 0; i <= 2; i++) {
            const ri = randint(1 + i, population.length - 1);
            picked[i] = population[ri];
            pickedIndices[i] = ri;
            swap(population, ri, i);
        }

        for(let i = 2; i >= 0; i--){
            swap(population, pickedIndices[i], i);
        }
        swap(population, parentIndex, 0);

        return picked as Agent[];
    }
}

export default DifferentialEvolution;