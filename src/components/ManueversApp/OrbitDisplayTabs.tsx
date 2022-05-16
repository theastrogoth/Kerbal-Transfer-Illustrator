import React, {useState, useEffect} from "react";

import SolarSystem from "../../main/objects/system";
import { OrbitingBody } from "../../main/objects/body";
import Color from "../../main/objects/color";
import Draw from "../../main/libs/draw";

import OrbitDisplay, { OrbitDisplayProps, updateTrajectoryMarker } from "../OrbitDisplay";

import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";


type OrbitDisplayTabsProps  = {
    flightPlans:            FlightPlan[],
    system:                 SolarSystem,
    timeSettings:           TimeSettings,
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

function bodyPlotProps(trajectories: Trajectory[], names: string[], system: SolarSystem, date: number, timeSettings: TimeSettings): OrbitDisplayProps {
    const orbits = [...trajectories.map((traj) => traj.orbits.slice()).flat()];
    const body = system.bodyFromId(orbits[0].orbiting);

    const systemTraces = Draw.drawSystemAtTime(body, date, timeSettings);
    const orbitTraces = [...trajectories.map((traj,i) => trajectoryTraces(traj, names[i], timeSettings)).flat()];
    
    const tempMarkerTraces: Marker3DTrace[] = trajectories.map(traj => Draw.drawOrbitPositionMarkerAtTime(traj.orbits[0], date));
    const markerTraces: Marker3DTrace[] = tempMarkerTraces.map((marker, idx) => updateTrajectoryMarker(date, trajectories[idx], marker));
    
    const plotSize = body.orbiters.length === 0 ? body.soi : 2 * body.furtherstOrbiterDistance;

    return {
        index:          0,
        label:          body.name + ' System',
        marks:          [] as {value: number, label: string}[],
        centralBody:    body,
        orbits:         orbits,
        trajectories,
        startDate:      date,
        endDate:        date,
        defaultTraces:  {systemTraces, orbitTraces, markerTraces},
        plotSize,
        timeSettings,
        slider:         false,
    };
}

export function prepareAllDisplayProps(flightPlans: FlightPlan[], system: SolarSystem, timeSettings: TimeSettings): OrbitDisplayProps[] {
    const bodyTrajectories = new Map<number, [Trajectory[], string[]]>();
    let date = 0;
    for(let i=0; i<flightPlans.length; i++) {
        const fp = flightPlans[i];
        const name = fp.name;
        for(let j=0; j<fp.trajectories.length; j++) {
            date = Math.min(date, fp.trajectories[j].intersectTimes[0])
            const bodyIdx = fp.trajectories[j].orbits[0].orbiting;
            if(bodyTrajectories.has(bodyIdx)) {
                //@ts-ignore
                bodyTrajectories.get(bodyIdx)[0].push(fp.trajectories[j]);
                //@ts-ignore
                bodyTrajectories.get(bodyIdx)[1].push(name);
            } else {
                bodyTrajectories.set(bodyIdx, [[fp.trajectories[j]], [name]]);
            }
        }
    }

    const bodyIdxs = [...bodyTrajectories.keys()]
    return bodyIdxs.map(idx => { const [trajectories, names] = bodyTrajectories.get(idx) as [Trajectory[], string[]]; return bodyPlotProps(trajectories, names, system, date, timeSettings) })
} 

const OrbitTabPanel = React.memo(function WrappedOrbitTabPanel({value, index, props}: {value: number, index: number, props: OrbitDisplayProps}) {
    const [orbitPlotProps, setOrbitPlotProps] = useState(props);

    useEffect(() => {
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

function OrbitDisplayTabs({flightPlans, system, timeSettings}: OrbitDisplayTabsProps) {
    const [value, setValue] = useState(0);
    const [refined, setRefined] = useState(false);
    const [calculating, setCalculating] = useState(false);

    const [orbitDisplayProps, setOrbitDisplayProps] = useState(emptyProps);

    useEffect(() => {
        console.log('Updating Orbit plots with new flight plans...')
        if(flightPlans.length === 0) {
            const fp: FlightPlan = {
                trajectories: [{
                    orbits:         [(system.bodyFromId(1) as OrbitingBody).orbit],
                    intersectTimes: [0, timeSettings.daysPerYear*timeSettings.hoursPerDay*3600],
                    maneuvers:      [],
                }],
                name: '',
                color: {r: 255, g: 255, b: 255},
            }
            setOrbitDisplayProps(prepareAllDisplayProps([fp], system, timeSettings));
        } else {
            setOrbitDisplayProps(prepareAllDisplayProps(flightPlans, system, timeSettings));
        }
      // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [flightPlans]);
    
    useEffect(() => {
        if(value < 0) {
            setValue(0);
        }
        if(value >= orbitDisplayProps.length) {
            setValue(orbitDisplayProps.length - 1);
        }
    }, [orbitDisplayProps])

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
        console.log('Orbit plot tab '.concat(String(newValue)).concat(' selected.'));
    }

    return (
        <>
            <Tabs value={value} onChange={handleChange} variant="scrollable" scrollButtons={true}>
                {orbitDisplayProps.map((props, index) => <Tab key={index} value={props.index} label={props.label} ></Tab>)}
            </Tabs>
            {orbitDisplayProps.map((props, index) => <OrbitTabPanel key={index} value={value} index={props.index} props={props}/>)}
        </>
    )
}


