import OrbitControls from "../OrbitControls";
import FlybySequenceControls  from "./FlybySequenceControls";
import FlybyDateControls from "./FlybyDateControls";
import TimeSettingsControls from "../TimeSettingsControls";
import ControlsOptions from "../ControlsOptions";
import SystemSelect from "../SystemSelect";
import CommsControls from "../CommsControls";

import React, { useState } from 'react';
import Stack from "@mui/material/Stack";
import Box from '@mui/system/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Collapse from "@mui/material/Collapse";
import IconButton from '@mui/material/IconButton';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';

import { multiFlybyStartOrbitAtom, multiFlybyEndOrbitAtom, multiFlybyControlsOptionsAtom } from "../../App";
import { useAtom } from "jotai";

function MissionControls() {
    const [startOrbit, setStartOrbit] = useAtom(multiFlybyStartOrbitAtom);
    const [endOrbit, setEndOrbit] = useAtom(multiFlybyEndOrbitAtom);

    const [orbitsOpen, setOrbitsOpen] = useState(true);
    const [flybyOpen, setFlybyOpen] = useState(true);
    const [timeOpen, setTimeOpen] = useState(true);
    const [optsOpen, setOptsOpen] = useState(false);
    const [commsOpen, setCommsOpen] = useState(false);

    return (
        <Stack alignItems='center' >
            <Stack spacing={1} sx={{ width: '90%', maxWidth: 500, my: 2, mx: 2 }} >
                <Box component="div" textAlign="center">
                    <Typography variant="h5">Mission Controls</Typography>
                </Box>
                <Divider />
                <SystemSelect />
                <Stack direction="row">
                    <Typography variant="h6">Orbit Settings</Typography>
                    <IconButton
                        size="small"
                        onClick={() => setOrbitsOpen(!orbitsOpen)}
                    >
                        {orbitsOpen ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
                    </IconButton>
                    <Box component="div" sx={{ flexGrow: 1 }} />
                </Stack>
                <Collapse in={orbitsOpen}>
                    <OrbitControls label='Starting Orbit' vessel={startOrbit} setVessel={setStartOrbit} />
                    <OrbitControls label='Target Orbit'   vessel={endOrbit}   setVessel={setEndOrbit} />
                </Collapse>
                <Divider />
                <Stack direction="row">
                    <Typography variant="h6">Flyby Sequence</Typography>
                    <IconButton
                        size="small"
                        onClick={() => setFlybyOpen(!flybyOpen)}
                    >
                        {flybyOpen ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
                    </IconButton>
                    <Box component="div" sx={{ flexGrow: 1 }} />
                </Stack>
                <Collapse in={flybyOpen}>
                    <FlybySequenceControls />
                </Collapse>
                <Divider />
                <Stack direction="row">
                    <Typography variant="h6">Time Settings</Typography>
                    <IconButton
                        size="small"
                        onClick={() => setTimeOpen(!timeOpen)}
                    >
                        {timeOpen ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
                    </IconButton>
                    <Box component="div" sx={{ flexGrow: 1 }} />
                </Stack>
                <Collapse in={timeOpen}>
                    <TimeSettingsControls />
                    <FlybyDateControls />
                </Collapse>
                <Divider />
                <Stack direction="row">
                    <Typography variant="h6">Mission Settings</Typography>
                    <IconButton
                        size="small"
                        onClick={() => setOptsOpen(!optsOpen)}
                    >
                        {optsOpen ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
                    </IconButton>
                    <Box component="div" sx={{ flexGrow: 1 }} />
                </Stack>
                <Collapse in={optsOpen}>
                    <ControlsOptions optsAtom={multiFlybyControlsOptionsAtom}/>
                </Collapse>
                <Divider />
                <Stack direction="row">
                    <Typography variant="h6">CommNet Settings</Typography>
                    <IconButton
                        size="small"
                        onClick={() => setCommsOpen(!commsOpen)}
                    >
                        {commsOpen ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
                    </IconButton>
                    <Box component="div" sx={{ flexGrow: 1 }} />
                </Stack>
                <Collapse in={commsOpen}>
                    <CommsControls />
                </Collapse>
            </Stack>
        </Stack>
    )
}

export default MissionControls;