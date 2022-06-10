import SolarSystem from "../../main/objects/system";
import Color from "../../main/objects/color";

import { NumberField } from "../NumberField";

import React, {useEffect, useState, useRef } from "react";
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import MenuItem from "@mui/material/MenuItem";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import Divider from '@mui/material/Divider';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import AddIcon from '@mui/icons-material/Add';
import ClearIcon from '@mui/icons-material/Clear';

import { colorFromString, hexFromColorString } from "../../main/libs/math";

import { useAtom } from "jotai";
import { kspSystem, bodyConfigsAtom, editorSelectedNameAtom } from "../../App";
import { TextField, Typography } from "@mui/material";
import { configReferenceBodyName } from "../../main/utilities/loadPlanetConfig";


function createBodyItems(sunConfig: SunConfig, bodyConfigs: OrbitingBodyConfig[]) {
    const sunName = sunConfig.name || sunConfig.templateName as string;
    const options =[<MenuItem key={-1} value={''}>{"Use Template's"}</MenuItem>, <MenuItem key={0} value={sunName}>{sunName}</MenuItem>];
    for (let i = 0; i < bodyConfigs.length; i++) {
        const bodyName = bodyConfigs[i].name || bodyConfigs[i].templateName as string;
        options.push(<MenuItem key={i+1} value={bodyName}>{bodyName}</MenuItem>)
    }
    return options;
}

function createTemplateItems(system: SolarSystem) {
    const options: JSX.Element[] = [];
    const bds = system.orbiting;
    for (let i = 0; i < bds.length; i++) {
        options.push(<MenuItem key={bds[i].name} value={bds[i].name}>{bds[i].name}</MenuItem>)
    }
    return options;
}

function BodyConfigControls() {
    const [bodyConfigs, setBodyConfigs] = useAtom(bodyConfigsAtom);
    const sunRef = useRef(bodyConfigs[0]);

    const [selectedName, setSelectedName] = useAtom(editorSelectedNameAtom);
    const selectedNameRef = useRef(selectedName);

    const [idx, setIdx] = useState(bodyConfigs.findIndex(config => config.name ? (config.name === selectedName) : (config.templateName === selectedName)));

    const [bodyOptions, setBodyOptions] = useState(createBodyItems(bodyConfigs[0], bodyConfigs.slice(1)));
    const templateOptions = useRef(createTemplateItems(kspSystem)).current;

    const [color, setColor] = useState(bodyConfigs[idx].color || '');

    const [flightGlobalsIndex, setFlightGlobalsIndex] = useState(bodyConfigs[idx].flightGlobalsIndex || '');

    const [radius, setRadius] = useState(bodyConfigs[idx].radius || '');
    const [maxTerrainHeight, setMaxTerrainHeight] = useState((bodyConfigs[idx] as OrbitingBodyConfig).maxTerrainHeight || '');
    const [atmosphereHeight, setAtmosphereHeight] = useState(bodyConfigs[idx].atmosphereHeight || '');
    const [geeASL, setGeeASL] = useState(bodyConfigs[idx].geeASL || '');
    const [stdGravParam, setStdGravParam] = useState(bodyConfigs[idx].stdGravParam || '');
    const [mass, setMass] = useState(bodyConfigs[idx].stdGravParam || '');
    const [soi, setSoi] = useState((bodyConfigs[idx] as OrbitingBodyConfig).soi || '');

    const [semiMajorAxis, setSemiMajorAxis] = useState((bodyConfigs[idx] as OrbitingBodyConfig).semiMajorAxis || '');
    const [eccentricity, setEccentricity] = useState((bodyConfigs[idx] as OrbitingBodyConfig).eccentricity || '');
    const [inclination, setInclination] = useState((bodyConfigs[idx] as OrbitingBodyConfig).inclination || '');
    const [argOfPeriapsis, setArgOfPeriapsis] = useState((bodyConfigs[idx] as OrbitingBodyConfig).argOfPeriapsis || '');
    const [ascNodeLongitude, setAscNodeLongitude] = useState((bodyConfigs[idx] as OrbitingBodyConfig).ascNodeLongitude || '');
    const [meanAnomalyEpoch, setMeanAnomalyEpoch] = useState((bodyConfigs[idx] as OrbitingBodyConfig).meanAnomalyEpoch || '');
    const [epoch, setEpoch] = useState((bodyConfigs[idx] as OrbitingBodyConfig).epoch || '');

    const [physOpen, setPhysOpen] = useState(true);
    const [orbitOpen, setOrbitOpen] = useState(true);

    function setValue(property: string) {
        return (value: string) => {
            const newConfigs = [...bodyConfigs];
            const newConfig = Object.assign(bodyConfigs[idx]);
            newConfig[property] = value === '' ? undefined : value;
            newConfigs[idx] = newConfig;
            setBodyConfigs(newConfigs); 
            if(idx === 0) {
                sunRef.current = newConfigs[0];
            }
        }
    }

    function handleChange(property: string) {
        return (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent) => {
            setValue(property)(event.target.value)
        }
    }

    const newNameIsDuplicate = (name: string) => {
        const existingNames = bodyConfigs.map(c => c.name || c.templateName as string);        
        return existingNames.find(existing => existing === name) !== undefined;
    }

    const newUniqueName = (name: string) => {
        let newName = name;
        let counter = 1;
        while(newNameIsDuplicate(newName)) {
            newName = name + "("+String(counter)+")"
            counter++;
        }
        return newName;
    }

    const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newName = newUniqueName(event.target.value)
        const originalName = bodyConfigs[idx].name || bodyConfigs[idx].templateName as string;
        const newConfigs = [...bodyConfigs];
        const nameChangedConfig = Object.assign(bodyConfigs[idx]);
        nameChangedConfig.name = newName === '' ? undefined : newName;
        newConfigs[idx] = nameChangedConfig;

        for(let i=1; i<newConfigs.length; i++) {
            if(i === idx) { continue };
            const config = newConfigs[i] as OrbitingBodyConfig;
            const refName = configReferenceBodyName(config, kspSystem);
            if(refName === originalName) {
                const newChildConfig = Object.assign(newConfigs[i]);
                newChildConfig.referenceBody = newName === '' ? nameChangedConfig.templateName as string : newName;
                newConfigs[i] = newChildConfig;
            }
        }

        setBodyConfigs(newConfigs); 
        setSelectedName(newName);
        selectedNameRef.current = newName;
    }

    const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setColor(event.target.value);
        if(event.target.value !== ''){
            console.log(event.target.value)
            const color = new Color(colorFromString(event.target.value));
            setValue("color")(color.toString());
        } else {
            setValue("color")('');
        }
    }

    // update displayed inputs from selectedName change
    useEffect(() => {
        if((selectedName !== selectedNameRef.current) || sunRef.current !== bodyConfigs[0]) {
            sunRef.current = bodyConfigs[0];
            selectedNameRef.current = selectedName;
            const newIdx = bodyConfigs.findIndex(config => config.name ? (config.name === selectedName) : (config.templateName === selectedName))
            setIdx(newIdx);
            setBodyOptions(createBodyItems(bodyConfigs[0], bodyConfigs.slice(1)));

            setColor(bodyConfigs[newIdx].color || '');

            setFlightGlobalsIndex(bodyConfigs[newIdx].flightGlobalsIndex || '');
        
            setRadius(bodyConfigs[newIdx].radius || '');
            setMaxTerrainHeight((bodyConfigs[newIdx] as OrbitingBodyConfig).maxTerrainHeight || '');
            setAtmosphereHeight(bodyConfigs[newIdx].atmosphereHeight || '');
            setGeeASL(bodyConfigs[newIdx].geeASL || '');
            setStdGravParam(bodyConfigs[newIdx].stdGravParam || '');
            setMass(bodyConfigs[newIdx].mass || '');
            setSoi((bodyConfigs[newIdx] as OrbitingBodyConfig).soi || '');
        
            setSemiMajorAxis((bodyConfigs[newIdx] as OrbitingBodyConfig).semiMajorAxis || '');
            setEccentricity((bodyConfigs[newIdx] as OrbitingBodyConfig).eccentricity || '');
            setInclination((bodyConfigs[newIdx] as OrbitingBodyConfig).inclination || '');
            setArgOfPeriapsis((bodyConfigs[newIdx] as OrbitingBodyConfig).argOfPeriapsis || '');
            setAscNodeLongitude((bodyConfigs[newIdx] as OrbitingBodyConfig).ascNodeLongitude || '');
            setMeanAnomalyEpoch((bodyConfigs[newIdx] as OrbitingBodyConfig).meanAnomalyEpoch || '');
            setEpoch((bodyConfigs[newIdx] as OrbitingBodyConfig).epoch || '');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedName, bodyConfigs[0]])

    // update config from input changes

    useEffect(() => {
        if(!isNaN(Number(flightGlobalsIndex)) || flightGlobalsIndex === '') {
            setValue("flightGlobalsIndex")(flightGlobalsIndex);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [flightGlobalsIndex])

    useEffect(() => {
        if(!isNaN(Number(radius)) || radius === '') {
            setValue("radius")(radius);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [radius])
    useEffect(() => {
        if(!isNaN(Number(maxTerrainHeight)) || maxTerrainHeight === '') {
            setValue("maxTerrainHeight")(maxTerrainHeight);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [maxTerrainHeight])
    useEffect(() => {
        if(!isNaN(Number(atmosphereHeight)) || atmosphereHeight === '') {
            setValue("atmosphereHeight")(atmosphereHeight);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [atmosphereHeight])
    useEffect(() => {
        if(!isNaN(Number(geeASL)) || geeASL === '') {
            setValue("geeASL")(geeASL);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [geeASL])
    useEffect(() => {
        if(!isNaN(Number(stdGravParam)) || stdGravParam === '') {
            setValue("stdGravParam")(stdGravParam);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stdGravParam])
    useEffect(() => {
        if(!isNaN(Number(mass)) || mass === '') {
            setValue("mass")(mass);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mass])
    useEffect(() => {
        if(!isNaN(Number(soi)) || soi === '') {
            setValue("soi")(soi);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [soi])

    useEffect(() => {
        if(!isNaN(Number(semiMajorAxis)) || semiMajorAxis === '') {
            setValue("semiMajorAxis")(semiMajorAxis);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [semiMajorAxis])
    useEffect(() => {
        if(!isNaN(Number(eccentricity)) || eccentricity === '') {
            setValue("eccentricity")(eccentricity);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [eccentricity])
    useEffect(() => {
        if(!isNaN(Number(inclination)) || inclination === '') {
            setValue("inclination")(inclination);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [inclination])
    useEffect(() => {
        if(!isNaN(Number(argOfPeriapsis)) || argOfPeriapsis === '') {
            setValue("argOfPeriapsis")(argOfPeriapsis);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [argOfPeriapsis])
    useEffect(() => {
        if(!isNaN(Number(ascNodeLongitude)) || ascNodeLongitude === '') {
            setValue("ascNodeLongitude")(ascNodeLongitude);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ascNodeLongitude])
    useEffect(() => {
        if(!isNaN(Number(meanAnomalyEpoch)) || meanAnomalyEpoch === '') {
            setValue("meanAnomalyEpoch")(meanAnomalyEpoch);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [meanAnomalyEpoch])
    useEffect(() => {
        if(!isNaN(Number(epoch)) || epoch === '') {
            setValue("epoch")(epoch);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [epoch])

    return (
        <Stack alignItems='center' >
            <Stack spacing={1.5} sx={{ width: '90%', maxWidth: 500, my: 2, mx: 2 }}>
                <Typography variant="h5">Body Configuration</Typography>
                {/* <Typography>Identifiers</Typography> */}
                <Divider />
                <Stack direction="row" alignItems="center" justifyContent="center">
                    <Button 
                        variant="contained" 
                        endIcon={<AddIcon />} 
                        sx={{maxWidth: 200}}
                        onClick={() => {
                            const newBodyConfig = {name: newUniqueName('New Body'), templateName: 'Kerbin'} as OrbitingBodyConfig;
                            setBodyConfigs([...bodyConfigs, newBodyConfig]);
                            setSelectedName(newBodyConfig.name as string);
                            setIdx(bodyConfigs.length);
                        }}
                    >
                        New
                    </Button>
                    <Box flexGrow={1} sx={{maxWidth: '10%'}}/>
                    <Button
                        variant="contained"
                        endIcon={<ClearIcon />}
                        sx={{maxWidth: 200}}
                        disabled={idx === 0}
                        onClick={() => {
                            const newBodyConfigs = [...bodyConfigs.slice(0, idx), ...bodyConfigs.slice(idx+1)];
                            const newIdx = Math.min(idx, newBodyConfigs.length - 1);
                            setBodyConfigs(newBodyConfigs);
                            setIdx(newIdx);
                        }}
                    >
                        Delete
                    </Button>
                </Stack>
                <TextField 
                    label='Name' 
                    spellCheck={false}
                    value={bodyConfigs[idx].name || ''}
                    onChange={handleNameChange}
                />
                <FormControl>
                    <InputLabel id={"template-select-label"}>Template</InputLabel>
                    <Select
                        labelId={"template-select-label"}
                        label='Template'
                        id={'template'}
                        value={bodyConfigs[idx].templateName || ''}
                        onChange={handleChange("templateName")}
                    >
                        {idx === 0 ? [<MenuItem key={"Sun"} value={"Sun"}>{"Sun"}</MenuItem>] : templateOptions}
                    </Select>
                </FormControl>
                <TextField 
                    label='Color'
                    spellCheck={false}
                    value={color}
                    onChange={handleColorChange}
                    // @ts-ignore
                    inputProps={{ style: {color: bodyConfigs[idx].color ? hexFromColorString(bodyConfigs[idx].color) : 'primary'} }}
                />
                {idx !== 0 &&
                    <NumberField
                        label='Flight Globals Index' 
                        value={bodyConfigs[idx].flightGlobalsIndex || ''}
                        setValue={setFlightGlobalsIndex}
                        onChange={(e) => setFlightGlobalsIndex(e.target.value)}
                        error={flightGlobalsIndex !== '' ? (Number(flightGlobalsIndex) < 1) : false}
                    />
                }

                <Stack direction="row">
                    <Typography >
                        Physical Characteristics
                    </Typography>
                    <Box sx={{ flexGrow: 1 }} />
                    <Box>
                        <IconButton
                            size="small"
                            onClick={() => setPhysOpen(!physOpen)}
                        >
                            {physOpen ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
                        </IconButton>
                    </Box>
                </Stack>
                <Divider />
                <Collapse in={physOpen}>
                    <Stack spacing={1.5}>
                        <NumberField
                            label='Radius (m)' 
                            value={radius}
                            setValue={setRadius}
                            onChange={(e) => setRadius(e.target.value)}
                            error={radius !== '' ? (Number(radius) <= 0) : false}
                        />
                        {idx !==0 &&                    
                            <NumberField
                                label='Maximum Terrain Height (m)' 
                                value={maxTerrainHeight}
                                setValue={setMaxTerrainHeight}
                                onChange={(e) => setMaxTerrainHeight(e.target.value)}
                                error={maxTerrainHeight !== '' ? (Number(maxTerrainHeight) <= 0) : false}
                            />
                        }
                        <NumberField
                            label='Atmosphere Height (m)' 
                            value={atmosphereHeight}
                            setValue={setAtmosphereHeight}
                            onChange={(e) => setAtmosphereHeight(e.target.value)}
                            error={atmosphereHeight !== '' ? (Number(atmosphereHeight) <= 0) : false}
                        />
                        <NumberField
                            label='Surface Gravity (/ 9.80665m/s)' 
                            value={geeASL}
                            setValue={setGeeASL}
                            onChange={(e) => setGeeASL(e.target.value)}
                            error={geeASL !== '' ? (Number(geeASL) <= 0) : false}
                        />
                        <NumberField
                            label='Gravity Parameter (m3/s2)' 
                            value={stdGravParam}
                            setValue={setStdGravParam}
                            onChange={(e) => setStdGravParam(e.target.value)}
                            error={stdGravParam !== '' ? (Number(stdGravParam) <= 0) : false}
                        />
                        <NumberField
                            label='Mass (kg)' 
                            value={mass}
                            setValue={setMass}
                            onChange={(e) => setMass(e.target.value)}
                            error={mass !== '' ? (Number(mass) <= 0) : false}
                        />
                        {idx !==0 &&    
                            <NumberField
                                label='Sphere of Influence (m)' 
                                value={soi || ''}
                                setValue={setSoi}
                                onChange={(e) => setSoi(e.target.value)}
                                error={soi !== '' ? (Number(soi) <= 0) : false}
                            />
                        }
                    </Stack>
                </Collapse>
                

                {idx !== 0 &&
                    <>
                        <Stack direction="row">
                            <Typography >
                                Orbital Characteristics
                            </Typography>
                            <Box sx={{ flexGrow: 1 }} />
                            <Box>
                                <IconButton
                                    size="small"
                                    onClick={() => setOrbitOpen(!orbitOpen)}
                                >
                                    {orbitOpen ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
                                </IconButton>
                            </Box>
                        </Stack>
                        <Divider />
                        <Collapse in={orbitOpen}>
                            <Stack spacing={1.5} >
                                <FormControl>
                                    <InputLabel id={"ref-body-select-label"}>Reference Body</InputLabel>
                                    <Select
                                        labelId={"ref-body-select-label"}
                                        label='Reference Body'
                                        id={'refbody'}
                                        value={(bodyConfigs[idx] as OrbitingBodyConfig).referenceBody || ''}
                                        onChange={handleChange("referenceBody")}
                                    >
                                        {bodyOptions}
                                    </Select>
                                </FormControl>
                                <NumberField
                                    label='Semi-major Axis (m)' 
                                    value={semiMajorAxis}
                                    setValue={setSemiMajorAxis}
                                    onChange={(e) => setSemiMajorAxis(e.target.value)}
                                    error={semiMajorAxis !== '' ? (Number(semiMajorAxis) <= 0) : false}
                                />
                                <NumberField
                                    label='Eccentricity' 
                                    value={eccentricity}
                                    setValue={setEccentricity}
                                    onChange={(e) => setEccentricity(e.target.value)}
                                    step={0.1}
                                    error={eccentricity !== '' ? (Number(eccentricity) < 0 || Number(eccentricity) >= 1) : false}
                                />
                                <NumberField
                                    label={'Inclination (\u00B0)'} 
                                    value={inclination}
                                    setValue={setInclination}
                                    onChange={(e) => setInclination(e.target.value)}
                                />
                                <NumberField
                                    label={'Argument of the Periapsis (\u00B0)'} 
                                    value={argOfPeriapsis}
                                    setValue={setArgOfPeriapsis}
                                    onChange={(e) => setArgOfPeriapsis(e.target.value)}
                                />
                                <NumberField
                                    label={'Longitude of the Ascending Node (\u00B0)'} 
                                    value={ascNodeLongitude}
                                    setValue={setAscNodeLongitude}
                                    onChange={(e) => setAscNodeLongitude(e.target.value)}
                                />
                                <NumberField
                                    label='Mean Anomaly at Epoch (rad)' 
                                    value={meanAnomalyEpoch}
                                    setValue={setMeanAnomalyEpoch}
                                    onChange={(e) => setMeanAnomalyEpoch(e.target.value)}
                                />
                                <NumberField
                                    label='Epoch (s)' 
                                    value={epoch}
                                    setValue={setEpoch}
                                    onChange={(e) => setEpoch(e.target.value)}
                                />
                            </Stack>
                        </Collapse>
                    </>
                }
            </Stack>
        </Stack>
    )
}

export default React.memo(BodyConfigControls);