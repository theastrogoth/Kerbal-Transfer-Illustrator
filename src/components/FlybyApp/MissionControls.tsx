import { SolarSystem } from "../../main/objects/system";
import Vessel from "../../main/objects/vessel";

import OrbitControls, { OrbitControlsState } from "../OrbitControls";
import FlybySequenceControls, { FlybySequenceControlsState } from "./FlybySequenceControls";
import DateControls, { DateControlsState } from "../DateControls";
import TimeSettingsControls from "../TimeSettingsControls";
import ControlsOptions, { ControlsOptionsState } from "../ControlsOptions";

import React, { SetStateAction } from "react";
import Stack from "@mui/material/Stack";
import Box from '@mui/system/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';



type MissionControlsProps = {
    system:                     SolarSystem,
    vessels:                    Vessel[],
    startOrbitControlsState:    OrbitControlsState,
    endOrbitControlsState:      OrbitControlsState,
    flybySequenceControlsState: FlybySequenceControlsState,
    timeSettings:               TimeSettings
    setTimeSettings:            React.Dispatch<SetStateAction<TimeSettings>>,
    dateControlsState:          DateControlsState,
    controlsOptionsState:       ControlsOptionsState,
}

function MissionControls({system, vessels, startOrbitControlsState, endOrbitControlsState, flybySequenceControlsState, dateControlsState, timeSettings, setTimeSettings, controlsOptionsState}: MissionControlsProps) {
    return (
        <Stack spacing={1} sx={{ my: 2, mx: 2 }}>
            <Box textAlign="center">
                <Typography variant="h5">Mission Controls</Typography>
            </Box>
            <Divider />
            <Typography variant="h6">Orbit Settings</Typography>
            <OrbitControls label='Starting Orbit' system={system} vessels={vessels} state={startOrbitControlsState} />
            <OrbitControls label='Target Orbit'   system={system} vessels={vessels} state={endOrbitControlsState} />
            <Divider />
            <Typography variant="h6">Flyby Sequence</Typography>
            <FlybySequenceControls {...flybySequenceControlsState} />
            <Divider />
            <Typography variant="h6">Time Settings</Typography>
            <TimeSettingsControls timeSettings={timeSettings} setTimeSettings={setTimeSettings}/>
            <DateControls state={dateControlsState} />
            <Divider />
            <Typography variant="h6">Mission Settings</Typography>
            <ControlsOptions state={controlsOptionsState}/>
        </Stack>
    )
}

export default React.memo(MissionControls);