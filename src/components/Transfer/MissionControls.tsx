import SolarSystem from "../../main/objects/system";
import Vessel from "../../main/objects/vessel";

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
    systemOptions:              Map<string, SolarSystem>,
    system:                     SolarSystem,
    setSystem:                  React.Dispatch<React.SetStateAction<SolarSystem>>,
    systemName:                 string,
    setSystemName:              React.Dispatch<React.SetStateAction<string>>,
    vessels:                    Vessel[],
    startOrbitControlsState:    OrbitControlsState,
    endOrbitControlsState:      OrbitControlsState,
    dateControlsState:          DateControlsState,
    controlsOptionsState:       ControlsOptionsState,
    copiedOrbit:                IOrbit,
    timeSettings:               TimeSettings,
    setTimeSettings:            React.Dispatch<React.SetStateAction<TimeSettings>>,
}

function MissionControls({systemOptions, system, setSystem, systemName, setSystemName, vessels, startOrbitControlsState, endOrbitControlsState, dateControlsState, controlsOptionsState, copiedOrbit, timeSettings, setTimeSettings}: MissionControlsProps) {
    return (
        <Stack spacing={1} sx={{ my: 2, mx: 2 }}>
            <Box textAlign="center">
                <Typography variant="h5">Mission Controls</Typography>
            </Box>
            <Divider />
            <SystemSelect systemOptions={systemOptions} systemName={systemName} setSystemName={setSystemName} setSystem={setSystem} />
            <Typography variant="h6">Orbit Settings</Typography>
            <OrbitControls label='Starting Orbit' system={system} vessels={vessels} state={startOrbitControlsState} copiedOrbit={copiedOrbit} />
            <OrbitControls label='Target Orbit'   system={system} vessels={vessels} state={endOrbitControlsState} copiedOrbit={copiedOrbit} />
            <Divider />
            <Typography variant="h6">Time Settings</Typography>
            <TimeSettingsControls timeSettings={timeSettings} setTimeSettings={setTimeSettings} />
            <DateControls {...dateControlsState} />
            <Divider />
            <Typography variant="h6">Transfer Settings</Typography>
            <ControlsOptions state={controlsOptionsState} />
        </Stack>
    )
}

export default React.memo(MissionControls);