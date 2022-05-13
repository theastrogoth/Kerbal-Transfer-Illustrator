import MultiFlyby from "../../main/objects/multiflyby";
import MultiFlybyCalculator from "../../main/libs/multi-flyby-calculator";
import FlybyCalcs from "../../main/libs/flybycalcs";

import React, { useEffect, useState } from "react";
import Plot from "react-plotly.js";

export type EvolutionPlotData = {
    x:              number[],
    setX:           React.Dispatch<React.SetStateAction<number[]>>,
    meanY:          number[],
    setMeanY:       React.Dispatch<React.SetStateAction<number[]>>,
    bestY:          number[],
    setBestY:       React.Dispatch<React.SetStateAction<number[]>>,
}
type EvolutionPlotProps = {
    inputs:         MultiFlybySearchInputs, 
    plotData:       EvolutionPlotData,
    buttonPresses:  number, 
    searchCount:    number,
    setMultiFlyby:  React.Dispatch<React.SetStateAction<MultiFlyby>>,
    setCalculating: React.Dispatch<React.SetStateAction<boolean>>,
    setSearchCount: React.Dispatch<React.SetStateAction<number>>
}

const multiFlybyOptWorker = new Worker(new URL("../../workers/multi-flyby-search.worker.ts", import.meta.url));

function EvolutionPlot({inputs, plotData, buttonPresses, searchCount, setMultiFlyby, setCalculating, setSearchCount}: EvolutionPlotProps) {
    const [x, setX] = useState(plotData.x);
    const [meanY, setMeanY] = useState(plotData.meanY);
    const [bestY, setBestY] = useState(plotData.bestY);

    useEffect(() => {
        multiFlybyOptWorker.onmessage = (event: MessageEvent<{inputs: MultiFlybySearchInputs, population: Agent[], fitnesses: number[], generation: number, x: number[], bestY: number[], meanY: number[]}>) => {
            if (event && event.data) {
                setX(event.data.x);
                setBestY(event.data.bestY);
                setMeanY(event.data.meanY);

                const lastBestY = event.data.bestY[event.data.bestY.length - 1];
                const lastMeanY = event.data.meanY[event.data.meanY.length - 1];
                const percentDiff = (lastMeanY - lastBestY) / lastBestY;

                if(event.data.generation < 500 && percentDiff > 0.01) {
                    multiFlybyOptWorker
                        .postMessage({inputs: event.data.inputs, population: event.data.population, fitnesses: event.data.fitnesses, generation: event.data.generation, x: event.data.x, bestY: event.data.bestY, meanY: event.data.meanY})
                } else {
                    console.log("...trajectory search completed.")
                    let bestIdx = -1;
                    for(let i=0; i<event.data.population.length; i++) {
                        if(event.data.fitnesses[i] === event.data.bestY[event.data.bestY.length - 1]) {
                            bestIdx = i; 
                            break
                        }
                    }
                    const mfInputs = FlybyCalcs.multiFlybyInputsFromAgent(event.data.population[bestIdx], event.data.inputs);
                    const calculator = new MultiFlybyCalculator(mfInputs);
                    calculator.computeFullTrajectory();
                    setMultiFlyby(calculator.multiFlyby)
                    setCalculating(false);
                    setSearchCount(searchCount + 1);
                    plotData.setX(event.data.x);
                    plotData.setMeanY(event.data.meanY);
                    plotData.setBestY(event.data.bestY);
                }
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [multiFlybyOptWorker]);

    useEffect(() => {
        if(buttonPresses > 0) {
            console.log('Starting trajectory search...')
            setCalculating(true);
            multiFlybyOptWorker
                .postMessage({inputs, population: [], fitnesses: [], generation: 0, x: [], bestY: [], meanY: []});
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [inputs]);

    return (
        <Plot
            data={[
                { 
                    x: x,
                    y: bestY,
                    type: 'scatter',
                    mode: 'lines',
                    line: {
                        color:  'blue',
                    },
                    name: 'best Δv',
                },
                {
                    x: x,
                    y: meanY,
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