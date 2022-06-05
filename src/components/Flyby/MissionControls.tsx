import OrbitControls from "../OrbitControls";
import FlybySequenceControls  from "./FlybySequenceControls";
import FlybyDateControls from "./FlybyDateControls";
import TimeSettingsControls from "../TimeSettingsControls";
import ControlsOptions from "../ControlsOptions";
import SystemSelect from "../SystemSelect";

import Stack from "@mui/material/Stack";
import Box from '@mui/system/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';

import { multiFlybyStartOrbitAtom, multiFlybyEndOrbitAtom, multiFlybyControlsOptionsAtom } from "../../App";

function MissionControls() {
    return (
        <Stack spacing={1} sx={{ my: 2, mx: 2 }}>
            <Box textAlign="center">
                <Typography variant="h5">Mission Controls</Typography>
            </Box>
            <Divider />
            <SystemSelect />
            <Typography variant="h6">Orbit Settings</Typography>
            <OrbitControls label='Starting Orbit' orbitAtom={multiFlybyStartOrbitAtom} />
            <OrbitControls label='Target Orbit'   orbitAtom={multiFlybyEndOrbitAtom} />
            <Divider />
            <Typography variant="h6">Flyby Sequence</Typography>
            <FlybySequenceControls />
            <Divider />
            <Typography variant="h6">Time Settings</Typography>
            <TimeSettingsControls />
            <FlybyDateControls />
            <Divider />
            <Typography variant="h6">Mission Settings</Typography>
            <ControlsOptions optsAtom={multiFlybyControlsOptionsAtom}/>
        </Stack>
    )
}

export default MissionControls;