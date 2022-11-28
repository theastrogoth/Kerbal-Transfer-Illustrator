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
import { useAtom } from "jotai";

function MissionControls() {
    const [startOrbit, setStartOrbit] = useAtom(multiFlybyStartOrbitAtom);
    const [endOrbit, setEndOrbit] = useAtom(multiFlybyEndOrbitAtom);
    return (
        <Stack alignItems='center' >
            <Stack spacing={1} sx={{ width: '90%', maxWidth: 500, my: 2, mx: 2 }} >
                <Box component="div" textAlign="center">
                    <Typography variant="h5">Mission Controls</Typography>
                </Box>
                <Divider />
                <SystemSelect />
                <Typography variant="h6">Orbit Settings</Typography>
                <OrbitControls label='Starting Orbit' vessel={startOrbit} setVessel={setStartOrbit} />
                <OrbitControls label='Target Orbit'   vessel={endOrbit}   setVessel={setEndOrbit} />
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
        </Stack>
    )
}

export default MissionControls;