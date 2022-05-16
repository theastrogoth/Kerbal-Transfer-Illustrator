import React, {useState, useEffect} from "react";

import MultiFlyby from "../../main/objects/multiflyby";
import SolarSystem from "../../main/objects/system";
import { OrbitingBody } from "../../main/objects/body";
import Color from "../../main/objects/color";
import Draw from "../../main/libs/draw";

import OrbitDisplay, { OrbitDisplayProps, updateTrajectoryMarker } from "../OrbitDisplay";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Grid from "@mui/material/Grid";


type OrbitDisplayTabsProps  = {
    multiFlyby:             MultiFlyby,
    timeSettings:           TimeSettings,
    setMultiFlyby:          React.Dispatch<React.SetStateAction<MultiFlyby>>,   
    searchCount:            number,
}

const emptyProps: OrbitDisplayProps[] = [];


function trajectoryTraces(trajectory: Trajectory, vesselName: string, timeSettings: TimeSettings): Line3DTrace[] {
    const trajLen = trajectory.orbits.length;

    const orbitTraces: Line3DTrace[] = [];
    for(let i=0; i<trajLen; i++) {
        const orb = trajectory.orbits[i];
        const sTime = trajectory.intersectTimes[i];
        const eTime = trajectory.intersectTimes[i + 1];
        orbitTraces.push(Draw.drawOrbitPathFromTimes(orb, sTime, eTime, timeSettings, new Color({r: 150, g: 150, b: 150}), vesselName, false, "solid"));
    }
    return orbitTraces;
}

function bodyPlotProps(trajectories: Trajectory[], vesselName: string, system: SolarSystem, date: number, timeSettings: TimeSettings) {
    const orbits = [...trajectories.map((traj) => traj.orbits.slice()).flat()];
    const body = system.bodyFromId(orbits[0].orbiting);

    const systemTraces = Draw.drawSystemAtTime(body, date, timeSettings);
    const orbitTraces = [...trajectories.map((traj,i) => trajectoryTraces(traj, vesselName, timeSettings)).flat()];
    
    const tempMarkerTraces: Marker3DTrace[] = trajectories.map(traj => Draw.drawOrbitPositionMarkerAtTime(traj.orbits[0], date));
    const markerTraces: Marker3DTrace[] = tempMarkerTraces.map((marker, idx) => updateTrajectoryMarker(date, trajectories[idx], marker));
    
    const plotSize = body.orbiters.length === 0 ? body.soi : 2 * body.furtherstOrbiterDistance;

    return {
        index:          0,
        label:          body.name + ' System',
        centralBody:    body,
        orbits:         orbits,
        trajectories,
        date,
        defaultTraces:  {systemTraces, orbitTraces, markerTraces},
        plotSize,
    };
}

export function prepareAllDisplayProps(flightPlans: FlightPlan[], system: SolarSystem, timeSettings: TimeSettings) {
} 

const OrbitTabPanel = React.memo(function WrappedOrbitTabPanel({value, index, props}: {value: number, index: number, props: OrbitDisplayProps}) {
    const [orbitPlotProps, setOrbitPlotProps] = useState(props);

    useEffect(() => {
        // console.log('Update Orbit Tab '.concat(String(index)).concat(' with new props.'));
        setOrbitPlotProps(props);
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [props]);

    useEffect(() => {
        if(value === index) {
            window.dispatchEvent(new Event('resize'));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value])

    return (
        <div style={{ display: (value === index ? 'block' : 'none'), width: "100%", height: "100%" }}>
            <OrbitDisplay {...orbitPlotProps}/>
        </div>
    )
});


