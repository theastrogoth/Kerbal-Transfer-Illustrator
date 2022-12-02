import Kepler from "../main/libs/kepler";

import RequiredNumberField from "./NumberField";
import VesselSelect from "./VesselSelect";
import PasteButton from "./PasteButton";

import React, {useEffect, useState, useRef } from "react";
import Button from '@mui/material/Button';
import Stack from "@mui/material/Stack";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import ClearIcon from '@mui/icons-material/Clear';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

import { defaultOrbit } from "../utils";

import { PrimitiveAtom, useAtom } from "jotai";
import { systemAtom, vesselsAtom, copiedOrbitAtom, commsOptionsAtom } from "../App";
import { Typography } from "@mui/material";
import BodySelect from "./BodySelect";
import { radToDeg } from "../main/libs/math";

type OrbitControlsProps = {
    label:          string,
    vesselAtom:     PrimitiveAtom<IVessel>,
    vesselSelect?:  boolean,
};

function OrbitControls({label, vesselAtom, vesselSelect = true}: OrbitControlsProps) {
    const [vessel, setVessel] = useAtom(vesselAtom);
    const [copiedOrbit] = useAtom(copiedOrbitAtom);

    const [vessels] = useAtom(vesselsAtom);
    const vesselsRef = useRef(vessels);

    const [commsOptions, setCommsOptions] = useAtom(commsOptionsAtom);

    const [system] = useAtom(systemAtom);
    const systemRef = useRef(system);

    const vesselRef = useRef(vessel);
    const orbitRef = useRef(vessel.orbit);
    const orbit = orbitRef.current;

    const bodyId = orbitRef.current.orbiting;

    const [vesselId, setVesselId] = useState(-1);
    const vesselIdRef = useRef(vesselId);

    const body = useRef(
        system.orbiterIds.has(orbit.orbiting) ? 
            system.bodyFromId(orbit.orbiting) :
            system.bodyFromId(Math.max(...[...system.orbiterIds.keys()]))
    );

    const sma = orbit.semiMajorAxis;
    const ecc = orbit.eccentricity;
    const inc = orbit.inclination;
    const arg = orbit.argOfPeriapsis;
    const lan = orbit.ascNodeLongitude;
    const moe = orbit.meanAnomalyEpoch;
    const epoch = orbit.epoch;

    const [optsVisible, setOptsVisible] = useState(false);
    const [, setUpdateCount] = useState(0);

    const setField = (fieldName: string) => {
        return (val: number) => {
            const newOrbitEls = {...orbitRef.current};
            // @ts-ignore
            newOrbitEls[fieldName] = val;
            const newOrbit = Kepler.orbitFromElements(newOrbitEls, body.current);
            const newVessel = {...vesselRef.current, orbit: newOrbit}
            setVessel(newVessel);
            vesselRef.current = newVessel;
            orbitRef.current = newOrbit;
        }
    };
    
    const setBodyId = (id: number) => {
        if (id === vessel.orbit.orbiting) {
            return;
        }
        const newBody = system.bodyFromId(id);
        body.current = newBody;
        const newOrbit = defaultOrbit(system, id);
        const newVessel = {...vesselRef.current, orbit: newOrbit}
        setVessel(newVessel);
        vesselRef.current = newVessel;
        orbitRef.current = newOrbit;
    }

    useEffect(() => {
        // detect a system change, and reset the orbit to the default for the new body
        if(system !== systemRef.current) {
            systemRef.current = system;
            if(!system.orbiterIds.has(bodyId)) {
                const newBodyId = Math.max(...[...system.orbiterIds.keys()]);
                setBodyId(newBodyId);
            } else {
                const newOrb = defaultOrbit(system, bodyId);
                const newVessel = {...vesselRef.current, orbit: newOrb};
                setVessel(newVessel);
                vesselRef.current = newVessel;
                orbitRef.current = newOrb;
                if (newOrb.orbiting !== vessel.orbit.orbiting) {
                    const newBody = system.bodyFromId(newOrb.orbiting);
                body.current = newBody;
                }
            }
        // detect a change in selection of the loaded vessels from the savefile, and change the orbit to match
        } else if(vesselId !== vesselIdRef.current || vessels !== vesselsRef.current) {
            vesselIdRef.current = vesselId;
            vesselsRef.current = vessels;
            if(vesselId >= 0) {
                const newVessel = {...vessel, orbit: vessels[vesselId].orbit}
                setVessel(newVessel);
                vesselRef.current = newVessel;
                orbitRef.current = vessels[vesselId].orbit;
                setCommsOptions({...commsOptions, commStrength: (vessels[vesselId].commRange || 0) / 1e6});
            }
        } 
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [vesselId, vessels, system])

    useEffect(() => {
        vesselRef.current = vessel;
        orbitRef.current = vessel.orbit;
        body.current = system.bodyFromId(vessel.orbit.orbiting);
        setUpdateCount((prev) => prev + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [vessel])

    return (
        <>
            <Typography sx={{marginBottom: 1}}>
                {label}
            </Typography>
            <Stack spacing={1.5}>
                {vesselSelect &&
                    <VesselSelect 
                        vessels={vessels}
                        vesselId={vesselId} 
                        label={label}
                        handleVesselIdChange={(event: React.ChangeEvent<HTMLInputElement>): void => {
                                setVesselId(Number(event.target.value))
                            }} />
                }
                <BodySelect 
                    label={label}
                    bodyId={bodyId}
                    setBodyId={setBodyId}
                    system={system}
                />
                <RequiredNumberField
                    label='Altitude (m)'
                    value={sma}
                    setValue={setField("semiMajorAxis")}
                    min={body.current.radius}
                    shift={-body.current.radius}
                    useSetState={false}
                 />
                <Collapse in={optsVisible} timeout="auto">
                    <Stack spacing={1.5}>
                        <RequiredNumberField
                            label='Semi-major Axis (m)' 
                            value={sma}
                            setValue={setField("semiMajorAxis")}
                            error = {sma === 0 || ecc === 1 || (ecc < 1 && sma < 0) || (ecc > 1 && sma > 0)}
                            useSetState={false}
                        />
                        <RequiredNumberField
                            label='Eccentricity' 
                            value={ecc}
                            min={0}
                            step={0.1}
                            setValue={setField("eccentricity")}
                            error={ecc === 1 || (ecc < 1 && sma < 0) || (ecc > 1 && sma > 0)}
                            useSetState={false}
                         />
                        <RequiredNumberField
                            label={'Inclination (\u00B0)'} 
                            value={inc}
                            setValue={setField("inclination")}
                            useSetState={false}
                         />
                        <RequiredNumberField
                            label={'Argument of the Periapsis (\u00B0)'} 
                            value={arg}
                            setValue={setField("argOfPeriapsis")}
                            useSetState={false}
                         />
                        <RequiredNumberField
                            label={'Longitude of the Ascending Node (\u00B0)'} 
                            value={lan}
                            setValue={setField("ascNodeLongitude")}
                            useSetState={false}
                         />
                        <RequiredNumberField
                            label='Mean Anomaly at Epoch (rad)' 
                            value={moe}
                            setValue={setField("meanAnomalyEpoch")}
                            useSetState={false}
                         />
                        <RequiredNumberField
                            label='Epoch (s)' 
                            value={epoch}
                            setValue={setField("epoch")}
                            useSetState={false}
                         />
                    </Stack>
                </Collapse>
            </Stack>   
            <Stack direction='row' spacing={1} display="flex" justifyContent="center" alignItems="center" >
                <Button 
                    variant="text" 
                    startIcon={optsVisible ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
                    onClick={() => setOptsVisible(!optsVisible)}
                >
                    Advanced Options
                </Button>
                <PasteButton 
                    setObj={(orb: IOrbit) => {
                        const degOrb = {
                            ...orb,
                            inclination:        radToDeg(orb.inclination),
                            argOfPeriapsis:     radToDeg(orb.argOfPeriapsis),
                            ascNodeLongitude:   radToDeg(orb.ascNodeLongitude),
                        }
                        const newVessel = {...vessel, orbit: degOrb};
                        setVessel(newVessel);
                        vesselRef.current = newVessel; 
                        orbitRef.current = degOrb;
                        setVesselId(-1); 
                        if (degOrb.orbiting !== vessel.orbit.orbiting) {
                            const newBody = system.bodyFromId(degOrb.orbiting);
                            body.current = newBody;
                        }
                    }} 
                    copiedObj={copiedOrbit}/>
                <IconButton 
                    size="small"
                    color="inherit"
                    // @ts-ignore
                    onClick={() => { const newOrb = defaultOrbit(system, bodyId); const newVessel = {...vesselRef.current, orbit: newOrb}; setVessel(newVessel); vesselRef.current = newVessel; orbitRef.current = newOrb; setVesselId(-1); }}
                >
                    <ClearIcon />
                </IconButton>
            </Stack>
        </>
    )
}

export default React.memo(OrbitControls);