import PorkchopCalculator from "../main/libs/porkchop-calculator";

declare var self: DedicatedWorkerGlobalScope;
export {};

function preparePorkchopPlotData(inputs: PorkchopInputs, timeSettings: TimeSettings): PorkchopPlotData {
    const porkchopCalculator = new PorkchopCalculator(inputs);
    porkchopCalculator.computeAllDeltaVs();
    const porkchop = porkchopCalculator.data;

    const deltaVs = porkchop.deltaVs;
    const startDates = porkchop.startDates;
    const flightTimes = porkchop.flightTimes;

    const levelscale = 1.1;
    const logLevelscale = Math.log(levelscale);
    const nlevels = 16;

    const minDV  = Math.min(...deltaVs.flat());

    const levels = Array.from(Array(nlevels).keys()).map(i => minDV * (levelscale ** i))
    const logLevels = levels.map(i => Math.log(i) / logLevelscale);

    const logDeltaVs = deltaVs.map(i => i.map(j => Math.log(j) / logLevelscale));
    // const logDeltaVs = deltaVs.map(i => i.map(j => j > levels[levels.length - 1] ? NaN : Math.log(j) / logLevelscale));

    const secondsPerDay = 3600*timeSettings.hoursPerDay;
    const startDays = startDates.map(i => i / secondsPerDay);
    const flightDays = flightTimes.map(i => i / secondsPerDay)

    const tickLabels = levels.map(i => Math.floor(i).toString());

    const bestTransfer = porkchopCalculator.bestTransfer;

    const transferStartDay = bestTransfer.startDate / secondsPerDay;
    const transferFlightDay = bestTransfer.flightTime / secondsPerDay;

    return {
        deltaVs,
        startDates,
        flightTimes,
        logDeltaVs,
        startDays,
        flightDays,
        levels,
        logLevels,
        tickLabels,
        bestTransfer,
        transferStartDay,
        transferFlightDay,
    }
}

self.onmessage = (event: MessageEvent<{inputs: PorkchopInputs, timeSettings: TimeSettings}>) => {
    const {inputs, timeSettings} = event.data;
    const plotData = preparePorkchopPlotData(inputs, timeSettings)
    self.postMessage(plotData)    
}