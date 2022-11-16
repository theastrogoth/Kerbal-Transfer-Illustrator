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
import { radToDeg } from "../main/libs/math";

import { PrimitiveAtom, useAtom } from "jotai";
import { systemAtom, vesselsAtom, copiedOrbitAtom } from "../App";
import { Typography } from "@mui/material";
import BodySelect from "./BodySelect";


type OrbitControlsProps = {
    label:          string,
    orbitAtom:      PrimitiveAtom<OrbitalElements>,
    vesselSelect?:  boolean,
};

function OrbitControls({label, orbitAtom, vesselSelect = true}: OrbitControlsProps) {
    const [copiedOrbit] = useAtom(copiedOrbitAtom);

    const [vessels] = useAtom(vesselsAtom);
    const vesselsRef = useRef(vessels);

    const [system] = useAtom(systemAtom);
    const systemRef = useRef(system);

    const [orbit, setOrbit] = useAtom(orbitAtom);
    const orbitRef = useRef(orbit);

    const [bodyId, setBodyId] = useState(orbit.orbiting);
    const bodyIdRef = useRef(bodyId);

    const [vesselId, setVesselId] = useState(-1);
    const vesselIdRef = useRef(vesselId);

    const [body, setBody] = useState(
        system.orbiterIds.has(orbit.orbiting) ? 
            system.bodyFromId(orbit.orbiting) :
            system.bodyFromId(Math.max(...[...system.orbiterIds.keys()]))
    );

    const [sma, setSma] = useState(orbit.semiMajorAxis);
    const smaRef = useRef(sma);

    const [alt, setAlt] = useState(orbit.semiMajorAxis - body.radius);
    const altRef = useRef(alt);

    const [ecc, setEcc] = useState(orbit.eccentricity);
    const [inc, setInc] = useState(orbit.inclination);
    const [arg, setArg] = useState(orbit.argOfPeriapsis);
    const [lan, setLan] = useState(orbit.ascNodeLongitude);
    const [moe, setMoe] = useState(orbit.meanAnomalyEpoch);
    const [epoch, setEpoch] = useState(orbit.epoch);

    const [optsVisible, setOptsVisible] = useState(false);

    function setFields(newOrbit: OrbitalElements, newAlt: number | undefined = undefined) {
        setSma(newOrbit.semiMajorAxis);
        smaRef.current = newOrbit.semiMajorAxis;

        setEcc(newOrbit.eccentricity);
        setInc(radToDeg(newOrbit.inclination));
        setArg(radToDeg(newOrbit.argOfPeriapsis));
        setLan(radToDeg(newOrbit.ascNodeLongitude));
        setMoe(newOrbit.meanAnomalyEpoch);
        setEpoch(newOrbit.epoch);

        setBodyId(newOrbit.orbiting);
        bodyIdRef.current = newOrbit.orbiting;

        const newBody = system.bodyFromId(newOrbit.orbiting);
        setBody(newBody);

        if(newAlt) {
            setAlt(newAlt);
        } else {
            const newAlt = newOrbit.semiMajorAxis - newBody.radius;
            setAlt(newAlt);
            altRef.current = newAlt;
        }
    }

    useEffect(() => {
        // detect a system change, and reset the orbit to the default for the new body
        if(system !== systemRef.current) {
            systemRef.current = system;
            if(!system.orbiterIds.has(bodyId)) {
                const newBodyId = Math.max(...[...system.orbiterIds.keys()])
                setBodyId(newBodyId);
            } else {
                const newBody = system.bodyFromId(bodyId);
                const orb = defaultOrbit(system, bodyId);
                setFields(orb, orb.semiMajorAxis - newBody.radius);
            }
        // detect a change in selection of the loaded vessels from the savefile, and change the orbit to match
        } else if(vesselId !== vesselIdRef.current || vessels !== vesselsRef.current) {
            vesselIdRef.current = vesselId;
            vesselsRef.current = vessels;
            if(vesselId >= 0) {
                setFields(vessels[vesselId].orbit);
            }
        // detect a change in the selection of a body, and change the orbit to the default one
        } else if(bodyId !== bodyIdRef.current) {
            bodyIdRef.current = bodyId;
            const newBody = system.bodyFromId(bodyId);
            const orb = defaultOrbit(system, bodyId);
            const newAlt = orb.semiMajorAxis - newBody.radius;
            altRef.current = newAlt;
            setFields(orb, newAlt);
        // detect a change in the altitude, and change the SMA to match
        } else if(alt !== altRef.current) {
            altRef.current = alt;
            const newSMA = Number(alt) + body.radius;
            setSma(newSMA);
        // detect a change in the orbital element inputs, and update the orbit to match
        } else {
            const newOrbit = {
                semiMajorAxis:      sma,
                eccentricity:       ecc,
                inclination:        inc,
                argOfPeriapsis:     arg,
                ascNodeLongitude:   lan,
                meanAnomalyEpoch:   moe,
                epoch:              epoch,
                orbiting:           bodyId,
            } as OrbitalElements;
            setOrbit(newOrbit);
            orbitRef.current = newOrbit;
            // if it's the SMA that's changed, update the alitude
            if(sma !== smaRef.current) {
                smaRef.current = sma;
                const newSma = Number(sma)
                if(!isNaN(newSma) && !isNaN(sma) && newSma !== altRef.current) {
                    const newAlt = newSma - body.radius;
                    if(newAlt !== altRef.current) {
                        setAlt(newAlt);
                        altRef.current = newAlt;
                    }
                }
            }
        }
        // I've disabled the check for exhaustive deps to remove the warning for missing the setters, which shouldn't cause an issue.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [alt, sma, ecc, inc, arg, lan, moe, epoch, bodyId, body, vesselId, vessels, system])

    useEffect(() => {
        // detect a change in the orbit from elsewhere
        if(!Kepler.orbitalElementsAreEqual(orbit, orbitRef.current)) {
            orbitRef.current = orbit;
            setFields(orbit);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orbit])

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
                    value={alt}
                    setValue={setAlt}
                    min={0}
                 />
                <Collapse in={optsVisible} timeout="auto">
                    <Stack spacing={1.5}>
                        <RequiredNumberField
                            label='Semi-major Axis (m)' 
                            value={sma}
                            setValue={setSma}
                            error = {sma === 0 || ecc === 1 || (ecc < 1 && sma < 0) || (ecc > 1 && sma > 0)}
                        />
                        <RequiredNumberField
                            label='Eccentricity' 
                            value={ecc}
                            min={0}
                            step={0.1}
                            setValue={setEcc}
                            error={ecc === 1 || (ecc < 1 && sma < 0) || (ecc > 1 && sma > 0)}
                         />
                        <RequiredNumberField
                            label={'Inclination (\u00B0)'} 
                            value={inc}
                            setValue={setInc}
                         />
                        <RequiredNumberField
                            label={'Argument of the Periapsis (\u00B0)'} 
                            value={arg}
                            setValue={setArg}
                         />
                        <RequiredNumberField
                            label={'Longitude of the Ascending Node (\u00B0)'} 
                            value={lan}
                            setValue={setLan}
                         />
                        <RequiredNumberField
                            label='Mean Anomaly at Epoch (rad)' 
                            value={moe}
                            setValue={setMoe}
                         />
                        <RequiredNumberField
                            label='Epoch (s)' 
                            value={epoch}
                            setValue={setEpoch}
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
                <PasteButton setObj={(o: IOrbit) => setFields(o)} copiedObj={copiedOrbit}/>
                <IconButton 
                    size="small"
                    color="inherit"
                    // @ts-ignore
                    onClick={() => { setFields(defaultOrbit(system, bodyId)); setVesselId(-1) }}
                >
                    <ClearIcon />
                </IconButton>
            </Stack>
        </>
    )
}

export default React.memo(OrbitControls);