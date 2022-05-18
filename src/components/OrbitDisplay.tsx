import React, {useEffect, useState } from "react";
import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";

import DateField, { DateFieldState } from "./DateField";
import OrbitPlot from "./OrbitPlot";

import Kepler from "../main/libs/kepler";
import Draw from "../main/libs/draw";
import { calendarDateToString, timeToCalendarDate, vec3, wrapAngle } from "../main/libs/math";
import { CelestialBody, isOrbitingBody } from "../main/objects/body";
import { timeFromDateFieldState, useDateField } from "../utils";

export type OrbitDisplayProps = {
    index:              number,
    label:              string,
    marks:              {value: number, label: string}[]
    centralBody:        CelestialBody,
    orbits:             IOrbit[],
    trajectories?:      Trajectory[],
    startDate:          number,
    endDate:            number,
    defaultTraces:      OrbitPlotTraces,
    plotSize:           number,
    slider?:            boolean,
    timeSettings:       TimeSettings,   
}

function updateOrbitColorFade(newStartAngle: number, trace: Line3DTrace) {
    if(typeof trace.line!.color === "string") {
        return trace
    }
    const newTrace = Object.assign({}, trace);
    const oldColor = (trace.line!.color as number[]);
    newTrace.line!.color = oldColor.map(c => wrapAngle(c, newStartAngle));
    return newTrace
}

export function updateTrajectoryMarker(date: number, trajectory: Trajectory, trace: Marker3DTrace) {
    const newTrace = Object.assign({}, trace);

    let orbIdx = -1;
    for(let i=0; i<trajectory.orbits.length; i++) {
        orbIdx = (date > trajectory.intersectTimes[i] && date < trajectory.intersectTimes[i+1]) ? i : orbIdx;
    }

    const pos = orbIdx === -1 ? vec3(NaN, NaN, NaN) : Kepler.orbitToPositionAtDate(trajectory.orbits[orbIdx], date);
    newTrace.x = [pos.x];
    newTrace.y = [pos.y];
    newTrace.z = [pos.z];

    return newTrace
}

function updateDate(date: number, centralBody: CelestialBody, orbits: IOrbit[], trajectories: Trajectory[] | undefined, traces: OrbitPlotTraces) {
    const newTraces = Object.assign({}, traces);
    // update orbiting bodies
    const orbBodies = centralBody.orbiters;
    for(let i=0; i<orbBodies.length; i++) {
        const newStartAngle = Kepler.dateToOrbitTrueAnomaly(date, orbBodies[i].orbit);
        newTraces.systemTraces.bodyOrbitTraces[i]    = updateOrbitColorFade(newStartAngle, traces.systemTraces.bodyOrbitTraces[i]);
        newTraces.systemTraces.orbitingBodyTraces[i] = Draw.drawOrbitingBodySphereAtAngle(orbBodies[i], newStartAngle)
        newTraces.systemTraces.orbitingSoiTraces[i]  = Draw.drawSoiSphereAtAngle(orbBodies[i], newStartAngle)
    }
    // update the central body orbit
    if(isOrbitingBody(centralBody)) {
        newTraces.systemTraces.centralBodyOrbitTrace = Draw.drawCentralBodyOrbitAtTime(centralBody, date);
    }
    // update other orbits
    for(let i=0; i<orbits.length; i++) {
        const newStartAngle = Kepler.dateToOrbitTrueAnomaly(date, orbits[i]);
        newTraces.orbitTraces[i] = updateOrbitColorFade(newStartAngle, traces.orbitTraces[i]);
    }
    // update the trajectory marker
    if(trajectories !== undefined && traces.markerTraces !== undefined) {
        newTraces.markerTraces = trajectories.map((traj, idx) => updateTrajectoryMarker(date, traj, (traces.markerTraces as Marker3DTrace[])[idx]));
    }
    return newTraces
}

export function updateYDHwithDate(dateField: DateFieldState, date: number, timeSettings: TimeSettings) {
    const calendarDate = timeToCalendarDate(date, timeSettings, 1, 1);
    dateField.setYear(String(calendarDate.year));
    dateField.setDay(String(calendarDate.day));
    dateField.setHour(String(calendarDate.hour + (calendarDate.minute * 60 + calendarDate.second) / 3600));    
}

function OrbitDisplay({index, label, marks, centralBody, orbits, trajectories, startDate, endDate, defaultTraces, plotSize, timeSettings, slider=true}: OrbitDisplayProps) {
    const [date, setDate] = useState(startDate);
    const [fieldsDate, setFieldsDate] = useState(startDate);
    const [updateFields, setUpdateFields] = useState(false);
    const [traces, setTraces] = useState(defaultTraces);

    const defaultCalendarDate = timeToCalendarDate(startDate, timeSettings, 1, 1)
    const dateField = useDateField(String(defaultCalendarDate.year), String(defaultCalendarDate.day), String(defaultCalendarDate.hour));

    useEffect(() => {
        const d = Math.ceil(startDate)
        setDate(d);
        updateYDHwithDate(dateField, d, timeSettings)
        setFieldsDate(d)
        const newTraces = updateDate(d, centralBody, orbits, trajectories, defaultTraces);
        setTraces(newTraces)
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [startDate, defaultTraces]);

    useEffect(() => {
        const newTraces = updateDate(date, centralBody, orbits, trajectories, traces);
        setTraces(newTraces);  
        if(updateFields) {
            updateYDHwithDate(dateField, date, timeSettings)
            setFieldsDate(date)
            setUpdateFields(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [date, updateFields, timeSettings]);

    useEffect(() => {
        const newDate = timeFromDateFieldState(dateField, timeSettings, 1, 1);
        if(newDate !== fieldsDate) {
            setDate(newDate)
            setFieldsDate(newDate)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateField, timeSettings]);

    return (
        <>
            <OrbitPlot uirevision={label} plotSize={plotSize} traces={traces}/>
            <Stack sx={{my: 1}} display="flex" alignItems="center" justifyContent="center">
                <Box display="flex" alignItems="center" justifyContent="center" minWidth="250px" maxWidth="350px">
                    <DateField id={'plot-date'} label={'Date'} state={dateField} correctFormat={true} timeSettings={timeSettings} />
                </Box>
                {/* @ts-ignore */}
                { slider ? <Slider
                    sx={{ width: "60%" }}
                    valueLabelDisplay="auto"
                    value={date}
                    valueLabelFormat={(d: number) => calendarDateToString(timeToCalendarDate(d, timeSettings, 1, 1))}
                    min={Math.ceil(startDate)}     
                    max={Math.floor(endDate)}
                    step={Math.max((endDate-startDate)/1000, 1)}
                    marks={marks}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => setDate(Number(event.target.value)) }
                    onChangeCommitted={(event: React.SyntheticEvent<Element, Event>, value: number) => { setUpdateFields(true) }}
                /> : <></> }
            </Stack>
        </>
    )
}

// export default React.memo(OrbitDisplay)
export default React.memo(OrbitDisplay);