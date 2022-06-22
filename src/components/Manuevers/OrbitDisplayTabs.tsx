import React, {useState, useEffect, useRef} from "react";

import SolarSystem from "../../main/objects/system";
import { OrbitingBody } from "../../main/objects/body";

import OrbitDisplay, { OrbitDisplayProps } from "../OrbitDisplay2";

import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import { useAtom } from "jotai";
import { flightPlansAtom, systemAtom, timeSettingsAtom } from "../../App";


const emptyProps: OrbitDisplayProps[] = [];

function bodyPlotProps(trajectories: Trajectory[], names: string[], colors: IColor[], system: SolarSystem, date: number): OrbitDisplayProps {
    const orbits = [...trajectories.map((traj) => traj.orbits.slice()).flat()];
    const body = system.bodyFromId(orbits[0].orbiting);

    return {
        index:              0,
        label:              body.name + ' System',
        centralBody:        body,
        system,
        trajectories,
        trajectoryNames:    names,
        trajectoryColors:   colors,
        startDate:          date,
        endDate:            date,
        slider:             false,
    };
}

export function prepareAllDisplayProps(flightPlans: FlightPlan[], system: SolarSystem, timeSettings: TimeSettings): OrbitDisplayProps[] {
    const bodyTrajectories = new Map<number, [Trajectory[], string[], IColor[], number[]]>();
    for(let i=0; i<flightPlans.length; i++) {
        const fp = flightPlans[i];
        const name = fp.name;
        const color = fp.color || {r: 150, g: 150, b: 150};
        for(let j=0; j<fp.trajectories.length; j++) {
            const date = fp.trajectories[j].maneuvers.length > 0 ? fp.trajectories[j].maneuvers[0].preState.date : fp.trajectories[j].intersectTimes[0];
            const bodyIdx = fp.trajectories[j].orbits[0].orbiting;
            if(bodyTrajectories.has(bodyIdx)) {
                const bdTrajs = bodyTrajectories.get(bodyIdx) as [Trajectory[], string[], IColor[], number[]];
                bdTrajs[0].push(fp.trajectories[j]);
                bdTrajs[1].push(name);
                bdTrajs[2].push(color);
                bdTrajs[3][0] = Math.min(date, bdTrajs[3][0]);
            } else {
                bodyTrajectories.set(bodyIdx, [[fp.trajectories[j]], [name], [color], [date]]);
            }
        }
    }

    const bodyIdxs = [...bodyTrajectories.keys()]
    return bodyIdxs.map(idx => { const [trajectories, names, colors, date] = bodyTrajectories.get(idx) as [Trajectory[], string[], IColor[], number[]]; return bodyPlotProps(trajectories, names, colors, system, date[0]) })
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

function OrbitDisplayTabs() {
    const [flightPlans] = useAtom(flightPlansAtom);
    const [system] = useAtom(systemAtom);

    const [timeSettings] = useAtom(timeSettingsAtom);
    const timeSettingsRef = useRef(timeSettings);

    const [value, setValue] = useState(0);
    const valueRef = useRef(value);

    const [orbitDisplayProps, setOrbitDisplayProps] = useState(emptyProps);

    // useEffect(() => {
    //     // console.log('Updating Orbit plots with new flight plans...')
    //     if(flightPlans.length === 0) {
    //         const orb = (system.bodyFromId(1) as OrbitingBody).orbit;
    //         const fp: FlightPlan = {
    //             trajectories: [{
    //                 orbits:         [orb] as IOrbit[],
    //                 intersectTimes: [0, Infinity],
    //                 maneuvers:      [],
    //             }],
    //             name:       '',
    //             color:      {r: 255, g: 255, b: 255},
    //         }
    //         setOrbitDisplayProps(prepareAllDisplayProps([fp], system, timeSettings));
    //     } else {
    //         // console.log(flightPlans)
    //         setOrbitDisplayProps(prepareAllDisplayProps(flightPlans, system, timeSettings));
    //     }
    //   // eslint-disable-next-line react-hooks/exhaustive-deps
    //   }, [flightPlans, timeSettings]);

      useEffect(() => {
        if(value !== valueRef.current) {
            valueRef.current = value;
        } else if(timeSettings !== timeSettingsRef.current) {
            timeSettingsRef.current = timeSettings;
        } else if(flightPlans.length === 0) {
            const orb = (system.bodyFromId(1) as OrbitingBody).orbit;
            const fp: FlightPlan = {
                trajectories: [{
                    orbits:         [orb] as IOrbit[],
                    intersectTimes: [0, Infinity],
                    maneuvers:      [],
                }],
                name:       '',
                color:      {r: 255, g: 255, b: 255},
            }
            setOrbitDisplayProps(prepareAllDisplayProps([fp], system, timeSettings));
        } else {
            setOrbitDisplayProps(prepareAllDisplayProps(flightPlans, system, timeSettings));
        }
        // hide warning for missing setters
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [flightPlans, timeSettings, system, value]);
    
    useEffect(() => {
        if(value < 0) {
            setValue(0);
        }
        if(orbitDisplayProps.length > 0 && value >= orbitDisplayProps.length) {
            setValue(orbitDisplayProps.length - 1);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orbitDisplayProps.length])

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
        // console.log('Orbit plot tab '.concat(String(newValue)).concat(' selected.'));
    }

    return (
        <>
            <Tabs value={value} onChange={handleChange} variant="scrollable" scrollButtons={true}>
                {orbitDisplayProps.map((props, index) => <Tab key={index} value={index} label={props.label} ></Tab>)}
            </Tabs>
            {orbitDisplayProps.map((props, index) => <OrbitTabPanel key={index} value={value} index={index} props={props}/>)}
        </>
    )
}

export default React.memo(OrbitDisplayTabs);


