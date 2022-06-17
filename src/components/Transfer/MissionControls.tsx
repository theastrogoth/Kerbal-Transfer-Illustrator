import SystemSelect from "../SystemSelect";
import OrbitControls from "../OrbitControls";
import DateControls from "./DateControls";
import TimeSettingsControls from "../TimeSettingsControls";
import ControlsOptions from "../ControlsOptions";

import React from "react";
import Stack from "@mui/material/Stack";
import Box from '@mui/system/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';

import { transferStartOrbitAtom, transferEndOrbitAtom, transferControlsOptionsAtom } from "../../App";

function MissionControls() {
    return (
        <Stack alignItems='center' >
            <Stack spacing={1} sx={{ width: '90%', maxWidth: 500, my: 2, mx: 2 }} >
                <Box component="div" textAlign="center">
                    <Typography variant="h5">Mission Controls</Typography>
                </Box>
                <Divider />
                <SystemSelect />
                <Typography variant="h6">Orbit Settings</Typography>
                <OrbitControls label='Starting Orbit' orbitAtom={transferStartOrbitAtom} />
                <OrbitControls label='Target Orbit'   orbitAtom={transferEndOrbitAtom} />
                <Divider />
                <Typography variant="h6">Time Settings</Typography>
                <TimeSettingsControls />
                <DateControls />
                <Divider />
                <Typography variant="h6">Transfer Settings</Typography>
                <ControlsOptions optsAtom={transferControlsOptionsAtom} />
            </Stack>
        </Stack>
    )
}

export default React.memo(MissionControls);