import SolarSystem from "../../main/objects/system";
import Vessel from "../../main/objects/vessel";

import SaveFileUploadButton from "../SaveFileUploadButton";

import React, { useState } from "react";
import Box from '@mui/system/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Collapse from "@mui/material/Collapse";
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import Typography from "@mui/material/Typography";
import TableContainer from "@mui/material/TableContainer";
import Table from "@mui/material/Table";
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Divider from '@mui/material/Divider';

function TopButtonControls({system, setVessels}: {system: SolarSystem, setVessels: React.Dispatch<React.SetStateAction<Vessel[]>>}) {
    const [show, setShow] = useState(false);
    return (
    <Box justifyContent="center" textAlign='left' sx={{mx: 4, my: 1}}>
        <Stack direction={"row"} spacing={5}>
            <Button 
                variant="text" 
                color="info"
                onClick={() => setShow(!show)}
                startIcon={<HelpOutlineIcon />}
            >
                {"Help ".concat(show ? "⏶" : "⏷") }
            </Button>
            <SaveFileUploadButton system={system} setVessels={setVessels}/>
        </Stack>
        <Collapse in={show}>
            <Typography variant="h6">Basic Instructions</Typography>
            <Box>

            </Box>
            <Typography variant="h6">Advanced Usage</Typography>
            <Box sx={{mx:8, my: 1}}>

            </Box>
            <Typography variant="h6">Additional Information</Typography>
            <Stack sx={{mx:8, my: 1}} spacing={1.25}>
                
            </Stack>
            <Divider/>
        </Collapse>
    </Box>
    )
}

export default React.memo(TopButtonControls, (prevProps, nextProps) => true)