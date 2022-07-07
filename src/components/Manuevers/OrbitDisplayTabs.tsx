import React, {useState, useEffect, useRef} from "react";

import SolarSystem from "../../main/objects/system";
import CelestialBody from "../../main/objects/body";

import OrbitDisplay, { OrbitDisplayProps } from "../Display/OrbitDisplay";
import InfoPopper from "../Display/InfoPopper";

import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import { useAtom } from "jotai";
import { flightPlansAtom, systemAtom, timeSettingsAtom } from "../../App";


const emptyProps: OrbitDisplayProps[] = [];

function bodyPlotProps(centralBody: CelestialBody, flightPlans: FlightPlan[], system: SolarSystem, startDate: number, endDate: number): OrbitDisplayProps {
    return {
        index:              centralBody.id,
        label:              centralBody.name + ' System',
        centralBody,
        system,
        flightPlans,
        startDate,
        endDate,
        slider:             false,
    };
}

export function prepareAllDisplayProps(flightPlans: FlightPlan[], system: SolarSystem): OrbitDisplayProps[] {
    const bodies = new Map<number, {body: CelestialBody, startDate: number, endDate: number}>();
    for(let i=0; i<flightPlans.length; i++) {
        const fp = flightPlans[i];
        for(let j=0; j<fp.trajectories.length; j++) {
            let startDate = fp.trajectories[j].intersectTimes[0];
            startDate = Number.isFinite(startDate) && !isNaN(startDate) ? startDate : fp.trajectories[j].intersectTimes[1];
            let endDate = fp.trajectories[j].intersectTimes[fp.trajectories[j].intersectTimes.length - 1];
            endDate = Number.isFinite(endDate) && !isNaN(endDate) ? endDate : fp.trajectories[j].intersectTimes[fp.trajectories[j].intersectTimes.length - 2];
            const bodyIdx = fp.trajectories[j].orbits[0].orbiting;
            if(bodies.has(bodyIdx)) {
                const bd = bodies.get(bodyIdx) as {body: CelestialBody, startDate: number, endDate: number};
                bd.startDate = Math.min(startDate, bd.startDate);
                bd.endDate = Math.max(endDate, bd.endDate);
            } else {
                const body = system.bodyFromId(bodyIdx);
                bodies.set(bodyIdx, {body, startDate, endDate});
            }
        }
    }
    const bodyIdxs = [...bodies.keys()]
    return bodyIdxs.map(idx => {
        const {body, startDate, endDate} = bodies.get(idx) as {body: CelestialBody, startDate: number, endDate: number};
        return bodyPlotProps(body, flightPlans, system, startDate, endDate);
    });
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


