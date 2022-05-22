// import { SolarSystem } from "../../main/objects/system";
// import Vessel from "../../main/objects/vessel";

import React, { useEffect, useState } from "react";
import Box from '@mui/system/Box';
import Typography from '@mui/material/Typography';
import Stack from "@mui/material/Stack"
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';

import OrbitControls, { OrbitControlsState } from "../OrbitControls";
import ManeuverControls from "./ManeuverControls";

import SolarSystem from "../../main/objects/system";
import Orbit from "../../main/objects/orbit";
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
    copiedFlightPlan:   IVessel,
    timeSettings:       TimeSettings,
}

function VesselControls({system, vessels, idx, vesselPlans, setVesselPlans, copiedOrbit, copiedManeuver, copiedFlightPlan, timeSettings}: VesselControlsState) {
    const [vesselId, setVesselId] = useState(-1);
    const [orbit, setOrbit] = useState(vesselPlans[idx].orbit as OrbitalElements);
    const [plan, setPlan] = useState({name: vesselPlans[idx].name, orbit: vesselPlans[idx].orbit, maneuvers: vesselPlans[idx].maneuvers} as IVessel);

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
            setPlan(vessel);
            setOrbit(vessel.orbit);
        }
    }

    const handleAddManeuver = (event: any): void => {
        const date = plan.maneuvers.length > 0 ? plan.maneuvers[plan.maneuvers.length - 1].date : Number(orbit.epoch);
        const newManeuvers = [...plan.maneuvers, defaultManeuverComponents(date)];
        const newPlan: IVessel = {
            name:       plan.name,
            orbit:      plan.orbit,
            maneuvers:  newManeuvers,
        }
        setPlan(newPlan);
    }

    const handleRemoveManeuver = (event: any): void => {
        const newManeuvers = [...plan.maneuvers];
        newManeuvers.pop();
        const newPlan: IVessel = {
            name:       plan.name,
            orbit:      plan.orbit,
            maneuvers:  newManeuvers,
        };
        setPlan(newPlan);
    }

    const setName = (name: string) => {
        const newPlan: IVessel = {
            name,
            orbit:      plan.orbit,
            maneuvers:  plan.maneuvers,
        };
        setPlan(newPlan);
    };

    const setManeuvers = (maneuvers: ManeuverComponents[]) => {
        const newPlan: IVessel = {
            name:       plan.name,
            orbit:      plan.orbit,
            maneuvers,
        }
        setPlan(newPlan);
    };

    useEffect(() => {
        const orb = Kepler.orbitFromElements(orbit, system.bodyFromId(orbit.orbiting));
        let equal = true;
        const keys = Object.keys(orb)
        for(let i=0; i<keys.length; i++) {
            //@ts-ignore
            if(plan.orbit[keys[i]] !== orb[keys[i]]){
                equal = false;
                break;
            }
        }
        if(!equal) {
            const newPlan: IVessel = {
                name:       plan.name,
                orbit:      orb,
                maneuvers:  plan.maneuvers,
            };
            setPlan(newPlan);
        }
    }, [orbit])

    useEffect(() => {
        // console.log(plan)
        const newVesselPlans = [...vesselPlans];
        newVesselPlans[idx] = plan;
        setVesselPlans(newVesselPlans);
    }, [plan]);

    useEffect(() => {
        const vesselPlan = vesselPlans[idx];
        setPlan(vesselPlan);
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
                value={plan.name}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => setName(event.target.value)}
                sx={{ fullWidth: "true" }} />      
            <OrbitControls label={"Starting Orbit"} system={system} vessels={vessels} copiedOrbit={copiedOrbit} state={orbitControls} vesselSelect={false} />
            <Typography variant="body1">{"Maneuvers"} </Typography>
            <Stack spacing={2} >
                { plan.maneuvers.map( (m, idx) => <ManeuverControls key={idx} idx={idx} maneuvers={plan.maneuvers} setManeuvers={setManeuvers} copiedManeuver={copiedManeuver} timeSettings={timeSettings} /> ) }
            </Stack>
            <Stack direction="row" spacing={2} textAlign="center" justifyContent="center">
                <IconButton sx={{border: "1px solid"}} size="small" onClick={handleAddManeuver}>
                    <AddIcon />
                </IconButton>
                <IconButton sx={{border: "1px solid"}} size="small" onClick={handleRemoveManeuver}>
                    <RemoveIcon />
                </IconButton>
            </Stack>
        </Stack>
    )
}

export default React.memo(VesselControls);