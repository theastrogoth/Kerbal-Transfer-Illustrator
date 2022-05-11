import { SolarSystem } from "../../main/objects/system";
import Vessel from "../../main/objects/vessel";

import OrbitControls, { OrbitControlsState } from "../OrbitControls";
import DateControls, { DateControlsState } from "../DateControls";
import TimeSettingsControls from "../TimeSettingsControls";
import ControlsOptions, { ControlsOptionsState } from "../ControlsOptions";

import React from "react";
import Stack from "@mui/material/Stack";
import Box from '@mui/system/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';

type MissionControlsProps = {
    system:                     SolarSystem,
    vessels:                    Vessel[],
    startOrbitControlsState:    OrbitControlsState,
    endOrbitControlsState:      OrbitControlsState,
    dateControlsState:          DateControlsState,
    controlsOptionsState:       ControlsOptionsState,
    copiedOrbit:                IOrbit,
    timeSettings:               TimeSettings,
    setTimeSettings:            React.Dispatch<React.SetStateAction<TimeSettings>>,
}

function MissionControls({system, vessels, startOrbitControlsState, endOrbitControlsState, dateControlsState, controlsOptionsState, copiedOrbit, timeSettings, setTimeSettings}: MissionControlsProps) {
    return (
        <Stack spacing={1} sx={{ my: 2, mx: 2 }}>
            <Box textAlign="center">
                <Typography variant="h5">Mission Controls</Typography>
            </Box>
            <Divider />
            <Typography variant="h6">Orbit Settings</Typography>
            <OrbitControls label='Starting Orbit' system={system} vessels={vessels} state={startOrbitControlsState} copiedOrbit={copiedOrbit} />
            <OrbitControls label='Target Orbit'   system={system} vessels={vessels} state={endOrbitControlsState} copiedOrbit={copiedOrbit} />
            <Divider />
            <Typography variant="h6">Time Settings</Typography>
            <TimeSettingsControls timeSettings={timeSettings} setTimeSettings={setTimeSettings} />
            <DateControls state={dateControlsState} />
            <Divider />
            <Typography variant="h6">Transfer Settings</Typography>
            <ControlsOptions state={controlsOptionsState} />
        </Stack>
    )
}

export default React.memo(MissionControls);