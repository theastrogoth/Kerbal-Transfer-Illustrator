import SolarSystem from "../main/objects/system";
import Vessel from "../main/objects/vessel";
import { radToDeg } from "../main/libs/math";

import RequiredNumberField from "./NumberField";
import VesselSelect from "./VesselSelect";

import React, {useEffect, useState } from "react";
import Box from "@mui/material/Box";
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Button from '@mui/material/Button';
import Stack from "@mui/material/Stack";
import Collapse from "@mui/material/Collapse";
import PasteButton from "./PasteButton";


export type OrbitControlsState = {
    orbit:      OrbitalElements,
    setOrbit:   React.Dispatch<React.SetStateAction<OrbitalElements>>,
    vesselId:   number,
    setVesselId: React.Dispatch<React.SetStateAction<number>>,
  }

type OrbitControlsProps = {
    label:          string,
    system:         SolarSystem,
    vessels:        Vessel[],
    state:          OrbitControlsState,
    copiedOrbit:    IOrbit,
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

function handleChange(setFunction: Function) {
    return (
        (event: React.ChangeEvent<HTMLInputElement>): void => {
            setFunction(event.target.value)
        }
    )
}

export function setOrbitState(state: OrbitControlsState, orbit: IOrbit, vesselId: number = -1) {
    state.setOrbit(orbit)
    state.setVesselId(vesselId);
}


function OrbitControls({label, system, vessels, state, copiedOrbit, vesselSelect = true}: OrbitControlsProps) {
    const [sma, setSma] = useState(String(state.orbit.semiMajorAxis));
    const [ecc, setEcc] = useState(String(state.orbit.eccentricity));
    const [inc, setInc] = useState(String(state.orbit.inclination));
    const [arg, setArg] = useState(String(state.orbit.argOfPeriapsis));
    const [lan, setLan] = useState(String(state.orbit.ascNodeLongitude));
    const [moe, setMoe] = useState(String(state.orbit.meanAnomalyEpoch));
    const [epoch, setEpoch] = useState(String(state.orbit.epoch));
    const [bodyId, setBodyId] = useState(state.orbit.orbiting);

    const [body, setBody] = useState(system.bodyFromId(state.orbit.orbiting))
    const [vesselId, setVesselId] = useState(-1);

    const [alt, setAlt] = useState(String(state.orbit.semiMajorAxis - body.radius));

    const [optsVisible, setOptsVisible] = useState(false);
    const [bodyOptions, setBodyOptions] = useState(createBodyItems(system));

    const handleBodyIdChange = (event: any): void => {
        const newBody = system.bodyFromId(event.target.value);
        setBodyId(event.target.value);
        setBody(newBody)
        setSma(String(parseFloat(alt) + newBody.radius))
    };

    const handleVesselIdChange = (event: any): void => {
        if(Number(event.target.value) === -1) {
            setVesselId(Number(event.target.value));     
            setBodyId(1);
            const body = system.bodyFromId(1);
            setBody(system.bodyFromId(1));
            setSma(String(100000 + body.radius));
            setAlt('100000');
            setEcc('0');
            setInc('0');
            setArg('0');
            setLan('0');
            setMoe('0');
            setEpoch('0');
        } else if(Number(event.target.value) >= 0 && Number(event.target.value) < vessels.length) {
            setVesselId(Number(event.target.value));
            const vessel = vessels[Number(event.target.value)];
            setBodyId(vessel.orbit.orbiting);
            const body = system.bodyFromId(vessel.orbit.orbiting);
            setBody(body);
            setSma(String(vessel.orbit.semiMajorAxis));
            setAlt(String(vessel.orbit.semiMajorAxis - body.radius));
            setEcc(String(vessel.orbit.eccentricity));
            setInc(String(radToDeg(vessel.orbit.inclination)));
            setArg(String(radToDeg(vessel.orbit.argOfPeriapsis)));
            setLan(String(radToDeg(vessel.orbit.ascNodeLongitude)));
            setMoe(String(vessel.orbit.meanAnomalyEpoch));
            setEpoch(String(vessel.orbit.epoch));
        }
    }

    const handleAltChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        setAlt(event.target.value);
        if(!isNaN(Number(event.target.value)) && event.target.value !== '') {
            setSma(String(+event.target.value + body.radius));
        }
    };
    const handleSmaChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        setSma(event.target.value);
        if(!isNaN(Number(event.target.value)) && event.target.value !== '') {
            setAlt(String(+event.target.value - body.radius));
        }
    };

    useEffect(() => {
        const newSma = Number(sma)
        if(!isNaN(newSma) && sma !== '') {
            const newAlt = String(newSma - body.radius);
            if(newAlt !== alt) {
                setAlt(newAlt);
            }
        }
    }, [sma])

    useEffect(() => {
        setBodyOptions(createBodyItems(system));
      }, [system]);

    useEffect(() => {
        state.setOrbit({
            semiMajorAxis:      Number(sma),
            eccentricity:       Number(ecc),
            inclination:        Number(inc),
            argOfPeriapsis:     Number(arg),
            ascNodeLongitude:   Number(lan),
            meanAnomalyEpoch:   Number(moe),
            epoch:              Number(epoch),
            orbiting:           bodyId,
        })
    }, [sma, ecc, inc, arg, lan, moe, epoch, bodyId])

    return (
        <label>
            {label}
            <Stack spacing={1.5}>
                {vesselSelect &&
                    <VesselSelect 
                        vessels={vessels}
                        vesselId={state.vesselId} 
                        label={label}
                        handleVesselIdChange={handleVesselIdChange} />
                }
                <FormControl sx={{ minWidth: 120 }}>
                    <InputLabel id={"body-select-label-"+label}>Body</InputLabel>
                    <Select
                        labelId={"body-select-label-"+label}
                        label='Body'
                        id={'body-'+label}
                        value={bodyId}
                        onChange={handleBodyIdChange}
                        error={isNaN(bodyId)}
                    >
                        {bodyOptions}
                    </Select>
                </FormControl>
                <RequiredNumberField
                    id={'altitude-'+label}
                    label='Altitude (m)'
                    value={alt}
                    inputProps={{ min: 0 }}
                    onChange={handleAltChange}
                    sx={{ fullWidth: true }} />
                <Collapse in={optsVisible} timeout="auto">
                    <Stack spacing={1.5}>
                        <RequiredNumberField
                            id={'sma-'+label}
                            label='Semi-major Axis (m)' 
                            value={sma}
                            onChange={handleSmaChange}
                            error = {parseFloat(sma) === 0 || parseFloat(ecc) === 1 || (parseFloat(ecc) < 1 && parseFloat(sma) < 0) || (parseFloat(ecc) > 1 && parseFloat(sma) > 0)}
                            sx={{ fullWidth: true }}/>
                        <RequiredNumberField
                            id={'ecc-'+label}
                            label='Eccentricity' 
                            value={ecc}
                            onChange={handleChange(setEcc)}
                            error={parseFloat(ecc) < 0 || parseFloat(ecc) === 1 || (parseFloat(ecc) < 1 && parseFloat(sma) < 0) || (parseFloat(ecc) > 1 && parseFloat(sma) > 0)}
                            sx={{ fullWidth: true }} />
                        <RequiredNumberField
                            id={'inc-'+label}
                            label={'Inclination (\u00B0)'} 
                            value={inc}
                            onChange={handleChange(setInc)}
                            sx={{ fullWidth: true }} />
                        <RequiredNumberField
                            id={'arg-'+label}
                            label={'Argument of the Periapsis (\u00B0)'} 
                            value={arg}
                            onChange={handleChange(setArg)}
                            sx={{ fullWidth: true }} />
                        <RequiredNumberField
                            id={'lan-'+label}
                            label={'Longitude of the Ascending Node (\u00B0)'} 
                            value={lan}
                            onChange={handleChange(setLan)}
                            sx={{ fullWidth: true }} />
                        <RequiredNumberField
                            id={'moe-'+label}
                            label='Mean Anomaly at Epoch (rad)' 
                            value={moe}
                            onChange={handleChange(setMoe)}
                            sx={{ fullWidth: true }} />
                        <RequiredNumberField
                            id={'epoch-'+label}
                            label='Epoch (s)' 
                            value={epoch}
                            onChange={handleChange(setEpoch)}
                            sx={{ fullWidth: true }} />
                        <Box justifyContent="center" sx={{ display: { xs: 'none', md: 'flex' } }} >
                            <PasteButton setObj={(o: IOrbit) => setOrbitState(state, o)} copiedObj={copiedOrbit}/>
                        </Box>
                    </Stack>
                </Collapse>
            </Stack>   
            <Box textAlign='center'>
                <Button 
                    variant="text" 
                    onClick={() => setOptsVisible(!optsVisible)}
                    sx={{ mx: 'auto' }}
                >
                    {(optsVisible ? '\u25B4' : '\u25BE' ) + ' Advanced Options'}
                </Button>
            </Box>
        </label>
    )
}

export default React.memo(OrbitControls);