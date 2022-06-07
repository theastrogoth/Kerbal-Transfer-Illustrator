import React, { useEffect, useRef, useState } from "react";
import Box from "@mui/system/Box"
import Typography from '@mui/material/Typography';
import Stack from "@mui/material/Stack"
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';

import OrbitControls from "../OrbitControls";
import ManeuverControls from "./ManeuverControls";
import VesselSelect from "../VesselSelect";
import PasteButton from "../PasteButton"
import { defaultManeuverComponents, orbitFromElementsAndSystem } from "../../utils";

import { radToDeg } from "../../main/libs/math";

import { atom, useAtom } from "jotai";
import { copiedFlightPlanAtom, systemAtom, vesselPlansAtom, vesselsAtom } from "../../App";


export type VesselControlsState = {
    idx:                number, 
}

function VesselControls({idx}: {idx: number}) {
    const [system] = useAtom(systemAtom);
    const [vesselPlans, setVesselPlans] = useAtom(vesselPlansAtom);
    const [vessels] = useAtom(vesselsAtom);
    const [copiedFlightPlan] = useAtom(copiedFlightPlanAtom);

    const vesselIdAtom = useRef(atom(-1)).current;
    const orbitAtom = useRef(atom({
        semiMajorAxis:      vesselPlans[idx].orbit.semiMajorAxis,
        eccentricity:       vesselPlans[idx].orbit.eccentricity,
        inclination:        radToDeg(vesselPlans[idx].orbit.inclination),
        argOfPeriapsis:     radToDeg(vesselPlans[idx].orbit.argOfPeriapsis),
        ascNodeLongitude:   radToDeg(vesselPlans[idx].orbit.ascNodeLongitude),
        meanAnomalyEpoch:   vesselPlans[idx].orbit.meanAnomalyEpoch,
        epoch:              vesselPlans[idx].orbit.epoch,
        orbiting:           vesselPlans[idx].orbit.orbiting,
    } as OrbitalElements)).current;

    const [plan, setPlan] = useState({name: vesselPlans[idx].name, orbit: vesselPlans[idx].orbit, maneuvers: vesselPlans[idx].maneuvers} as IVessel);

    const [orbit, setOrbit] = useAtom(orbitAtom);
    const [vesselId, setVesselId] = useAtom(vesselIdAtom);

    const orbitRef = useRef(orbit);
    const planRef = useRef(plan);
    const vesselPlansRef = useRef(vesselPlans);
    
    const wasSetFromOrbit = useRef(false);

    const handleVesselIdChange = (event: any): void => {
        const newId = Number(event.target.value)
        if(newId >= 0 && newId < vessels.length) {
            setVesselId(newId);
            setPlan(vessels[newId]);
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
        if(vesselPlans.length !== vesselPlansRef.current.length) {
            vesselPlansRef.current = vesselPlans;
            const vesselPlan = vesselPlans[idx];
            setPlan(vesselPlan);
            setVesselId(-1);
        } else if(plan !== planRef.current) {
            planRef.current = plan;
            const newVesselPlans = [...vesselPlans];
            newVesselPlans[idx] = plan;
            setVesselPlans(newVesselPlans);
            if(!wasSetFromOrbit.current) {
                setOrbit(plan.orbit);
                orbitRef.current = plan.orbit;
            } else {
                wasSetFromOrbit.current = false;
            }
        } else if(orbit !== orbitRef.current) {
            orbitRef.current = orbit;
            wasSetFromOrbit.current = true;
            const orb = orbitFromElementsAndSystem(system, orbit);
            const newPlan: IVessel = {
                name:       plan.name,
                orbit:      orb,
                maneuvers:  plan.maneuvers,
            };
            setPlan(newPlan);
            setVesselId(-1);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orbit, plan, vesselPlans, idx])

    return (
        <Stack spacing={1} sx={{ my: 2 }} >
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
            <OrbitControls label={"Starting Orbit"} orbitAtom={orbitAtom} vesselSelect={false} />
            <Typography variant="body1">{"Maneuvers"} </Typography>
            <Stack spacing={2} >
                { plan.maneuvers.map( (m, idx) => <ManeuverControls key={idx} idx={idx} maneuvers={plan.maneuvers} setManeuvers={setManeuvers} /> ) }
            </Stack>
            <Stack direction="row" spacing={2} textAlign="center" justifyContent="center">
                <IconButton sx={{border: "1px solid"}} size="small" onClick={handleAddManeuver}>
                    <AddIcon />
                </IconButton>
                <IconButton sx={{border: "1px solid"}} size="small" onClick={handleRemoveManeuver}>
                    <RemoveIcon />
                </IconButton>
            </Stack>
            <Box></Box>
            <Box></Box>
            <Box display="flex" justifyContent="center" alignItems="center" >
                <Typography variant="body1" sx={{fontWeight: 600}}>
                        Paste Flight Plan
                </Typography>
                <PasteButton setObj={setPlan} copiedObj={copiedFlightPlan} />
            </Box>
        </Stack>
    )
}

export default React.memo(VesselControls);