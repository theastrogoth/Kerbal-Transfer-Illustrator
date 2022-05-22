import React, { useEffect } from "react";
import Plot from "react-plotly.js";
import Box from "@mui/material/Box";
import Fade from "@mui/material/Fade";

import TransferCalculator from "../../main/libs/transfer-calculator";
import Transfer from "../../main/objects/transfer"

type PorkchopPlotProps = {
    inputs:         PorkchopInputs,
    plotData:       PorkchopPlotData,
    timeSettings:   TimeSettings, 
    startDate:      number, 
    flightTime:     number, 
    plotCount:      number, 
    setPlotData:    React.Dispatch<React.SetStateAction<PorkchopPlotData>>,
    setTransfer:    React.Dispatch<React.SetStateAction<Transfer>>, 
    setCalculating: React.Dispatch<React.SetStateAction<boolean>>, 
}

const porkchopWorker = new Worker(new URL("../../workers/porkchop.worker.ts", import.meta.url));

function PorkchopPlot({inputs, plotData, timeSettings, plotCount, setPlotData, setTransfer, setCalculating}: PorkchopPlotProps) {

    useEffect(() => {
        porkchopWorker.onmessage = (event: MessageEvent<PorkchopPlotData>) => {
            if (event && event.data) {
                console.log("...Porkchop worker returned new plot data with best transfer.")
                setPlotData(event.data)
                setTransfer(new Transfer(event.data.bestTransfer))
                setCalculating(false);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [porkchopWorker]);

    useEffect(() => {
        if (plotCount !== 0) {
            console.log('Starting Porkchop worker with new inputs...')
            setCalculating(true);
            porkchopWorker
                .postMessage({inputs, timeSettings});
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [inputs]);

    return (
        inputs.nTimes === 0 ?
        <Box width="100%" height="450px" justifyContent="center" textAlign="center" display="flex" flexDirection={"column"}>
        A Porkchop Plot will be generated here.
        </Box> 
        :
        <Fade in={plotData.logDeltaVs.length > 1} timeout={400}>
            <Box>
                <Plot
                    data={[
                        { 
                            z: plotData.logDeltaVs,
                            x: plotData.startDays,
                            y: plotData.flightDays,
                            type: 'contour',
                            colorscale: 'Viridis',
                            reversescale: true,
                            // There seems to be an issue with types for contour plots in react-plotly.js
                            // TS predicts an error, but the following code works
                            // @ts-ignore
                            contours: {
                                start: plotData.logLevels[0]+0.05,
                                end: plotData.logLevels[plotData.logLevels.length-1],
                                size: (plotData.logLevels[plotData.logLevels.length-1] - plotData.logLevels[0]) / plotData.logLevels.length,
                                coloring: "heatmap",
                            },
                            colorbar: {
                                title: 'Δv (m/s)',
                                tickvals: plotData.logLevels,
                                ticktext: plotData.tickLabels,
                            },
                            customdata: plotData.deltaVs,
                            hovertemplate: 'Δv = %{customdata:.2f} m/s<extra></extra>',
                        },
                        {
                            x: [plotData.transferStartDay],
                            y: [plotData.transferFlightDay],
                            type: 'scatter',
                            mode: 'markers',
                            marker: {
                                color:  'black',
                                size:   10,
                                symbol: 'x',
                            },
                            hoverinfo: 'skip',
                        }
                    ]}
                    useResizeHandler
                    style={{ width: '100%', height: '100%' }}
                    layout={{
                        uirevision:     "Porkchop",
                        autosize:       true,
                        margin:         {l: 50, r: 40, b: 40, t: 28},
                        paper_bgcolor:  'rgba(0,0,0,0)',
                        plot_bgcolor:   'rgba(0,0,0,0)',
                        xaxis: {
                            showspikes:     true,
                            spikemode:      'across',
                            spikecolor:     "rgb(200, 200, 200)",
                            spikedash:      'solid',
                            spikethickness: -1,
                            showgrid:       false,
                            title:          "Departure Day #"
                        },
                        yaxis: {
                            showspikes:     true,
                            spikemode:      'across',
                            spikecolor:     "rgb(200, 200, 200)",
                            spikedash:      'solid',
                            spikethickness: -1,
                            showgrid:       false,
                            title:          "Flight Duration (days)"
                        },
                    }}
                    onClick={(eventData: any) => {
                        const newPlotData = Object.assign({}, plotData)
                        newPlotData.transferStartDay = (eventData.points[0].x);
                        newPlotData.transferFlightDay = (eventData.points[0].y);

                        const secPerDay = 3600 * timeSettings.hoursPerDay;
                        const startDate = secPerDay * eventData.points[0].x;
                        const flightTime = secPerDay * eventData.points[0].y;

                        const transferCalculator = new TransferCalculator({
                            system:                 inputs.system,
                            startOrbit:             inputs.startOrbit,
                            endOrbit:               inputs.endOrbit,
                            startDate,
                            flightTime,
                            ejectionInsertionType:  inputs.ejectionInsertionType,
                            planeChange:            inputs.planeChange,
                            matchStartMo:           inputs.matchStartMo,
                            matchEndMo:             inputs.matchEndMo,
                            noInsertionBurn:        inputs.noInsertionBurn,
                        })
                        newPlotData.bestTransfer = transferCalculator.data;
                        console.log('Recalculated transfer after Porkchop click.')
                        setTransfer(transferCalculator.transfer);
                        setPlotData(newPlotData);
                        }
                    }
                    onRelayout={(eventData: any) => {
                        if( eventData["xaxis.range[0]"] || eventData["yaxis.range[0]"] ) {
                            const secondsPerDay = timeSettings.hoursPerDay * 3600;
                            const newInputs: PorkchopInputs = Object.assign(inputs);
                            if(eventData["xaxis.range[0]"]) {
                                newInputs.startDateMin  = eventData["xaxis.range[0]"] * secondsPerDay;
                                newInputs.startDateMax  = eventData["xaxis.range[1]"] * secondsPerDay;
                            }
                            if(eventData["yaxis.range[0]"]) {
                                newInputs.flightTimeMin = Math.max(1, eventData["yaxis.range[0]"] * secondsPerDay);
                                newInputs.flightTimeMax = Math.max(1, eventData["yaxis.range[1]"] * secondsPerDay);
                            }
                            console.log('Starting Porkchop worker after relayout (zoom or pan)...');
                            setCalculating(true);
                            porkchopWorker
                                .postMessage({inputs: newInputs, timeSettings});
                        }
                    }
                    }
                    // frames={[]}
                    // config={{}}
                />
            </Box>
        </Fade>
    )
}

export default React.memo(PorkchopPlot);