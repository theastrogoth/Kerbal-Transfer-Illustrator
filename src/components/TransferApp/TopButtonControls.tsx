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
            <Box sx={{mx:8}}>
                <TableContainer>
                    <Table size="small">
                        <TableBody>
                            <TableRow>
                                <TableCell align="right" sx={{borderBottom: "none"}}>1.</TableCell>
                                <TableCell sx={{borderBottom: "none"}}>Select the celestial body where you will be starting from.</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell align="right" sx={{borderBottom: "none"}}>2.</TableCell>
                                <TableCell sx={{borderBottom: "none"}}>Enter the altitude of your starting orbit. Optionally, enter other orbit parameters.</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell align="right" sx={{borderBottom: "none"}}>3.</TableCell>
                                <TableCell sx={{borderBottom: "none"}}>Select the target celestial body.</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell align="right" sx={{borderBottom: "none"}}>4.</TableCell>
                                <TableCell sx={{borderBottom: "none"}}>Enter the altitude of your target parking orbit. Optionally, enter other orbit parameters.</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell align="right" sx={{borderBottom: "none"}}>5.</TableCell>
                                <TableCell sx={{borderBottom: "none"}}>Enter the earliest departure date to be considered. Optionally, specify the latest departure date and limits on transfer duration.</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell align="right" sx={{borderBottom: "none"}}>6.</TableCell>
                                <TableCell sx={{borderBottom: "none"}}>Select the desired relevant transfer options. Matching starting/target mean anomaly can be helpful for rendesvous missions.</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell align="right" sx={{borderBottom: "none"}}>7.</TableCell>
                                <TableCell sx={{borderBottom: "none"}}>Press the "PLOT IT!" button. A Porkchop plot will be generated, showing the approximate required Δv for transfers at each start date and flight time. To modify the bounds of the plot, left-click and drag to zoom in on a region, or use the plot controls to pan.</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell align="right" sx={{borderBottom: "none"}}>8.</TableCell>
                                <TableCell sx={{borderBottom: "none"}}>View the transfer trajectory using the orbit plots. Left-click and drag to rotate, right-click and drag to pan, and scroll to zoom. Hover over orbit paths to see detailed information. Use the slider beneath the plot to view the system at different times throughout the transfer.</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell align="right" sx={{borderBottom: "none"}}>9.</TableCell>
                                <TableCell sx={{borderBottom: "none"}}>Select other transfers from the Porkchop plot by clicking on any point in the plot. A new transfer will be calculated and displayed in the orbit plots.</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell align="right" sx={{borderBottom: "none"}}>10.</TableCell>
                                <TableCell sx={{borderBottom: "none"}}>To obtain a more accurate transfer, press the "REFINE TRANSFER" button. Error will be displayed beneath button. It can be pressed multiple times to further reduce the error.</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
            <Typography variant="h6">Advanced Usage</Typography>
            <Box sx={{mx:8, my: 1}}>
                <Typography variant="body2">
                    For those playing on PC (without mods that change the solar system), upload your savefile using the "UPLOAD SAVE FILE" button near the top of the page. Once loaded, orbits of any not-landed vessels, asteroids, and comets in your save can be selected under "Orbit Settings".
                </Typography>
            </Box>
            <Typography variant="h6">Additional Information</Typography>
            <Stack sx={{mx:8, my: 1}} spacing={1.25}>
                <Typography variant="body2">
                    More features are planned, including support for modded solar systems. Stay tuned!
                </Typography>
                <Typography variant="body2">
                    One advantage of this tool over alexmoon's and Olex's is that it can compute transfers between bodies that do not share the same primary body (e.g. Mun to Ike). Try it!
                </Typography>
                <Typography variant="body2">
                    Note that all transfers computed by this app will be "direct" transfers, which are not always the most optimal way to get from one body to another. Sometimes using the Oberth effect can lead to substantial savings.
                    While the app won't compute missions making use of the Oberth effect all at once, you could plan such a mission with the app by calculating a series of direct transfers, taking care to make sure you can "patch" them together at the proper times.
                </Typography>
                <Typography variant="body2">
                    In the orbit plots, all orbiting bodies will have two wireframe traces. The smaller one represents the surface of the body, while the larger one represents its sphere of influence (SoI).
                    The SoI is where body escapes or encounters occur in KSP.
                </Typography>
                <Typography variant="body2">
                    The "REFINE TRANSFER" button attempts to overcome an assumption used for solving the Lambert problem: that ejections and insertions are instantaneous and occur at the center of a celestial body.
                    This assumption usually does not lead to large errors for a transfer trajectory, but it can cause problems when the bodies' spheres of influence are large relative to the transfer orbit (e.g. Mun to Minmus).
                </Typography>
                <Typography variant="body2">
                    The optimizer for patching trajectories across an SoI has not yet been fine-tuned, so it may take many presses of the "REFINE TRANSFER" button to reduce the error to near-zero.
                    Keep in mind that the distances involved in interplanetary transfers are large, so even errors of many thousands of meters may be safely ignored.
                </Typography>
            </Stack>
            <Divider/>
        </Collapse>
    </Box>
    )
}

export default React.memo(TopButtonControls, (prevProps, nextProps) => true)