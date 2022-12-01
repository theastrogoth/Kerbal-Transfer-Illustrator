import React, { useEffect, useRef, useState } from "react";
import Box from "@mui/system/Box"
import Typography from '@mui/material/Typography';
import Stack from "@mui/material/Stack"
import TextField from "@mui/material/TextField";
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Button from "@mui/material/Button";
import AddIcon from '@mui/icons-material/Add';
import ClearIcon from '@mui/icons-material/Clear';
import Divider from "@mui/material/Divider";
import Collapse from "@mui/material/Collapse";
import IconButton from '@mui/material/IconButton';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';

import Color from "../../main/objects/color";

import OrbitControls from "../OrbitControls";
import ManeuverControls from "./ManeuverControls";
import VesselSelect from "../VesselSelect";
import PasteButton from "../PasteButton"
import { defaultManeuverComponents } from "../../utils";

import { radToDeg, colorFromString, hexFromColorString } from "../../main/libs/math";

import { useAtom } from "jotai";
import { copiedFlightPlanAtom, vesselPlansAtom, vesselsAtom } from "../../App";
import { flightPlannerVesselOpenAtom, flightPlannerOrbitsOpenAtom, flightPlannerManeuversOpenAtom } from "./VesselTabs";

function VesselControls({idx, tabValues, setTabValues, setValue}: {idx: number, tabValues: number[], setTabValues: React.Dispatch<React.SetStateAction<number[]>>, setValue: React.Dispatch<React.SetStateAction<number>>}) {
    const [vesselPlans, setVesselPlans] = useAtom(vesselPlansAtom);
    const [vessels] = useAtom(vesselsAtom);
    const [copiedFlightPlan] = useAtom(copiedFlightPlanAtom);

    const [vesselOpen, setVesselOpen] = useAtom(flightPlannerVesselOpenAtom);
    const [orbitOpen, setOrbitOpen] = useAtom(flightPlannerOrbitsOpenAtom);
    const [maneuversOpen, setManeuversOpen] = useAtom(flightPlannerManeuversOpenAtom);

    const planRef = useRef(vesselPlans[idx]);
    const plan = planRef.current;
    const setPlan = (np: IVessel) => {
        const newVesselPlans = [...vesselPlans];
        newVesselPlans[idx] = np;
        setVesselPlans(newVesselPlans);
        planRef.current = np;
    }

    const [color, setColor] = useState(plan.color ? new Color(plan.color).toString() : 'lightgray');
    const [commRange, setCommRange] = useState(String(plan.commRange || 0));

    const [vesselId, setVesselId] = useState(-1);
    
    const handleVesselIdChange = (event: any): void => {
        const newId = Number(event.target.value)
        if(newId >= 0 && newId < vessels.length) {
            setVesselId(newId);
            setPlan(vessels[newId]);
            planRef.current = vessels[newId];
        }
    }

    const setManeuvers = (maneuvers: ManeuverComponents[]) => {
        const newPlan = {...planRef.current};
        newPlan.maneuvers = maneuvers.sort((a,b) => a.date - b.date);
        setPlan(newPlan);
        planRef.current = newPlan;
    };

    const handleAddManeuver = () => {
        const date = plan.maneuvers.length > 0 ? plan.maneuvers[plan.maneuvers.length - 1].date : Number(plan.orbit.epoch);
        const newManeuvers = [...planRef.current.maneuvers, defaultManeuverComponents(date)];
        setManeuvers(newManeuvers);
    }

    const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setColor(event.target.value);
        const newPlan = {...planRef.current};
        if(event.target.value !== ''){
            const color = new Color(colorFromString(event.target.value));
            newPlan.color = color.data;
            setPlan(newPlan);
            planRef.current = newPlan;
        } else {
            newPlan.color = undefined;
            setPlan(newPlan);
            planRef.current = newPlan;
        }
    }

    const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newPlan = {...planRef.current};
        newPlan.name = event.target.value;
        setPlan(newPlan);
        planRef.current = newPlan;
    };

    const handleTypeChange = (event: any) => {
        const newPlan = {...planRef.current};
        newPlan.type = event.target.value as VesselType;
        setPlan(newPlan);
        planRef.current = newPlan;
    };

    const handleCommChange = (event: any) => {
        setCommRange(event.target.value);
        const newPlan = {...planRef.current};
        newPlan.commRange = Number(event.target.value) || 0;
        setPlan(newPlan);
        planRef.current = newPlan;
    };

    const handleRemoveVessel = () => {
        if(vesselPlans.length > 0) {
            const value = tabValues[idx]

            const newTabValues = [...tabValues];
            newTabValues.splice(idx, 1);
            setTabValues(newTabValues);

            const newVesselPlans = [...vesselPlans];
            newVesselPlans.splice(idx, 1);
            setVesselPlans(newVesselPlans);

            if(value === idx && value !== 0) {
                setValue(value - 1)
            }
        }
    };

    useEffect(() => {
        planRef.current = vesselPlans[idx];
    }, [vesselPlans, idx])

    return (
        <Stack spacing={1} sx={{ my: 1 }} >
            <Stack direction="row">
                <Typography variant="h6">{plan.name + " Details"}</Typography>
                <IconButton
                    size="small"
                    onClick={() => setVesselOpen(!vesselOpen)}
                >
                    {vesselOpen ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
                </IconButton>
                <Box component="div" sx={{ flexGrow: 1 }} />
            </Stack>
            <Collapse in={vesselOpen}>
                <Stack spacing={1}>
                    <VesselSelect 
                        vessels={vessels}
                        label={''}
                        vesselId={vesselId}
                        handleVesselIdChange={handleVesselIdChange} 
                    />
                    <TextField
                        id={'name-'+String(idx)}
                        label='Name'
                        spellCheck={false}
                        value={plan.name}
                        onChange={handleNameChange}
                        sx={{ fullWidth: "true" }} 
                    />
                    <TextField
                        id={'color-'+String(idx)}
                        label='Color'
                        spellCheck={false}
                        value={color}
                        onChange={handleColorChange}
                        sx={{ fullWidth: "true" }} 
                        // @ts-ignore
                        inputProps={{ style: {color: color !== '' ? hexFromColorString(color) : 'primary'} }}
                    />    
                    <TextField
                        id={'comm-'+String(idx)}
                        label='Comms Range (m)'
                        spellCheck={false}
                        value={commRange}
                        onChange={handleCommChange}
                        error={Number.isNaN(Number(commRange)) || (Number(commRange) < 0) }
                        sx={{ fullWidth: "true" }} 
                    />    
                    <FormControl>
                        <InputLabel id={"type-select-label-"+String(idx)}>Craft Type</InputLabel>
                        <Select 
                            labelId={"type-select-label-"+String(idx)}
                            label='Craft Type'
                            value={plan.type || ''}
                            onChange={handleTypeChange}
                        >
                            <MenuItem value={"Ship"}>{"Ship"}</MenuItem>
                            <MenuItem value={"Probe"}>{"Probe"}</MenuItem>
                            <MenuItem value={"Relay"}>{"Relay"}</MenuItem>
                            <MenuItem value={"Plane"}>{"Plane"}</MenuItem>
                            <MenuItem value={"Lander"}>{"Lander"}</MenuItem>
                            <MenuItem value={"Station"}>{"Station"}</MenuItem>
                            <MenuItem value={"Base"}>{"Base"}</MenuItem>
                            <MenuItem value={"Rover"}>{"Rover"}</MenuItem>
                            <MenuItem value={"Debris"}>{"Debris"}</MenuItem>
                            <MenuItem value={"SpaceObject"}>{"Space Object"}</MenuItem>
                            <MenuItem value={"Eva"}>{"EVA"}</MenuItem>
                        </Select>
                    </FormControl>  
                </Stack>
            </Collapse>
            <Divider />
            <Stack direction="row">
                <Typography variant="h6">Starting Orbit</Typography>
                <IconButton
                    size="small"
                    onClick={() => setOrbitOpen(!orbitOpen)}
                >
                    {orbitOpen ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
                </IconButton>
                <Box component="div" sx={{ flexGrow: 1 }} />
            </Stack>
            <Collapse in={orbitOpen}>
                <OrbitControls label={"Starting Orbit"} vessel={plan} setVessel={setPlan} vesselSelect={false} />
            </Collapse>
            <Divider />
            <Stack direction="row">
                <Typography variant="h6">Maneuvers</Typography>
                <IconButton
                    size="small"
                    onClick={() => setManeuversOpen(!maneuversOpen)}
                >
                    {maneuversOpen ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
                </IconButton>
                <Box component="div" sx={{ flexGrow: 1 }} />
            </Stack>
            <Collapse in={maneuversOpen}>
                <Stack spacing={2} >
                    { plan.maneuvers.map( (m, idx) => <ManeuverControls key={idx} idx={idx} maneuvers={plan.maneuvers} setManeuvers={setManeuvers} /> ) }
                </Stack>
                <Stack direction="row" spacing={2} textAlign="center" justifyContent="center">
                    <Button 
                        onClick={handleAddManeuver}
                        startIcon={<AddIcon />}
                    >
                        Add Maneuver
                    </Button>
                </Stack>
            </Collapse>
            <Divider />
            <Stack direction="column" spacing={2} justifyContent="center" alignItems="center" >
                <Box component="div" display="flex" justifyContent="center" alignItems="center">
                    <PasteButton 
                        setObj={(p: IVessel) => {
                            const degOrbit = {
                                ...p.orbit,
                                inclination:        radToDeg(p.orbit.inclination),
                                argOfPeriapsis:     radToDeg(p.orbit.argOfPeriapsis),
                                ascNodeLongitude:   radToDeg(p.orbit.ascNodeLongitude),
                            };
                            const newPlan = {...p, orbit: degOrbit};
                            setPlan(newPlan);
                            planRef.current = newPlan;
                        }} 
                        copiedObj={copiedFlightPlan} 
                        variant="text"
                        label="Paste Flight Plan"
                    />
                </Box>
                <Box component="div" display="flex" justifyContent="center" alignItems="center">
                    <Button 
                        variant="text"
                        color="inherit"
                        onClick={handleRemoveVessel}
                        startIcon={<ClearIcon />}
                    >
                        Delete Flight Plan
                    </Button>
                </Box>
            </Stack>

        </Stack>
    )
}

export default React.memo(VesselControls);