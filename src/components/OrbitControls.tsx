import SolarSystem from "../main/objects/system";
import Vessel from "../main/objects/vessel";
import { radToDeg } from "../main/libs/math";

import RequiredNumberField from "./NumberField";

import React, {useEffect, useState } from "react";
import Box from "@mui/material/Box";
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Button from '@mui/material/Button';
import Stack from "@mui/material/Stack";
import Collapse from "@mui/material/Collapse";


export type OrbitControlsState = {
    vesselId:   number,
    bodyId:     number,
    sma:        string,
    ecc:        string,
    inc:        string,
    arg:        string,
    lan:        string,
    moe:        string,
    epoch:      string,
    setVesselId: React.Dispatch<React.SetStateAction<number>>,
    setBodyId:   React.Dispatch<React.SetStateAction<number>>,
    setSma:      React.Dispatch<React.SetStateAction<string>>,
    setEcc:      React.Dispatch<React.SetStateAction<string>>,
    setInc:      React.Dispatch<React.SetStateAction<string>>,
    setArg:      React.Dispatch<React.SetStateAction<string>>,
    setLan:      React.Dispatch<React.SetStateAction<string>>,
    setMoe:      React.Dispatch<React.SetStateAction<string>>,
    setEpoch:    React.Dispatch<React.SetStateAction<string>>,
  }

type OrbitControlsProps = {
    label:          string,
    system:         SolarSystem,
    vessels:        Vessel[],
    state:          OrbitControlsState,
};

function createBodyItems(system: SolarSystem) {
    const options =[<MenuItem key={system.sun.id} value={system.sun.id}>{system.sun.name}</MenuItem>];
    const bds = system.orbiting;
    for (let i = 0; i < bds.length; i++) {
        options.push(<MenuItem key={bds[i].id} value={bds[i].id}>{bds[i].name}</MenuItem>)
    }
    return options;
}

function createVesselItems(vessels: Vessel[]) {
    const options = [<MenuItem key={-1} value={-1}>None</MenuItem>];
    for(let i=0; i<vessels.length; i++) {
        options.push(<MenuItem key={i} value={i}>{vessels[i].name}</MenuItem>)
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


function OrbitControls({label, system, vessels, state}: OrbitControlsProps) {
    const [body, setBody] = useState(system.bodyFromId(state.bodyId))
    const [alt, setAlt] = useState(String(parseFloat(state.sma) - body.radius));

    const [optsVisible, setOptsVisible] = useState(false);

    const [bodyOptions, setBodyOptions] = useState(createBodyItems(system));
    const [vesselOptions, setVesselOptions] = useState(createVesselItems(vessels));

    const handleBodyIdChange = (event: any): void => {
        const newBody = system.bodyFromId(event.target.value);
        state.setBodyId(event.target.value);
        setBody(newBody)
        state.setSma(String(parseFloat(alt) + newBody.radius))
    };

    const handleVesselIdChange = (event: any): void => {
        if(event.target.value === -1) {
            state.setVesselId(event.target.value);     
            state.setBodyId(1);
            const body = system.bodyFromId(1);
            setBody(system.bodyFromId(1));
            state.setSma(String(100000 + body.radius));
            setAlt('100000');
            state.setEcc('0');
            state.setInc('0');
            state.setArg('0');
            state.setLan('0');
            state.setMoe('0');
            state.setEpoch('0');
        } else if(event.target.value > 0 && event.target.value < vessels.length) {
            state.setVesselId(event.target.value);
            const vessel = vessels[event.target.value];
            state.setBodyId(vessel.orbit.orbiting);
            const body = system.bodyFromId(vessel.orbit.orbiting);
            setBody(body);
            state.setSma(String(vessel.orbit.semiMajorAxis));
            setAlt(String(vessel.orbit.semiMajorAxis - body.radius));
            state.setEcc(String(vessel.orbit.eccentricity));
            state.setInc(String(radToDeg(vessel.orbit.inclination)));
            state.setArg(String(radToDeg(vessel.orbit.argOfPeriapsis)));
            state.setLan(String(radToDeg(vessel.orbit.ascNodeLongitude)));
            state.setMoe(String(vessel.orbit.meanAnomalyEpoch));
            state.setEpoch(String(vessel.orbit.epoch));
        }
    }

    const handleAltChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        setAlt(event.target.value);
        if(!isNaN(Number(event.target.value)) && event.target.value !== '') {
            state.setSma(String(+event.target.value + body.radius));
        }
    };
    const handleSmaChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        state.setSma(event.target.value);
        if(!isNaN(Number(event.target.value)) && event.target.value !== '') {
            setAlt(String(+event.target.value - body.radius));
        }
    };

    useEffect(() => {
        setBodyOptions(createBodyItems(system));
      }, [system]);    

      
    useEffect(() => {
        setVesselOptions(createVesselItems(vessels));
      }, [vessels]);   

    return (
        <label>
            {label}
            <Stack spacing={1.5}>
                {(vessels.length > 0) &&
                   <FormControl sx={{ minWidth: 120 }}>
                        <InputLabel id={"vessel-select-label-"+label}>Vessel</InputLabel>
                        <Select
                            labelId={"vessel-select-label-"+label}
                            label='Vessel'
                            id={'vessel-'+label}
                            value={state.vesselId}
                            onChange={handleVesselIdChange}
                        >
                            {vesselOptions}
                        </Select>
                    </FormControl>
                }
                <FormControl sx={{ minWidth: 120 }}>
                    <InputLabel id={"body-select-label-"+label}>Body</InputLabel>
                    <Select
                        labelId={"body-select-label-"+label}
                        label='Body'
                        id={'body-'+label}
                        value={state.bodyId}
                        onChange={handleBodyIdChange}
                        error={isNaN(state.bodyId)}
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
                            value={state.sma}
                            onChange={handleSmaChange}
                            error = {parseFloat(state.sma) === 0 || parseFloat(state.ecc) === 1 || (parseFloat(state.ecc) < 1 && parseFloat(state.sma) < 0) || (parseFloat(state.ecc) > 1 && parseFloat(state.sma) > 0)}
                            sx={{ fullWidth: true }}/>
                        <RequiredNumberField
                            id={'ecc-'+label}
                            label='Eccentricity' 
                            InputLabelProps={{ shrink: state.ecc !== ''}}
                            value={state.ecc}
                            onChange={handleChange(state.setEcc)}
                            error={parseFloat(state.ecc) < 0 || parseFloat(state.ecc) === 1 || (parseFloat(state.ecc) < 1 && parseFloat(state.sma) < 0) || (parseFloat(state.ecc) > 1 && parseFloat(state.sma) > 0)}
                            sx={{ fullWidth: true }} />
                        <RequiredNumberField
                            id={'inc-'+label}
                            label={'Inclination (\u00B0)'} 
                            value={state.inc}
                            onChange={handleChange(state.setInc)}
                            sx={{ fullWidth: true }} />
                        <RequiredNumberField
                            id={'arg-'+label}
                            label={'Argument of the Periapsis (\u00B0)'} 
                            value={state.arg}
                            onChange={handleChange(state.setArg)}
                            sx={{ fullWidth: true }} />
                        <RequiredNumberField
                            id={'lan-'+label}
                            label={'Longitude of the Ascending Node (\u00B0)'} 
                            value={state.lan}
                            onChange={handleChange(state.setLan)}
                            sx={{ fullWidth: true }} />
                        <RequiredNumberField
                            id={'moe-'+label}
                            label='Mean Anomaly at Epoch (rad)' 
                            value={state.moe}
                            onChange={handleChange(state.setMoe)}
                            sx={{ fullWidth: true }} />
                        <RequiredNumberField
                            id={'epoch-'+label}
                            label='Epoch (s)' 
                            value={state.epoch}
                            onChange={handleChange(state.setEpoch)}
                            sx={{ fullWidth: true }} />
                        </Stack>
                    </Collapse>
            </Stack>   
            <Box textAlign='center'>
                <Button 
                    variant="text" 
                    onClick={() => setOptsVisible(!optsVisible)}
                    sx={{ mx: 'auto' }}
                >
                    {(optsVisible ? "⏶" : "⏷" ) + ' Advanced Options'}
                </Button>
            </Box>
        </label>
    )
}

export default React.memo(OrbitControls);