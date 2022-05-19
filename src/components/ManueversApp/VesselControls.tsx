// import { SolarSystem } from "../../main/objects/system";
// import Vessel from "../../main/objects/vessel";

import React, { useEffect, useState } from "react";
import Box from '@mui/system/Box';
import Typography from '@mui/material/Typography';
import Stack from "@mui/material/Stack"
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';

import OrbitControls, { OrbitControlsState, setOrbitState } from "../OrbitControls";
import ManeuverControls from "./ManeuverControls";

import SolarSystem from "../../main/objects/system";
import Vessel from "../../main/objects/vessel";
import { defaultManeuverComponents, defaultOrbit, orbitFromControlsState, useOrbitControls } from "../../utils";
import VesselSelect from "../VesselSelect";
import Kepler from "../../main/libs/kepler";

export type VesselControlsState = {
    system:             SolarSystem, 
    vessels:            Vessel[], 
    idx:                number, 
    vesselPlans:        IVessel[], 
    setVesselPlans:     React.Dispatch<React.SetStateAction<IVessel[]>>,
    copiedOrbit:        IOrbit,
    copiedManeuver:     ManeuverComponents,
    copiedFlightPlan:   FlightPlan,
    timeSettings:       TimeSettings,
}

function VesselControls({system, vessels, idx, vesselPlans, setVesselPlans, copiedOrbit, copiedManeuver, copiedFlightPlan, timeSettings}: VesselControlsState) {
    const [name, setName] = useState(vesselPlans[idx].name);
    const [orbit, setOrbit] = useState(vesselPlans[idx].orbit as OrbitalElements);
    const [vesselId, setVesselId] = useState(-1);
    const [maneuvers, setManeuvers] = useState(vesselPlans[idx].maneuvers);

    const orbitControls: OrbitControlsState = {
        orbit,
        setOrbit,
        vesselId,
        setVesselId,
    }

    const handleVesselIdChange = (event: any): void => {
        const newId = Number(event.target.value)
        if(newId >= 0 && newId < vessels.length) {
            setVesselId(newId);
            const vessel = vessels[newId];
            setName(vessel.name);
            setManeuvers(vessel.maneuvers);
            setOrbit(vessel.orbit);
        }
    }

    const handleAddManeuver = (event: any): void => {
        const date = maneuvers.length > 0 ? maneuvers[maneuvers.length - 1].date : 0;
        const newManeuvers = [...maneuvers, defaultManeuverComponents(date)];
        setManeuvers(newManeuvers);
    }

    const handleRemoveManeuver = (event: any): void => {
        const newManeuvers = [...maneuvers];
        newManeuvers.pop();
        setManeuvers(newManeuvers);
    }

    useEffect(() => {
        const newVesselPlans = [...vesselPlans];
        const newPlan: IVessel = {
            name,
            orbit: orbitFromControlsState(system, orbitControls),
            maneuvers,
        };
        newVesselPlans[idx] = newPlan;
        setVesselPlans(newVesselPlans);
    }, [name, maneuvers, orbit]);

    useEffect(() => {
        const vesselPlan = vesselPlans[idx];
        setName(vesselPlan.name);
        setManeuvers(vesselPlan.maneuvers);
        setOrbit(vesselPlan.orbit);
        setVesselId(-1);
    }, [vesselPlans.length]);

    return (
        <Stack spacing={1} sx={{ my: 2 }} >
            {/* <Box textAlign="center">
               <Typography variant="h6">{"Flight Plan"} </Typography>
             </Box> */}
             <VesselSelect 
                vessels={vessels}
                label={''}
                vesselId={vesselId}
                handleVesselIdChange={handleVesselIdChange} />
            <TextField
                id={'name-'+String(idx)}
                label='Name'
                value={name}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => setName(event.target.value)}
                sx={{ fullWidth: "true" }} />      
            <OrbitControls label={"Starting Orbit"} system={system} vessels={vessels} copiedOrbit={copiedOrbit} state={orbitControls} vesselSelect={false} />
            <Typography variant="body1">{"Maneuvers"} </Typography>
            <Stack spacing={2} >
                { maneuvers.map( (m, idx) => <ManeuverControls idx={idx} maneuvers={maneuvers} setManeuvers={setManeuvers} copiedManeuver={copiedManeuver} timeSettings={timeSettings} /> ) }
            </Stack>
            <Stack direction="row" spacing={2} textAlign="center" justifyContent="center">
                <Button variant="outlined" onClick={handleAddManeuver}>
                    <AddIcon />
                </Button>
                <Button variant="outlined" onClick={handleRemoveManeuver}>
                    <RemoveIcon />
                </Button>
            </Stack>
        </Stack>
    )
}

export default VesselControls;