import React, {useEffect, useState } from "react";
import Slider from "@mui/material/Slider";
import Box from "@mui/material/Box";

import OrbitPlot from "./OrbitPlot";

import Kepler from "../main/libs/kepler";
import Draw from "../main/libs/draw";
import { vec3, wrapAngle } from "../main/libs/math";
import { CelestialBody, isOrbitingBody } from "../main/objects/body";

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

function updateTrajectoryMarker(date: number, trajectory: Trajectory, trace: Marker3DTrace) {
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


function OrbitDisplay({index, label, marks, centralBody, orbits, trajectories, startDate, endDate, defaultTraces, plotSize}: OrbitDisplayProps) {
    const [date, setDate] = useState(startDate);
    const [traces, setTraces] = useState(defaultTraces);

    useEffect(() => {
        setDate(Math.ceil(startDate));
        const newTraces = updateDate(Math.ceil(startDate), centralBody, orbits, trajectories, defaultTraces);
        setTraces(newTraces)
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [startDate, defaultTraces]);

    const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        const newDate = Number(event.target.value);
        setDate(newDate);
        const newTraces = updateDate(newDate, centralBody, orbits, trajectories, traces);
        setTraces(newTraces);
        // console.log('Orbit plot traces updated with new slider time')
    };

    return (
        <>
            <OrbitPlot uirevision={label} plotSize={plotSize} traces={traces}/>
            <Box display="flex" alignItems="center" justifyContent="center">
                <Slider
                    sx={{ width: "60%" }}
                    valueLabelDisplay="auto"
                    defaultValue={Math.ceil(startDate)}
                    value={Math.round(date)}
                    min={Math.ceil(startDate)}
                    max={Math.floor(endDate)}
                    step={Math.round(Math.max((endDate-startDate)/1000, 1))}
                    marks={marks}
                    // @ts-ignore
                    onChange={handleDateChange}
                />
            </Box>
        </>
    )
}

// export default React.memo(OrbitDisplay)
export default React.memo(OrbitDisplay);