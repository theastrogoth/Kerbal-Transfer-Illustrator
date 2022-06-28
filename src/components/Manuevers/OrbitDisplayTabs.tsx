import React, {useState, useEffect, useRef} from "react";

import SolarSystem from "../../main/objects/system";

import OrbitDisplay, { OrbitDisplayProps } from "../OrbitDisplay2";
import InfoPopper from "../Display/InfoPopper";

import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import { useAtom } from "jotai";
import { flightPlansAtom, systemAtom, timeSettingsAtom } from "../../App";


const emptyProps: OrbitDisplayProps[] = [];

function bodyPlotProps(trajectories: Trajectory[], names: string[], colors: IColor[], system: SolarSystem, date: number): OrbitDisplayProps {
    const orbits = [...trajectories.map((traj) => traj.orbits.slice()).flat()];
    const body = system.bodyFromId(orbits[0].orbiting);

    const trajectoryIcons = trajectories.map(trajectory => {
        const maneuver: [number, string][] = [];
        const soi: [number, string][] =[];

        for(let i=0; i<trajectory.maneuvers.length; i++) {
            maneuver.push([i, "Maneuver Node"])
        }
        if(Number.isFinite(trajectory.intersectTimes[0])) {
            soi.push([0, "SoI Change"])
        }
        if(Number.isFinite(trajectory.intersectTimes[trajectory.intersectTimes.length-1])) {
            soi.push([trajectory.intersectTimes.length-1, "SoI Change"])
        }

        return {maneuver, soi};
    })

    return {
        index:              0,
        label:              body.name + ' System',
        centralBody:        body,
        system,
        trajectories,
        trajectoryNames:    names,
        trajectoryColors:   colors,
        startDate:          Number.isFinite(date) ? date : 0,
        endDate:            Number.isFinite(date) ? date : 0,
        slider:             false,
        trajectoryIcons,
    };
}

export function prepareAllDisplayProps(flightPlans: FlightPlan[], system: SolarSystem): OrbitDisplayProps[] {
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

const OrbitTabPanel = React.memo(function WrappedOrbitTabPanel({value, index, props, infoItem, setInfoItem}: {value: number, index: number, props: OrbitDisplayProps, infoItem: InfoItem, setInfoItem: React.Dispatch<React.SetStateAction<InfoItem>>}) {
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
            <OrbitDisplay {...orbitPlotProps} infoItem={infoItem} setInfoItem={setInfoItem} />
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
    const [infoItem, setInfoItem] = useState<InfoItem>(null);
    const canvasRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if(value !== valueRef.current) {
            valueRef.current = value;
        } else if(timeSettings !== timeSettingsRef.current) {
            timeSettingsRef.current = timeSettings;
        } else if(flightPlans.length === 0) {
            const plotProps: OrbitDisplayProps = {
                index:              0,
                label:              system.sun.name + ' System',
                centralBody:        system.sun,
                system,
                trajectories:       [],
                startDate:          0,
                endDate:            0,
                slider:             false,
            };
            setOrbitDisplayProps([plotProps]);
        } else {
            setOrbitDisplayProps(prepareAllDisplayProps(flightPlans, system));
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
            <div ref={canvasRef}>
                {orbitDisplayProps.map((props, index) => <OrbitTabPanel key={index} value={value} index={index} props={props} infoItem={infoItem} setInfoItem={setInfoItem}/>)}
            </div>
            <InfoPopper info={infoItem} setInfo={setInfoItem} parentRef={canvasRef} />
        </>
    )
}

export default React.memo(OrbitDisplayTabs);


