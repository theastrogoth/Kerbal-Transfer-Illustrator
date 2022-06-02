import OrbitControls, { OrbitControlsState } from "../OrbitControls";
import FlybySequenceControls, { FlybySequenceControlsState } from "./FlybySequenceControls";
import FlybyDateControls, { FlybyDateControlsState } from "./FlybyDateControls";
import TimeSettingsControls from "../TimeSettingsControls";
import ControlsOptions, { ControlsOptionsState } from "../ControlsOptions";
import SystemSelect from "../SystemSelect";

import Stack from "@mui/material/Stack";
import Box from '@mui/system/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';



type MissionControlsProps = {
    startOrbitControlsState:    OrbitControlsState,
    endOrbitControlsState:      OrbitControlsState,
    flybySequenceControlsState: FlybySequenceControlsState,
    dateControlsState:          FlybyDateControlsState,
    controlsOptionsState:       ControlsOptionsState,
}

function MissionControls({startOrbitControlsState, endOrbitControlsState, flybySequenceControlsState, dateControlsState, controlsOptionsState}: MissionControlsProps) {
    return (
        <Stack spacing={1} sx={{ my: 2, mx: 2 }}>
            <Box textAlign="center">
                <Typography variant="h5">Mission Controls</Typography>
            </Box>
            <Divider />
            <SystemSelect />
            <Typography variant="h6">Orbit Settings</Typography>
            <OrbitControls label='Starting Orbit' state={startOrbitControlsState} />
            <OrbitControls label='Target Orbit'   state={endOrbitControlsState} />
            <Divider />
            <Typography variant="h6">Flyby Sequence</Typography>
            <FlybySequenceControls {...flybySequenceControlsState} dateControlsState={dateControlsState} />
            <Divider />
            <Typography variant="h6">Time Settings</Typography>
            <TimeSettingsControls />
            <FlybyDateControls {...dateControlsState} />
            <Divider />
            <Typography variant="h6">Mission Settings</Typography>
            <ControlsOptions state={controlsOptionsState}/>
        </Stack>
    )
}

export default MissionControls;