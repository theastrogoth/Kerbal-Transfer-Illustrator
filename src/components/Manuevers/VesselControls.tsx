import React, { useState } from "react";
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

import { PrimitiveAtom, useAtom } from "jotai";
import { copiedFlightPlanAtom, vesselsAtom } from "../../App";
import { flightPlannerVesselOpenAtom, flightPlannerOrbitsOpenAtom, flightPlannerManeuversOpenAtom } from "./VesselTabs";

function VesselControls({idx, vesselAtom, remove}: {idx: number, vesselAtom: PrimitiveAtom<IVessel>, remove: () => void}) {
    const [plan, setPlan] = useAtom(vesselAtom);
    const [vessels] = useAtom(vesselsAtom);
    const [copiedFlightPlan] = useAtom(copiedFlightPlanAtom);

    const [vesselOpen, setVesselOpen] = useAtom(flightPlannerVesselOpenAtom);
    const [orbitOpen, setOrbitOpen] = useAtom(flightPlannerOrbitsOpenAtom);
    const [maneuversOpen, setManeuversOpen] = useAtom(flightPlannerManeuversOpenAtom);
    
    const [color, setColor] = useState(plan.color ? new Color(plan.color).toString() : 'lightgray');
    const [commStrength, setCommStrength] = useState(String((plan.commRange || 0) / 1e6));
    
    const handleVesselIdChange = (event: any): void => {
        const newId = Number(event.target.value)
        if(newId >= 0 && newId < vessels.length) {
            const newPlan = vessels[newId]
            setPlan(newPlan);
            setColor('lightgray');
            setCommStrength(String((newPlan.commRange || 0) / 1e6));
        }
    }

    const setManeuvers = (maneuvers: ManeuverComponents[]) => {
        const newPlan = {...plan};
        newPlan.maneuvers = maneuvers.sort((a,b) => a.date - b.date);
        setPlan(newPlan);
    };

    const handleAddManeuver = () => {
        const date = plan.maneuvers.length > 0 ? plan.maneuvers[plan.maneuvers.length - 1].date : Number(plan.orbit.epoch);
        const newManeuvers = [...plan.maneuvers, defaultManeuverComponents(date)];
        setManeuvers(newManeuvers);
    }

    const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setColor(event.target.value);
        const newPlan = {...plan};
        if(event.target.value !== ''){
            const color = new Color(colorFromString(event.target.value));
            newPlan.color = color.data;
            setPlan(newPlan);
        } else {
            newPlan.color = undefined;
            setPlan(newPlan);
        }
    }

    const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newPlan = {...plan};
        newPlan.name = event.target.value;
        setPlan(newPlan);
    };

    const handleTypeChange = (event: any) => {
        const newPlan = {...plan};
        newPlan.type = event.target.value as VesselType;
        setPlan(newPlan);
    };

    const handleCommChange = (event: any) => {
        setCommStrength(event.target.value);
        const newPlan = {...plan};
        newPlan.commRange = (Number(event.target.value) || 0) * 1e6;
        setPlan(newPlan);
    };

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
                        vesselId={-1}
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
                        label='Comms Range (Mm)'
                        spellCheck={false}
                        value={commStrength}
                        onChange={handleCommChange}
                        error={Number.isNaN(Number(commStrength)) || (Number(commStrength) < 0) }
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
                <OrbitControls label={"Starting Orbit"} vesselAtom={vesselAtom} vesselSelect={false} />
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
                        onClick={remove}
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