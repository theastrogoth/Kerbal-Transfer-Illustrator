import React, {useState, useEffect, useRef} from "react";

import SolarSystem from "../../main/objects/system";
import CelestialBody from "../../main/objects/body";

import OrbitDisplay, { OrbitDisplayProps } from "../Display/OrbitDisplay";
import InfoPopper from "../Display/InfoPopper";

import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import { atom, PrimitiveAtom, useAtom } from "jotai";
import { flightPlansAtom, landedVesselPlansAtom, systemAtom, timeSettingsAtom } from "../../App";


const emptyProps: OrbitDisplayProps[] = [];

function bodyPlotProps(centralBody: CelestialBody, idx: number, flightPlans: FlightPlan[], landedVessels: LandedVessel[], system: SolarSystem, startDate: number, endDate: number): OrbitDisplayProps {
    return {
        index:              idx,
        label:              centralBody.name + ' System',
        centralBody,
        system,
        flightPlans,
        landedVessels,
        startDate,
        endDate,
        slider:             false,
    };
}

export function prepareAllDisplayProps(flightPlans: FlightPlan[], landedVessels: LandedVessel[], system: SolarSystem): OrbitDisplayProps[] {
    let minStartDate = 0;
    const bodies = new Map<number, {body: CelestialBody, startDate: number, endDate: number}>();
    for(let i=0; i<flightPlans.length; i++) {
        const fp = flightPlans[i];
        for(let j=0; j<fp.trajectories.length; j++) {
            let startDate = fp.trajectories[j].intersectTimes[0];
            startDate = Number.isFinite(startDate) && !isNaN(startDate) ? startDate : fp.trajectories[j].intersectTimes[1];
            if ( (i + j) === 0) {
                minStartDate = startDate;
            } else {
                minStartDate = Math.min(startDate, minStartDate);
            }
            // let endDate = fp.trajectories[j].intersectTimes[fp.trajectories[j].intersectTimes.length - 1];
            // endDate = Number.isFinite(endDate) && !isNaN(endDate) ? endDate : fp.trajectories[j].intersectTimes[fp.trajectories[j].intersectTimes.length - 2];
            const endDate = startDate + 1;
            const bodyIdx = fp.trajectories[j].orbits[0].orbiting;
            if (bodyIdx === 0) { continue }
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
    const bodyIdxs = [0, ...bodies.keys()]
    bodies.set(0, { body: system.sun, startDate: minStartDate, endDate: minStartDate + 1 });

    return bodyIdxs.map((idx, i) => {
        const {body, startDate, endDate} = bodies.get(idx) as {body: CelestialBody, startDate: number, endDate: number};
        return bodyPlotProps(body, i, flightPlans, landedVessels, system, startDate, endDate);
    });
} 

const OrbitTabPanel = React.memo(function WrappedOrbitTabPanel({value, index, props, infoItemAtom}: {value: number, index: number, props: OrbitDisplayProps, infoItemAtom: PrimitiveAtom<InfoItem>}) {
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
            <OrbitDisplay {...orbitPlotProps} infoItemAtom={infoItemAtom} tabValue={value}/>
        </div>
    )
});

function OrbitDisplayTabs() {
    const [flightPlans] = useAtom(flightPlansAtom);
    const [landedVessels] = useAtom(landedVesselPlansAtom);
    const [system] = useAtom(systemAtom);

    const [timeSettings] = useAtom(timeSettingsAtom);
    const timeSettingsRef = useRef(timeSettings);

    const [value, setValue] = useState(0);
    const valueRef = useRef(value);

    const [orbitDisplayProps, setOrbitDisplayProps] = useState(emptyProps);
    const infoItemAtom = useRef(atom<InfoItem>(null)).current;
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
                landedVessels,
                slider:             false,
            };
            setOrbitDisplayProps([plotProps]);
        } else {
            setOrbitDisplayProps(prepareAllDisplayProps(flightPlans, landedVessels, system));
        }
        // hide warning for missing setters
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [flightPlans, timeSettings, system, value, landedVessels]);
    
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
                {orbitDisplayProps.map((props, index) => <OrbitTabPanel key={index} value={value} index={index} props={props} infoItemAtom={infoItemAtom}/>)}
            </div>
            <InfoPopper infoItemAtom={infoItemAtom} parentRef={canvasRef} system={system} />
        </>
    )
}

export default React.memo(OrbitDisplayTabs);


