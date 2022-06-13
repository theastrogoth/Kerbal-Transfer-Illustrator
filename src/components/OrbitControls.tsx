import SolarSystem from "../main/objects/system";

import RequiredNumberField from "./NumberField";
import VesselSelect from "./VesselSelect";
import PasteButton from "./PasteButton";

import React, {useEffect, useState, useRef } from "react";
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
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


type OrbitControlsProps = {
    label:          string,
    orbitAtom:      PrimitiveAtom<OrbitalElements>,
    vesselSelect?:  boolean,
};

function createBodyItems(system: SolarSystem) {
    const options =[<MenuItem key={system.sun.id} value={system.sun.id}>{system.sun.name}</MenuItem>];
    const bds = system.orbiting;
    for (let i = 0; i < bds.length; i++) {
        options.push(<MenuItem key={bds[i].id} value={bds[i].id}>{bds[i].name}</MenuItem>)
    }
    return options;
}

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

    const [sma, setSma] = useState(String(orbit.semiMajorAxis));
    const smaRef = useRef(sma);

    const [alt, setAlt] = useState(String(orbit.semiMajorAxis - body.radius));
    const altRef = useRef(alt);

    const [ecc, setEcc] = useState(String(orbit.eccentricity));
    const [inc, setInc] = useState(String(orbit.inclination));
    const [arg, setArg] = useState(String(orbit.argOfPeriapsis));
    const [lan, setLan] = useState(String(orbit.ascNodeLongitude));
    const [moe, setMoe] = useState(String(orbit.meanAnomalyEpoch));
    const [epoch, setEpoch] = useState(String(orbit.epoch));

    const [optsVisible, setOptsVisible] = useState(false);
    const [bodyOptions, setBodyOptions] = useState(createBodyItems(system));

    function setOrbitAndFields(newOrbit: OrbitalElements, newAlt: number | undefined = undefined) {
        setOrbit(newOrbit)
        orbitRef.current = newOrbit;

        setSma(String(newOrbit.semiMajorAxis));
        smaRef.current = String(newOrbit.semiMajorAxis);

        setEcc(String(newOrbit.eccentricity));
        setInc(String(radToDeg(newOrbit.inclination)));
        setArg(String(radToDeg(newOrbit.argOfPeriapsis)));
        setLan(String(radToDeg(newOrbit.ascNodeLongitude)));
        setMoe(String(newOrbit.meanAnomalyEpoch));
        setEpoch(String(newOrbit.epoch));

        setBodyId(newOrbit.orbiting);
        bodyIdRef.current = newOrbit.orbiting;

        const newBody = system.bodyFromId(newOrbit.orbiting);
        setBody(newBody);

        if(newAlt) {
            setAlt(String(newAlt));
        } else {
            const newAlt = String(newOrbit.semiMajorAxis - newBody.radius)
            setAlt(newAlt);
            altRef.current = newAlt;
        }
    }

    useEffect(() => {
        // detect a system change, and reset the orbit to the default for the new body
        if(system !== systemRef.current) {
            systemRef.current = system;
            setBodyOptions(createBodyItems(system))
            if(!system.orbiterIds.has(bodyId)) {
                const newBodyId = Math.max(...[...system.orbiterIds.keys()])
                setBodyId(newBodyId);
            } else {
                const newBody = system.bodyFromId(bodyId);
                const orb = defaultOrbit(system, bodyId);
                setOrbitAndFields(orb, orb.semiMajorAxis - newBody.radius);
            }
        // detect a change in selection of the loaded vessels from the savefile, and change the orbit to match
        } else if(vesselId !== vesselIdRef.current || vessels !== vesselsRef.current) {
            vesselIdRef.current = vesselId;
            vesselsRef.current = vessels;
            if(vesselId >= 0) {
                setOrbitAndFields(vessels[vesselId].orbit);
            }           
        // detect a change in the selection of a body, and change the orbit to the default one
        } else if(bodyId !== bodyIdRef.current) {
            bodyIdRef.current = bodyId;
            const newBody = system.bodyFromId(bodyId);
            setBody(newBody);
            const orb = defaultOrbit(system, bodyId);
            setOrbitAndFields(orb, orb.semiMajorAxis - newBody.radius);
        // detect a change in the altitude, and change the SMA to match
        } else if(alt !== altRef.current) {
            altRef.current = alt;
            const newSMA = Number(alt) + body.radius;
            setSma(String(newSMA));
        // detect a change in the orbital element inputs, and update the orbit to match
        } else {
            const newOrbit = {
                semiMajorAxis:      Number(sma),
                eccentricity:       Number(ecc),
                inclination:        Number(inc),
                argOfPeriapsis:     Number(arg),
                ascNodeLongitude:   Number(lan),
                meanAnomalyEpoch:   Number(moe),
                epoch:              Number(epoch),
                orbiting:           bodyId,
            } as OrbitalElements;
            setOrbit(newOrbit);
            orbitRef.current = newOrbit;
            
            // if it's the SMA that's changed, update the alitude
            if(sma !== smaRef.current) {
                smaRef.current = sma;
                const newSma = Number(sma)
                if(!isNaN(newSma) && sma !== '' && newSma !== Number(altRef.current)) {
                    const newAlt = String(newSma - body.radius);
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
                <FormControl>
                    <InputLabel id={"body-select-label-"+label}>Body</InputLabel>
                    <Select
                        labelId={"body-select-label-"+label}
                        label='Body'
                        id={'body-'+label}
                        value={bodyId}
                        onChange={(e) => setBodyId(Number(e.target.value))}
                        error={isNaN(bodyId)}
                    >
                        {bodyOptions}
                    </Select>
                </FormControl>
                <RequiredNumberField
                    label='Altitude (m)'
                    value={alt}
                    setValue={setAlt}
                    min={0}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAlt(e.target.value)}
                 />
                <Collapse in={optsVisible} timeout="auto">
                    <Stack spacing={1.5}>
                        <RequiredNumberField
                            label='Semi-major Axis (m)' 
                            value={sma}
                            setValue={setSma}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSma(e.target.value)}
                            error = {parseFloat(sma) === 0 || parseFloat(ecc) === 1 || (parseFloat(ecc) < 1 && parseFloat(sma) < 0) || (parseFloat(ecc) > 1 && parseFloat(sma) > 0)}
                        />
                        <RequiredNumberField
                            label='Eccentricity' 
                            value={ecc}
                            min={0}
                            step={0.1}
                            setValue={setEcc}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEcc(e.target.value)}
                            error={parseFloat(ecc) === 1 || (parseFloat(ecc) < 1 && parseFloat(sma) < 0) || (parseFloat(ecc) > 1 && parseFloat(sma) > 0)}
                         />
                        <RequiredNumberField
                            label={'Inclination (\u00B0)'} 
                            value={inc}
                            setValue={setInc}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInc(e.target.value)}
                         />
                        <RequiredNumberField
                            label={'Argument of the Periapsis (\u00B0)'} 
                            value={arg}
                            setValue={setArg}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setArg(e.target.value)}
                         />
                        <RequiredNumberField
                            label={'Longitude of the Ascending Node (\u00B0)'} 
                            value={lan}
                            setValue={setLan}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLan(e.target.value)}
                         />
                        <RequiredNumberField
                            label='Mean Anomaly at Epoch (rad)' 
                            value={moe}
                            setValue={setMoe}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMoe(e.target.value)}
                         />
                        <RequiredNumberField
                            label='Epoch (s)' 
                            value={epoch}
                            setValue={setEpoch}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEpoch(e.target.value)}
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
                <PasteButton setObj={(o: IOrbit) => setOrbitAndFields(o)} copiedObj={copiedOrbit}/>
                <IconButton 
                    size="small"
                    color="inherit"
                    // @ts-ignore
                    onClick={() => { setOrbitAndFields(defaultOrbit(system, bodyId)); setVesselId(-1) }}
                >
                    <ClearIcon />
                </IconButton>
            </Stack>
        </>
    )
}

export default React.memo(OrbitControls);