import SolarSystem from '../../main/objects/system';

import React, { useState, useEffect } from 'react';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import IconButton from '@mui/material/IconButton';

import { atom, useAtom } from 'jotai';
import { flybyIdSequenceAtom, multiFlybyEndOrbitAtom, multiFlybyFlightTimesAtomsAtom, multiFlybyStartOrbitAtom, multiFlybyDSNperLegAtom, systemAtom } from '../../App';
import { makeDateFields } from '../../utils';
import { NumberField } from '../NumberField';
import { Typography } from '@mui/material';

function handleBodyIdChange(index: number, flybyIdSequence: number[], setFlybyIdSequence: React.Dispatch<React.SetStateAction<number[]>>) {
    return (event: any): void => {
        const newFlybyIdSequence = flybyIdSequence.slice();
        newFlybyIdSequence[index] = event.target.value;
        setFlybyIdSequence(newFlybyIdSequence);
    };
}

function createBodyItems(system: SolarSystem, startBodyId: number, endBodyId: number) {
    let transferBodyId: number = 0;
    try {
        transferBodyId = system.commonAttractorId(startBodyId, endBodyId);
    } catch {}
    const transferBody = system.bodyFromId(transferBodyId);
    const options: JSX.Element[] = [];
    const bds = transferBody.orbiters;
    for (let i = 0; i < bds.length; i++) {
        options.push(<MenuItem key={bds[i].id} value={bds[i].id}>{bds[i].name}</MenuItem>)
    }
    return options;
}

function createBodyDropdown(bodyOptions: JSX.Element[], index: number, value: number, flybyIdSequence: number[], setFlybyIdSequence: React.Dispatch<React.SetStateAction<number[]>>) {
    const label = String(index + 1);
    const values = bodyOptions.map(m => parseInt(m.key as string))
    return (
        <FormControl key={"body"+String(index)} sx={{ minWidth: 120, flexGrow: 1 }}>
            <InputLabel id={"body-select-label-"+label}>{"Flyby Body #"+label}</InputLabel>
            <Select
                labelId={"body-select-label-"+label}
                label={"Flyby #"+label}
                id={'body-'+label}
                value={value}
                onChange={handleBodyIdChange(index, flybyIdSequence, setFlybyIdSequence)}
                error={isNaN(value) || !values.includes(value)}
            >
                {bodyOptions}
            </Select>
        </FormControl>
    )
}

function getDSNLabels(startIdx: number, endIdx: number, flybyIdSequence: number[], system: SolarSystem) {
    const startName = system.bodyFromId(startIdx).name;
    const endName = system.bodyFromId(endIdx).name;
    const flybyNames = flybyIdSequence.map(idx => {
        try {
            return system.bodyFromId(idx).name 
        } catch {
            return 'Invalid Body'
        }
    })
    flybyNames.push!(endName);
    const labels = flybyNames.map((name, index) =>
        (index === 0 ? startName : flybyNames[index - 1]) + '-' + name
    )
    return labels;
}

function FlybySequenceControls() {
    const [system] = useAtom(systemAtom);
    const [startOrbit] = useAtom(multiFlybyStartOrbitAtom);
    const [endOrbit] = useAtom(multiFlybyEndOrbitAtom);
    const [flybyIdSequence, setFlybyIdSequence] = useAtom(flybyIdSequenceAtom);
    const [flightTimesAtoms, setFlightTimesAtoms] = useAtom(multiFlybyFlightTimesAtomsAtom);
    const [DSNperLeg, setDSNperLeg] = useAtom(multiFlybyDSNperLegAtom);

    const [bodyOptions, setBodyOptions] = useState(createBodyItems(system, startOrbit.orbiting, endOrbit.orbiting));
    const [DSNLabels, setDSNLabels] = useState(getDSNLabels(startOrbit.orbiting, endOrbit.orbiting, flybyIdSequence, system));

    const handleAddFlyby = (event: any): void => {
        const transferBodyId = system.commonAttractorId(startOrbit.orbiting, endOrbit.orbiting);
        const transferBody = system.bodyFromId(transferBodyId);
        if(transferBody.orbiterIds.length > 0){
            const newFlybyIdSequence = flybyIdSequence.slice();
            newFlybyIdSequence.push(transferBody.orbiterIds[0]);
            const newDSNperLeg = DSNperLeg.slice();
            newDSNperLeg.push(0);
            setFlybyIdSequence(newFlybyIdSequence);
            setDSNperLeg(newDSNperLeg);
            setFlightTimesAtoms([...flightTimesAtoms, atom(makeDateFields()), atom(makeDateFields())]);
        }
    };

    const handleRemoveFlyby = (event: any): void => {
        const newFlybyIdSequence = flybyIdSequence.slice(0,-1);
        const newDSNperLeg = DSNperLeg.slice(0,-1);
        setFlybyIdSequence(newFlybyIdSequence);
        setDSNperLeg(newDSNperLeg);
        setFlightTimesAtoms(flightTimesAtoms.slice(0, -2));
    };
    
    
    const handleDSNchange = (index: number) => (update: string | Function) => {
        setDSNperLeg((prevDSNperLeg: number[]) => {
            const newDSNperLeg = prevDSNperLeg.slice();
            if( typeof update === "string") {
                newDSNperLeg[index] = Math.round(Number(update));
            } else {
                const str = update(String(DSNperLeg[index]));
                newDSNperLeg[index] = Math.round(Number(str));
            }
            return newDSNperLeg;
        }
    )}

    useEffect(() => {
        console.log("trigger update based on new system or start/end body")
        setBodyOptions(createBodyItems(system, startOrbit.orbiting, endOrbit.orbiting));
        setDSNLabels(getDSNLabels(startOrbit.orbiting, endOrbit.orbiting, flybyIdSequence, system));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [system, startOrbit.orbiting, endOrbit.orbiting]);   

    useEffect(() => {
        setDSNLabels(getDSNLabels(startOrbit.orbiting, endOrbit.orbiting, flybyIdSequence, system));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [flybyIdSequence])

    return(
        <Stack spacing={1.5} >
            <Stack key={-1} direction="row" spacing={1} sx={{marginBottom: "2px"}}>
                <Box component='div' sx={{ display: {flexGrow: 1}}} />
                <Typography variant='body2'># Deep Space Maneuvers</Typography>
            </Stack>
            <Stack key={0} direction="row" spacing={1} justifyContent='center' alignItems='center' sx={{marginBottom: "0px"}}>
                { flybyIdSequence.length > 0 &&
                    <>
                    <Box component='div' sx={{ display: {flexGrow: 1}}} />
                    <Typography variant='body2'>Body Names</Typography>
                    </>
                }
                <Box component='div' sx={{ display: {flexGrow: 1}}} />
                <NumberField 
                    label={DSNLabels[0]}
                    value={DSNperLeg[0]}
                    setValue={handleDSNchange(0)}
                    error={DSNperLeg[0] % 1 !== 0}
                    min={0}
                    max={3}
                    step={1}
                    sx={{minWidth: "125px", maxWidth: "150px", display: {alignItems: 'right'}}}
                />
            </Stack>
            {flybyIdSequence.map((id, index) => 
                <Stack key={index} direction="row" spacing={1} >
                    {createBodyDropdown(bodyOptions, index, id, flybyIdSequence, setFlybyIdSequence)}
                    <NumberField 
                        label={DSNLabels[index + 1]}
                        value={DSNperLeg[index + 1]}
                        setValue={handleDSNchange(index + 1)}
                        error={DSNperLeg[index + 1] % 1 !== 0}
                        min={0}
                        max={3}
                        step={1}
                        sx={{minWidth: "125px", maxWidth: "150px"}}
                    />
                </Stack>
            )}
            <Stack direction="row" spacing={2} textAlign="center" justifyContent="center">
                <IconButton sx={{border: "1px solid"}} size="small" onClick={handleAddFlyby}>
                    <AddIcon />
                </IconButton>
                <IconButton sx={{border: "1px solid"}} size="small" onClick={handleRemoveFlyby}>
                    <RemoveIcon />
                </IconButton>
            </Stack>
        </Stack>
    )
}

export default FlybySequenceControls;