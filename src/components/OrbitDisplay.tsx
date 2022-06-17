import React, {useEffect, useRef, useState } from "react";
import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";

import DateField from "./DateField";
import OrbitPlot from "./OrbitPlot";

import Kepler from "../main/libs/kepler";
import Draw from "../main/libs/draw";
import { calendarDateToString, timeToCalendarDate, vec3, wrapAngle } from "../main/libs/math";
import { CelestialBody, isOrbitingBody } from "../main/objects/body";
import { timeFromDateFieldState, makeDateFields } from "../utils";

import { atom, useAtom } from "jotai";
import { timeSettingsAtom } from "../App";

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

function OrbitDisplay({label, marks, centralBody, orbits, trajectories, startDate, endDate, defaultTraces, plotSize, slider=true}: OrbitDisplayProps) {
    const [timeSettings] = useAtom(timeSettingsAtom);
    const timeSettingsRef = useRef(timeSettings);

    const [date, setDate] = useState(startDate);
    const dateRef = useRef(date);

    const dateFieldAtom = useRef(atom(makeDateFields(...Object.values(timeToCalendarDate(startDate, timeSettings, 1, 1))))).current;
    const [dateField, setDateField] = useAtom(dateFieldAtom);
    const dateFieldRef = useRef(dateField);

    const [updateFields, setUpdateFields] = useState(false);

    const [traces, setTraces] = useState(defaultTraces);
    const tracesRef = useRef(traces);

    const defaultTracesRef = useRef(defaultTraces);

    // function updateDateField(date: number) {
    //     const calendarDate = timeToCalendarDate(date, timeSettings, 1, 1);
    //     console.log(calendarDate)
    //     setDateField(calendarDate);
    //     dateFieldRef.current = calendarDate;
    // }

    useEffect(() => {
        if((timeSettings === timeSettingsRef.current) && (defaultTraces !== defaultTracesRef.current)) {
            defaultTracesRef.current = defaultTraces;
            const d = Math.ceil(startDate)
            setDate(d);
            dateRef.current = d;
            const calendarDate = timeToCalendarDate(d, timeSettings, 1, 1);
            setDateField(calendarDate);
            dateFieldRef.current = calendarDate;
            const newTraces = updateDate(d, centralBody, orbits, trajectories, defaultTraces);
            setTraces(newTraces)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startDate, centralBody, orbits, trajectories, defaultTraces, timeSettings]);

    useEffect(() => {
        if(traces !== tracesRef.current) {
            tracesRef.current = traces;
        } else if(dateField !== dateFieldRef.current) {
            dateFieldRef.current = dateField;
            const newDate = timeFromDateFieldState(dateField, timeSettings, 1, 1);
            setDate(newDate)
        } else {
            dateRef.current = date;
            const newTraces = updateDate(date, centralBody, orbits, trajectories, traces);
            setTraces(newTraces);  
            if(updateFields || (timeSettings !== timeSettingsRef.current)) {
                timeSettingsRef.current = timeSettings;
                setUpdateFields(false);
                const calendarDate = timeToCalendarDate(date, timeSettings, 1, 1);
                setDateField(calendarDate);
                dateFieldRef.current = calendarDate;
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [date, dateField, updateFields, centralBody, orbits, trajectories, traces, timeSettings]);

    return (
        <>
            <OrbitPlot uirevision={label} plotSize={plotSize} traces={traces}/>
            <Stack sx={{my: 1}} display="flex" alignItems="center" justifyContent="center">
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
                <Box component="div" display="flex" alignItems="center" justifyContent="center" maxWidth="700px">
                    <DateField id={'plot-date'} label={'Date'} calendarDateAtom={dateFieldAtom} correctFormat={true} variant="all"/>
                </Box>
            </Stack>
        </>
    )
}

export default React.memo(OrbitDisplay);