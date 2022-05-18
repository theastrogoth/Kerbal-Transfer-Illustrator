// import { SolarSystem } from "../../main/objects/system";
// import Vessel from "../../main/objects/vessel";

import { Stack, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import SolarSystem from "../../main/objects/system";
import Vessel from "../../main/objects/vessel";
import { orbitFromControlsState, useOrbitControls } from "../../utils";
import OrbitControls from "../OrbitControls";
import ManeuverControls from "./ManeuverControls";

// import OrbitControls, { OrbitControlsState } from "../OrbitControls";
// import DateControls, { DateControlsState } from "./DateControls";
// import TimeSettingsControls from "../TimeSettingsControls";
// import ControlsOptions, { ControlsOptionsState } from "../ControlsOptions";

// import React from "react";
// import Stack from "@mui/material/Stack";
// import Box from '@mui/system/Box';
// import Typography from '@mui/material/Typography';
// import Divider from '@mui/material/Divider';

// type MissionControlsProps = {
//     system:                     SolarSystem,
//     vessels:                    Vessel[],
//     startOrbitControlsState:    OrbitControlsState,
//     endOrbitControlsState:      OrbitControlsState,
//     dateControlsState:          DateControlsState,
//     controlsOptionsState:       ControlsOptionsState,
//     copiedOrbit:                IOrbit,
//     timeSettings:               TimeSettings,
//     setTimeSettings:            React.Dispatch<React.SetStateAction<TimeSettings>>,
// }

// function MissionControls({system, vessels, startOrbitControlsState, endOrbitControlsState, dateControlsState, controlsOptionsState, copiedOrbit, timeSettings, setTimeSettings}: MissionControlsProps) {
//     return (
//         <Stack spacing={1} sx={{ my: 2, mx: 2 }}>
//             <Box textAlign="center">
//                 <Typography variant="h5">Mission Controls</Typography>
//             </Box>
//             <Divider />
//             <Typography variant="h6">Orbit Settings</Typography>
//             <OrbitControls label='Starting Orbit' system={system} vessels={vessels} state={startOrbitControlsState} copiedOrbit={copiedOrbit} />
//             <OrbitControls label='Target Orbit'   system={system} vessels={vessels} state={endOrbitControlsState} copiedOrbit={copiedOrbit} />
//             <Divider />
//             <Typography variant="h6">Time Settings</Typography>
//             <TimeSettingsControls timeSettings={timeSettings} setTimeSettings={setTimeSettings} />
//             <DateControls {...dateControlsState} />
//             <Divider />
//             <Typography variant="h6">Transfer Settings</Typography>
//             <ControlsOptions state={controlsOptionsState} />
//         </Stack>
//     )
// }

// export default React.memo(MissionControls);

type VesselControlsState = {
    system:             SolarSystem, 
    vessels:            Vessel[], 
    idx:                number, 
    flightPlans:        IVessel[], 
    setFlightPlans:     React.Dispatch<React.SetStateAction<IVessel[]>>,
    copiedOrbit:        IOrbit,
    copiedManeuver:     ManeuverComponents,
    copiedFlightPlan:   FlightPlan,
    timeSettings:       TimeSettings,
}

function VesselControls({system, vessels, idx, flightPlans, setFlightPlans, copiedOrbit, copiedManeuver, copiedFlightPlan, timeSettings}: VesselControlsState) {
    const [name, setName] = useState('Vessel #' + String(idx));
    const orbitControls = useOrbitControls(system, 1);
    const [maneuvers, setManeuvers] = useState([] as ManeuverComponents[]);

    useEffect(() => {
        const newFlightPlans = [...flightPlans];
        const newPlan: IVessel = {
            name,
            orbit: orbitFromControlsState(system, orbitControls),
            maneuvers,
        };
        newFlightPlans[idx] = newPlan;
        setFlightPlans(newFlightPlans);
    }, [name, orbitControls, maneuvers])

    return (
        <Stack spacing={1.5} >
            <TextField
                id={'name-'+String(idx)}
                label='Name'
                value={name}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => setName(event.target.value)}
                sx={{ fullWidth: "true" }} />      
            <OrbitControls label={"Starting Orbit"} system={system} vessels={vessels} copiedOrbit={copiedOrbit} state={orbitControls} />
            { maneuvers.map( (m, idx) => <ManeuverControls idx={idx} defaultUT={Math.max(Number(orbitControls.epoch), maneuvers.slice(-1)[0].date)} maneuvers={maneuvers} setManeuvers={setManeuvers} copiedManeuver={copiedManeuver} timeSettings={timeSettings} /> ) }
        </Stack>
    )

}