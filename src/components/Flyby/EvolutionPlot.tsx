import MultiFlybyCalculator from "../../main/libs/multi-flyby-calculator";
import FlybyCalcs from "../../main/libs/flybycalcs";
import DifferentialEvolution from "../../main/libs/evolution";

import React, { useEffect, useRef, useState } from "react";
import Plot from "react-plotly.js";

import { useAtom } from "jotai";
import { multiFlybyAtom, unrefinedMultiFlybyAtom, evolutionPlotDataAtom } from "../../App";

export type EvolutionPlotData = {
    x:              number[],
    meanY:          number[],
    bestY:          number[],
}
type EvolutionPlotProps = {
    inputs:         MultiFlybySearchInputs, 
    buttonPresses:  number, 
    setCalculating: React.Dispatch<React.SetStateAction<boolean>>,
}

const getFitnessFun = (inputs: MultiFlybySearchInputs) => (agent: Agent) => {
    const mfinputs = FlybyCalcs.multiFlybyInputsFromAgent(agent, inputs);
    const calculator = new MultiFlybyCalculator(mfinputs);
    return calculator.computeFitness();
};

const bestFitness = (fitnesses: number[]) => Math.min(...(fitnesses.filter(value => !isNaN(value))));
const meanFitness = (fitnesses: number[]) => {
    const validFitnesses = fitnesses.filter(value => !isNaN(value));
    return validFitnesses.reduce((p,c) => p + c, 0) / validFitnesses.length;
}

function shuffleArraysTogether(array1: any[], array2: any[]) {
    // if the arrays aren't the same length, shuffle only the shared indices
    for (let i = Math.min(array1.length, array2.length) - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array1[i], array1[j]] = [array1[j], array1[i]];
        [array2[i], array2[j]] = [array2[j], array2[i]];
    }
}

const getChunks = (population: Agent[], fitnesses: number[]) => {
    const chunkSize = Math.floor(fitnesses.length / maxWorkers);
    shuffleArraysTogether(population, fitnesses);
    const chunks: {pop: Agent[], fit: number[]}[] = [];
    let nextIdx = 0;
    for(let i=0; i<maxWorkers; i++) {
        const newChunk = {
            pop: population.slice(nextIdx, nextIdx + chunkSize),
            fit: fitnesses.slice(nextIdx, nextIdx + chunkSize)
        }
        nextIdx += chunkSize;
        chunks.push!(newChunk)
    }
    return chunks;
}

const maxWorkers = Math.min(Math.floor(navigator.hardwareConcurrency - 1), 4);
const maxGenerations = 1000;
const agentsPerDim = 250;
const rtol = 0.01;
const CR = 0.9;
const F = 0.3;
const timeoutAfter = 120000;    // two minutes

function createWorkers(numWorker: number) {
    const workers: Worker[] = [];
    for(let i=0; i<numWorker; i++) {
        workers.push(new Worker(new URL("../../workers/multi-flyby-search.worker.ts", import.meta.url)));
    }
    return workers;
} 

function evolveChunk(worker: Worker, chunk: PopChunk, inputs: MultiFlybySearchInputs, cr: number, f: number) {
    return new Promise<PopChunk>((resolve) => {
        worker.onmessage = (event: MessageEvent<PopChunk>) => resolve(event.data);
        worker.postMessage({chunk, inputs, cr, f});
    })
}

function evolvePopulation(workers: Worker[], population: Agent[], fitnesses: number[], inputs: MultiFlybySearchInputs, cr: number, f: number) {
    const chunks = getChunks(population, fitnesses);
    return Promise.all(workers.map((worker, index) => evolveChunk(worker, chunks[index], inputs, cr, f)));
}

const workers = createWorkers(maxWorkers);

function EvolutionPlot({inputs, buttonPresses, setCalculating}: EvolutionPlotProps) {
    const [, setMultiFlyby] = useAtom(multiFlybyAtom);
    const [, setUnrefinedMultiFlyby] = useAtom(unrefinedMultiFlybyAtom);
    const [plotData, setPlotData] = useAtom(evolutionPlotDataAtom);
    const [generation, setGeneration] = useState<number | null>(null);
    const population = useRef<Agent[]>([]);
    const fitnesses = useRef<number[]>([]);
    const fitnessFun = useRef(getFitnessFun(inputs));
    const timer = useRef<NodeJS.Timeout | null>(null);
    const timeIsUp = useRef(false);

    useEffect(() => {
        if(buttonPresses > 0) {
            console.log('Starting trajectory search...');
            setCalculating(true);
            const numLegs = inputs.flybyIdSequence.length + 1;
            const numDSMs = inputs.DSMperLeg.reduce((p,c) => p + c);
            const agentDim = 1 + numLegs + 4 * numDSMs;
            const popSize = agentsPerDim * agentDim;
            fitnessFun.current = getFitnessFun(inputs);
            population.current = DifferentialEvolution.createRandomPopulation(popSize, agentDim);
            fitnesses.current = DifferentialEvolution.evaluatePopulationFitness(population.current, fitnessFun.current); 
            setPlotData({ x: [0], bestY: [bestFitness(fitnesses.current)], meanY: [meanFitness(fitnesses.current)] })
            setGeneration(0);
            timer.current = setTimeout(() => timeIsUp.current = true, timeoutAfter);
            timeIsUp.current = false;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [inputs])

    useEffect(() => {
        if(generation !== null) {
            if(generation < maxGenerations && !timeIsUp.current) {
                evolvePopulation(workers, population.current, fitnesses.current, inputs, CR, F)
                .then((newChunks) => {
                    if(newChunks) {
                        population.current = newChunks.map(chunk => chunk.pop).flat();
                        fitnesses.current = newChunks.map(chunk => chunk.fit).flat();
                        const bestY = bestFitness(fitnesses.current);
                        const meanY = meanFitness(fitnesses.current);
                        setPlotData((prevData) => {
                            const newX = [...prevData.x, generation as number + 1 ];
                            const newBestY = [...prevData.bestY, bestY];
                            const newMeanY = [...prevData.meanY, meanY];
                            return {x: newX, bestY: newBestY, meanY: newMeanY}
                        })
                        const percentDiff = 2 * (meanY - bestY) / (meanY + bestY);
                        if(percentDiff < rtol) {
                            setGeneration(() => maxGenerations + 1);
                        } else {
                            setGeneration((prevGeneration) => prevGeneration as number + 1);
                        }
                    }
                })
            } else {
                setCalculating(false);
                setGeneration(null);
                timer.current = null;
                const bestIdx = fitnesses.current.findIndex(fitness => fitness === bestFitness(fitnesses.current));
                const mfInputs = FlybyCalcs.multiFlybyInputsFromAgent(population.current[bestIdx], inputs);
                const calculator = new MultiFlybyCalculator(mfInputs);
                calculator.computeFullTrajectory();
                const newMultiFlyby = calculator.multiFlyby;
                setMultiFlyby(newMultiFlyby)
                setUnrefinedMultiFlyby(newMultiFlyby);
                console.log('...trajectory search completed.');
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [generation])

    return (
        <Plot
            data={[
                { 
                    x: plotData.x,
                    y: plotData.bestY,
                    type: 'scatter',
                    mode: 'lines',
                    line: {
                        color:  'blue',
                    },
                    name: 'best Δv',
                },
                {
                    x: plotData.x,
                    y: plotData.meanY,
                    type: 'scatter',
                    mode: 'lines',
                    line: {
                        color:  'orange',

                    },
                    name: 'mean Δv',
                }
            ]}
            useResizeHandler
            style={{ width: '100%', height: '300px' }}
            layout={{
                uirevision:     "Evolution",
                autosize:       true,
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(0,0,0,0)',
                legend: {
                    xanchor:        "right",
                    // font:           {color: "white"},
                    // bgcolor:        'rgba(0,0,0,0)'
                },
                margin:         {l: 150, r: 140, b: 40, t: 28},
                xaxis: {
                    title:  'Generation #'
                },
                yaxis: {
                    type:   'log',
                    title:  'Total Δv'
                },
            }}
            // frames={[]}
            // config={{}}
        />
    )
}

export default EvolutionPlot;