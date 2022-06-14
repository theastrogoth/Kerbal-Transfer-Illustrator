import React, { useEffect, useRef, useState } from "react";
import Box from "@mui/system/Box"
import Typography from '@mui/material/Typography';
import Stack from "@mui/material/Stack"
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import AddIcon from '@mui/icons-material/Add';
import ClearIcon from '@mui/icons-material/Clear';
import Divider from "@mui/material/Divider";

import Kepler from "../../main/libs/kepler";
import Color from "../../main/objects/color";

import OrbitControls from "../OrbitControls";
import ManeuverControls from "./ManeuverControls";
import VesselSelect from "../VesselSelect";
import PasteButton from "../PasteButton"
import { defaultManeuverComponents, orbitFromElementsAndSystem } from "../../utils";

import { radToDeg, colorFromString, hexFromColorString } from "../../main/libs/math";

import { atom, useAtom } from "jotai";
import { copiedFlightPlanAtom, systemAtom, vesselPlansAtom, vesselsAtom } from "../../App";

function VesselControls({idx, tabValues, setTabValues, setValue}: {idx: number, tabValues: number[], setTabValues: React.Dispatch<React.SetStateAction<number[]>>, setValue: React.Dispatch<React.SetStateAction<number>>}) {
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
    const [color, setColor] = useState(plan.color ? new Color(plan.color).toString() : 'rgb(200,200,200)');

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

    const setManeuvers = (maneuvers: ManeuverComponents[]) => {
        const newPlan: IVessel = {
            name:       plan.name,
            color:      plan.color,
            orbit:      plan.orbit,
            maneuvers:  maneuvers.sort((a,b) => a.date - b.date),
        }
        setPlan(newPlan);
    };

    const handleAddManeuver = () => {
        const date = plan.maneuvers.length > 0 ? plan.maneuvers[plan.maneuvers.length - 1].date : Number(orbit.epoch);
        const newManeuvers = [...plan.maneuvers, defaultManeuverComponents(date)];
        setManeuvers(newManeuvers);
    }

    const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setColor(event.target.value);
        if(event.target.value !== ''){
            const color = new Color(colorFromString(event.target.value));
            const newPlan: IVessel = {
                name:       plan.name,
                color:      color.data,
                orbit:      plan.orbit,
                maneuvers:  plan.maneuvers,
            }
            setPlan(newPlan);
        } else {
            const newPlan: IVessel = {
                name:       plan.name,
                color:      undefined,
                orbit:      plan.orbit,
                maneuvers:  plan.maneuvers,
            }
            setPlan(newPlan);
        }
    }

    const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newPlan: IVessel = {
            name:       event.target.value,
            color:      plan.color,
            orbit:      plan.orbit,
            maneuvers:  plan.maneuvers,
        };
        setPlan(newPlan);
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
            setOrbit(plan.orbit);
            orbitRef.current = plan.orbit;
        } else if(!Kepler.orbitalElementsAreEqual(orbit, orbitRef.current)) {
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
            <Divider />
            <OrbitControls label={"Starting Orbit"} orbitAtom={orbitAtom} vesselSelect={false} />
            <Divider />
            <Typography variant="body1">{"Maneuvers"} </Typography>
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
            <Divider />
            <Stack direction="column" spacing={2} justifyContent="center" alignItems="center" >
                <Box display="flex" justifyContent="center" alignItems="center">
                    <PasteButton 
                        setObj={setPlan} 
                        copiedObj={copiedFlightPlan} 
                        variant="text"
                        label="Paste Flight Plan"
                    />
                </Box>
                <Box display="flex" justifyContent="center" alignItems="center">
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