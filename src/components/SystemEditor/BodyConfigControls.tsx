import SolarSystem from "../../main/objects/system";

import RequiredNumberField from "../NumberField";
import VesselSelect from "../VesselSelect";
import PasteButton from "../PasteButton";

import React, {useEffect, useState, useRef } from "react";
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import MenuItem from "@mui/material/MenuItem";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import Button from '@mui/material/Button';
import Stack from "@mui/material/Stack";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import ClearIcon from '@mui/icons-material/Clear';

import { defaultOrbit } from "../../utils";
import { radToDeg } from "../../main/libs/math";

import { useAtom } from "jotai";
import { kspSystem, sunConfigAtom, bodyConfigsAtom } from "../../App";
import { Typography } from "@mui/material";


function createBodyItems(sunConfig: SunConfig, bodyConfigs: OrbitingBodyConfig[]) {
    const options =[<MenuItem key={0} value={0}>{sunConfig.name}</MenuItem>];
    for (let i = 0; i < bodyConfigs.length; i++) {
        options.push(<MenuItem key={i} value={bodyConfigs[i].name}>{(bodyConfigs[i].name || bodyConfigs[i].templateName) as string}</MenuItem>)
    }
    return options;
}

function BodyConfigControls({idx}: {idx: number}) {
    const [sunConfig, setSunConfig] = useAtom(sunConfigAtom);
    const [bodyConfigs, setBodyConfigs] = useAtom(bodyConfigsAtom);

    function setValue(property: string) {
        return (value: string) => {
            const newConfigs = [...bodyConfigs];
            const newConfig = Object.assign(bodyConfigs[idx]);
            newConfig[property] = value;
            newConfigs[idx] = newConfig;
            setBodyConfigs(newConfigs); 
        }
    }
    
    function handleChange(property: string) {
        return (event: React.ChangeEvent<HTMLInputElement> | SelectChangeEvent) => {
            setValue(property)(event.target.value)
        }
    }

    return (
        <>
            <Stack spacing={1.5}>
                <RequiredNumberField
                    label='Semi-major Axis (m)' 
                    value={bodyConfigs[idx].semiMajorAxis || ''}
                    setValue={setValue("semiMajorAxis")}
                    onChange={handleChange("semiMajorAxis")}
                />
                <RequiredNumberField
                    label='Eccentricity' 
                    value={bodyConfigs[idx].eccentricity || ''}
                    setValue={setValue("eccentricity")}
                    onChange={handleChange("eccentricity")}
                />
                <RequiredNumberField
                    label={'Inclination (\u00B0)'} 
                    value={bodyConfigs[idx].inclination || ''}
                    setValue={setValue("inclination")}
                    onChange={handleChange("inclination")}
                />
                <RequiredNumberField
                    label={'Argument of the Periapsis (\u00B0)'} 
                    value={bodyConfigs[idx].argOfPeriapsis || ''}
                    setValue={setValue("argOfPeriapsis")}
                    onChange={handleChange("argOfPeriapsis")}
                />
                <RequiredNumberField
                    label={'Longitude of the Ascending Node (\u00B0)'} 
                    value={bodyConfigs[idx].ascNodeLongitude || ''}
                    setValue={setValue("ascNodeLongitude")}
                    onChange={handleChange("ascNodeLongitude")}
                />
                <RequiredNumberField
                    label='Mean Anomaly at Epoch (rad)' 
                    value={bodyConfigs[idx].meanAnomalyEpoch || ''}
                    setValue={setValue("meanAnomalyEpoch")}
                    onChange={handleChange("meanAnomalyEpoch")}
                />
                <RequiredNumberField
                    label='Epoch (s)' 
                    value={bodyConfigs[idx].epoch || ''}
                    setValue={setValue("epoch")}
                    onChange={handleChange("epoch")}
                />
            </Stack>
        </>
    )
}

export default React.memo(BodyConfigControls);