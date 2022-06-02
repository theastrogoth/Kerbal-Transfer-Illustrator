import SystemSelect from "../SystemSelect";
import OrbitControls, { OrbitControlsState } from "../OrbitControls";
import DateControls, { DateControlsState } from "./DateControls";
import TimeSettingsControls from "../TimeSettingsControls";
import ControlsOptions, { ControlsOptionsState } from "../ControlsOptions";

import React from "react";
import Stack from "@mui/material/Stack";
import Box from '@mui/system/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';

type MissionControlsProps = {
    startOrbitControlsState:    OrbitControlsState,
    endOrbitControlsState:      OrbitControlsState,
    dateControlsState:          DateControlsState,
    controlsOptionsState:       ControlsOptionsState,
}

function MissionControls({startOrbitControlsState, endOrbitControlsState, dateControlsState, controlsOptionsState}: MissionControlsProps) {
    return (
        <Stack spacing={1} sx={{ my: 2, mx: 2 }}>
            <Box textAlign="center">
                <Typography variant="h5">Mission Controls</Typography>
            </Box>
            <Divider />
            <SystemSelect />
            <Typography variant="h6">Orbit Settings</Typography>
            <OrbitControls label='Starting Orbit' state={startOrbitControlsState} />
            <OrbitControls label='Target Orbit'  state={endOrbitControlsState} />
            <Divider />
            <Typography variant="h6">Time Settings</Typography>
            <TimeSettingsControls />
            <DateControls {...dateControlsState} />
            <Divider />
            <Typography variant="h6">Transfer Settings</Typography>
            <ControlsOptions state={controlsOptionsState} />
        </Stack>
    )
}

export default React.memo(MissionControls);