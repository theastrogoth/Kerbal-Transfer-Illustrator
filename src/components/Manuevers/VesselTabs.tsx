import React, { useState, useEffect } from "react";
import Box from '@mui/system/Box';
// import Tab from "@mui/material/Tab"
// import Tabs from "@mui/material/Tabs";
import Stack from "@mui/material/Stack"
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Button from "@mui/material/Button";
import AddIcon from '@mui/icons-material/Add';
import ClearIcon from '@mui/icons-material/Clear';
import FormControl from '@mui/material/FormControl';
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Collapse from "@mui/material/Collapse";
import IconButton from '@mui/material/IconButton';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';

import VesselControls from "./VesselControls";
import SystemSelect from "../SystemSelect";
import TimeSettingsControls from "../TimeSettingsControls";
import CommsControls from "../CommsControls";
import { defaultOrbit } from "../../utils";

import { atom, useAtom } from "jotai";
import { landedVesselPlansAtom, landedVesselsAtom, systemAtom, vesselPlansAtom, vesselsAtom } from "../../App";


export const flightPlannerVesselOpenAtom = atom<boolean>(true);
export const flightPlannerOrbitsOpenAtom = atom<boolean>(true);
export const flightPlannerManeuversOpenAtom = atom<boolean>(true);


function createPlanItems(vesselPlans: IVessel[]) {
    const options = vesselPlans.map((p,i) => <MenuItem key={i} value={i}>{p.name}</MenuItem> )
    return options;
}

const VesselTabPanel = React.memo(function WrappedVesselTabPanel({value, index, tabValue, tabValues, setTabValue, setTabValues, setValue}: {value: number, index: number, tabValue: number, tabValues: number[], setTabValue: React.Dispatch<React.SetStateAction<number>>, setTabValues: React.Dispatch<React.SetStateAction<number[]>>, setValue: React.Dispatch<React.SetStateAction<number>>}) {
    useEffect(() => {
        if(value === index) {
            window.dispatchEvent(new Event('resize'));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value])

    return (
        <div style={{ display: (value === index ? 'block' : 'none'), width: "100%", height: "100%" }}>
            <VesselControls idx={index} value={value} tabValue={tabValue} tabValues={tabValues} setTabValue={setTabValue} setTabValues={setTabValues} setValue={setValue} />
        </div>
    )
});

function VesselTabs() {
    const [system] = useAtom(systemAtom);
    const [vesselPlans, setVesselPlans] = useAtom(vesselPlansAtom);
    const [, setLandedVesselPlans] = useAtom(landedVesselPlansAtom)
    const [vessels] = useAtom(vesselsAtom);
    const [landedVessels] = useAtom(landedVesselsAtom);

    const [value, setValue] = useState(0);
    const [tabValue, setTabValue] = useState(0);
    const [tabValues, setTabValues] = useState(vesselPlans.map((p,i) => i));
    const [planOpts, setPlanOpts] = useState(createPlanItems(vesselPlans));

    const [timeOpen, setTimeOpen] = useState(true);
    const [commsOpen, setCommsOpen] = useState(false);
    
    useEffect(() => {
        if(value < 0) {
            setValue(0);
            setTabValue(0);
        }
        if(value > vesselPlans.length) {
            setValue(vesselPlans.length - 1);
            setTabValue(vesselPlans.length - 1);
        }
        setPlanOpts(createPlanItems(vesselPlans));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [vesselPlans])

    // const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    //     setValue(newValue);
    //     console.log('Vessel tab '.concat(String(newValue)).concat(' selected.'));
    // }

    const handleAddVessel = () => {
        const newTabValues = [...tabValues];
        let index = 0;
        for(let i=0; i<=newTabValues.length; i++) {
            if(newTabValues[i] !== i) {
                newTabValues.splice(i, 0, i);
                index = i;
                break;
            }
        }
        setTabValues(newTabValues)
        setValue(index);
        setTabValue(index);

        const name = "Craft #" + String(index+1);
        const type = "Ship";
        const orbit = defaultOrbit(system);
        const maneuvers = [] as ManeuverComponents[];
        const commRange = 5000;

        const newVesselPlans = [...vesselPlans];
        newVesselPlans.splice(index, 0, {name, type, orbit, maneuvers, commRange});
        setVesselPlans(newVesselPlans);
    };

    const handleClear = () => {
        const newVesselPlans: IVessel[] = [];
        const newLandedVesselPlans: LandedVessel[] = [];
        setValue(0);
        setTabValues([]);
        setVesselPlans(newVesselPlans);
        setLandedVesselPlans(newLandedVesselPlans);
    }

    // const handleAddSavedVessels = () => {
    //     const newVesselPlans = vessels.filter( x => x.type !== "SpaceObject" && x.type !== "Debris");
    //     setValue(0);
    //     setTabValues(newVesselPlans.map((p,i) => i));
    //     setVesselPlans(newVesselPlans);
    // }

    const handleAddSavedRelays = () => {
        const newVesselPlans = vessels.filter( x => x.type === "Relay");
        setValue(0);
        setTabValues(newVesselPlans.map((p,i) => i));
        setVesselPlans(newVesselPlans);  
    }

    const handleAddSavedObjects = () => {
        const newVesselPlans = vessels.filter( x => x.type === "SpaceObject");
        setValue(0);
        setTabValues(newVesselPlans.map((p,i) => i));
        setVesselPlans(newVesselPlans);
    }

    const handleAddSavedLandedVessels = () => {
        const newLandedVesselPlans = [...landedVessels];
        setLandedVesselPlans(newLandedVesselPlans);
    }

    // console.log(value, tabValue, tabValues, vesselPlans)

    return (
        <Stack alignItems='center' >
            <Stack spacing={1} sx={{ width: '90%', maxWidth: 600, my: 2, mx: 2 }} >
                <SystemSelect />
                <Stack direction="row">
                    <Typography variant="h6">Time Settings</Typography>
                    <IconButton
                        size="small"
                        onClick={() => setTimeOpen(!timeOpen)}
                    >
                        {timeOpen ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
                    </IconButton>
                    <Box component="div" sx={{ flexGrow: 1 }} />
                </Stack>
                <Collapse in={timeOpen}>
                    <TimeSettingsControls />
                </Collapse>
                <Divider />
                <Stack direction="row">
                    <Typography variant="h6">CommNet Settings</Typography>
                    <IconButton
                        size="small"
                        onClick={() => setCommsOpen(!commsOpen)}
                    >
                        {commsOpen ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
                    </IconButton>
                    <Box component="div" sx={{ flexGrow: 1 }} />
                </Stack>
                <Collapse in={commsOpen}>
                    <CommsControls showStrength={false}/>
                </Collapse>
                <Divider />
                <Box component="div" textAlign="center" >
                    <Typography variant="h5">Flight Plan Controls</Typography>
                </Box>
                <Stack direction="row" spacing={2} textAlign="center" justifyContent="center">
                    <Button 
                        onClick={handleAddVessel}
                        startIcon={<AddIcon />}
                    >
                        Add New Flight Plan
                    </Button>
                    <Button 
                        onClick={handleClear}
                        startIcon={<ClearIcon />}
                    >
                        Clear All
                    </Button>
                    {/* <Button sx={{border: "1px solid"}} onClick={handleRemoveVessel(vesselPlans, setVesselPlans, value, setValue, tabValues, setTabValues)}>
                        <RemoveIcon />
                    </Button> */}
                </Stack>
                { vessels.length > 0 &&
                    <Stack direction="row" spacing={2} textAlign="center" justifyContent="center">
                        {/* <Button
                            onClick={handleAddSavedVessels}
                            startIcon={<AddIcon />}
                        >
                            Load All Crafts
                        </Button> */}
                        <Button
                            onClick={handleAddSavedRelays}
                            startIcon={<AddIcon />}
                        >
                            Load All Relays
                        </Button>
                        <Button
                            onClick={handleAddSavedObjects}
                            startIcon={<AddIcon />}
                        >
                            Load All Space Objects
                        </Button>
                        <Button
                            onClick={handleAddSavedLandedVessels}
                            startIcon={<AddIcon />}
                        >
                            Show All Landed Crafts
                        </Button>
                    </Stack>
                    }
                <FormControl sx={{ minWidth: 120 }}>
                    <InputLabel id={"plan-select-label"}>Select Flight Plan</InputLabel>
                    <Select
                        labelId={"plan-select-label"}
                        label='Select Flight Plan'
                        id={'plan-select'}
                        value={planOpts.length > 0 ? value : ''}
                        onChange={(event) => { setValue(Number(event.target.value)); setTabValue(tabValues[Number(event.target.value)]); }}
                    >
                        {planOpts}
                    </Select>
                </FormControl>
                <Divider />
                {/* <Tabs value={value} onChange={handleChange} variant="scrollable" scrollButtons={true}>
                    {vesselPlans.map((f, index) => <Tab key={index} value={index} label={f.name} ></Tab>)}
                </Tabs> */}
                {vesselPlans.map((f, index) => <VesselTabPanel key={index} value={value} index={index} tabValue={tabValue} tabValues={tabValues} setTabValue={setTabValue} setTabValues={setTabValues} setValue={setValue} />)}
            </Stack>
        </Stack>
    )
}

export default React.memo(VesselTabs);