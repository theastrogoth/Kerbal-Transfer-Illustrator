import React, { useState, useEffect } from "react";
import Box from '@mui/system/Box';
import Tab from "@mui/material/Tab"
import Tabs from "@mui/material/Tabs";
import Stack from "@mui/material/Stack"
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from "@mui/material/IconButton";
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';

import VesselControls from "./VesselControls";
import SystemSelect from "../SystemSelect";
import TimeSettingsControls from "../TimeSettingsControls";
import { defaultOrbit } from "../../utils";

import SolarSystem from "../../main/objects/system";
import { useAtom } from "jotai";
import { systemAtom, vesselPlansAtom } from "../../App";


function handleAddVessel(vesselPlans: IVessel[], setVesselPlans: React.Dispatch<React.SetStateAction<IVessel[]>>, system: SolarSystem, setValue: React.Dispatch<React.SetStateAction<number>>, tabValues: number[], setTabValues: React.Dispatch<React.SetStateAction<number[]>>) {
    return (event: any): void => {
        const newTabValues = [...tabValues];
        let added = false;
        let index = 0;
        for(let i=0; i<newTabValues.length; i++) {
            if(!added && (newTabValues[i] !== i)) {
                newTabValues.splice(i, 0, i);
                added = true;
                index = i;
                break;
            }
        }
        if(!added) {
            index = newTabValues.length
            newTabValues.push(index)
        }
        setTabValues(newTabValues)
        setValue(index);

        const name = "Vessel #" + String(index+1);
        const orbit = defaultOrbit(system);
        const maneuvers = [] as ManeuverComponents[];

        const newVesselPlans = [...vesselPlans];
        newVesselPlans.splice(index, 0, {name, orbit, maneuvers});
        console.log(newVesselPlans, vesselPlans)
        setVesselPlans(newVesselPlans);
    };
}

function handleRemoveVessel(vesselPlans: IVessel[], setVesselPlans: React.Dispatch<React.SetStateAction<IVessel[]>>, value: number, setValue: React.Dispatch<React.SetStateAction<number>>, tabValues: number[], setTabValues: React.Dispatch<React.SetStateAction<number[]>>) {
    return (event: any): void => {
        if(vesselPlans.length > 0) {
            const index = tabValues.find(e => e===value) as number;

            const newTabValues = [...tabValues];
            newTabValues.splice(index, 1);
            setTabValues(newTabValues);

            const newVesselPlans = [...vesselPlans];
            newVesselPlans.splice(index, 1);
            console.log(newVesselPlans, vesselPlans)
            setVesselPlans(newVesselPlans);

            if(value === index && value !== 0) {
                setValue(value - 1)
            }
        }
    };
}

const VesselTabPanel = React.memo(function WrappedVesselTabPanel({value, index}: {value: number, index: number}) {

    useEffect(() => {
        if(value === index) {
            window.dispatchEvent(new Event('resize'));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value])

    return (
        <div style={{ display: (value === index ? 'block' : 'none'), width: "100%", height: "100%" }}>
            <VesselControls idx={index} />
        </div>
    )
});

function VesselTabs() {
    const [system] = useAtom(systemAtom);
    const [vesselPlans, setVesselPlans] = useAtom(vesselPlansAtom);

    const [value, setValue] = useState(0);
    const [tabValues, setTabValues] = useState([] as number[]);
    
    useEffect(() => {
        if(value < 0) {
            setValue(0);
        }
        if(value > vesselPlans.length) {
            setValue(vesselPlans.length - 1);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [vesselPlans])

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
        console.log('Vessel tab '.concat(String(newValue)).concat(' selected.'));
    }

    return (
        <Stack alignItems='center' >
            <Stack spacing={1} sx={{ width: '90%', maxWidth: 600, my: 2, mx: 2 }} >
                <Box textAlign="center" >
                    <Typography variant="h5">Flight Plan Controls</Typography>
                    <Divider />
                </Box>
                <SystemSelect />
                <TimeSettingsControls />
                <Divider />
                <Stack direction="row" spacing={2} textAlign="center" justifyContent="center">
                    <IconButton sx={{border: "1px solid"}} onClick={handleAddVessel(vesselPlans, setVesselPlans, system, setValue, tabValues, setTabValues)}>
                        <AddIcon />
                    </IconButton>
                    <IconButton sx={{border: "1px solid"}} onClick={handleRemoveVessel(vesselPlans, setVesselPlans, value, setValue, tabValues, setTabValues)}>
                        <RemoveIcon />
                    </IconButton>
                </Stack>
                <Tabs value={value} onChange={handleChange} variant="scrollable" scrollButtons={true}>
                    {vesselPlans.map((f, index) => <Tab key={index} value={index} label={f.name} ></Tab>)}
                </Tabs>
                {vesselPlans.map((f, index) => <VesselTabPanel key={index} value={value} index={index} />)}
            </Stack>
        </Stack>
    )
}

export default React.memo(VesselTabs);