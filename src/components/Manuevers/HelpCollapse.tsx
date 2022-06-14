import React from 'react';
import Box from '@mui/system/Box';
import Stack from '@mui/material/Stack';
import Collapse from "@mui/material/Collapse";
import Typography from "@mui/material/Typography";
import TableContainer from "@mui/material/TableContainer";
import Table from "@mui/material/Table";
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Divider from '@mui/material/Divider';

function HelpCollapse({showHelp}: {showHelp: boolean}) {
    return (
    <Box justifyContent="center" textAlign='left' sx={{mx: 4, my: 1}}>
        <Collapse in={showHelp}>
            <Typography variant="h6">Basic Instructions</Typography>
            <Box sx={{mx:8}}>
                <TableContainer>
                    <Table size="small">
                        <TableBody>
                            <TableRow>
                                <TableCell align="right" sx={{borderBottom: "none"}}>1.</TableCell>
                                <TableCell sx={{borderBottom: "none"}}>Use the "+ Add Flight Plan" button to create a new flight plans. Plans can be removed with the "x Delete Flight Plan button underneat the Flight Plan Controls." </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell align="right" sx={{borderBottom: "none"}}>2.</TableCell>
                                <TableCell sx={{borderBottom: "none"}}>For a new flight plan, select the celestial body where you will be starting from.</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell align="right" sx={{borderBottom: "none"}}>3.</TableCell>
                                <TableCell sx={{borderBottom: "none"}}>Enter the altitude of your starting orbit. Optionally, enter other orbit parameters, or paste an orbit copied from a different page of the app.</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell align="right" sx={{borderBottom: "none"}}>4.</TableCell>
                                <TableCell sx={{borderBottom: "none"}}>Use the "+ Add Maneuver" button to add a new maneuver. Maneuvers can be removed by pressing the "X" button next to their name. </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell align="right" sx={{borderBottom: "none"}}>5.</TableCell>
                                <TableCell sx={{borderBottom: "none"}}>For each maneuver, enter the maneuver parameters (i.e. prograde, normal, radial, and UT). </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell align="right" sx={{borderBottom: "none"}}>6.</TableCell>
                                <TableCell sx={{borderBottom: "none"}}>View the resulting trajectories in the Orbit Plot Tabs, which will update automatically.</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell align="right" sx={{borderBottom: "none"}}>7.</TableCell>
                                <TableCell sx={{borderBottom: "none"}}>Orbits, maneuvers, and flight plans can be pasted with the clipboard buttons after copying them from the Transfer and Multi-Flyby planners.</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell align="right" sx={{borderBottom: "none"}}>8.</TableCell>
                                <TableCell sx={{borderBottom: "none"}}>To save or share the computed flight plan, press the "Copy Link to these Flight Plans" button. Be warned: the copied URL will be very long!</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
            <Typography variant="h6">Advanced Usage</Typography>
            <Box sx={{mx:8, my: 1}}>
                <Typography variant="body2">
                    For those playing on PC, upload your savefile using the "UPLOAD SAVE FILE" button near the top of the page. Once loaded, orbits of any not-landed vessels, asteroids, and comets in your save can be added, complete with starting orbits and maneuvers.
                    If you are using a modded system, be sure to select it under the System dropdown selector, or upload your Kopernics config files on the System Editor page.
                </Typography>
            </Box>
            <Typography variant="h6">Additional Information</Typography>
            <Stack sx={{mx:8, my: 1}} spacing={1.25}>
                <Typography variant="body2">
                    Note that some flight plans copied from the Transfer and Multi-Flyby planners will likely need some adjustments to match the expected trajectory (particularly to the UT of each maneuver).
                </Typography>
                <Typography variant="body2">
                    In the orbit plots, all orbiting bodies will have two wireframe traces. The smaller one represents the surface of the body, while the larger one represents its sphere of influence (SoI).
                    The SoI is where body escapes or encounters occur in KSP.
                </Typography>
            </Stack>
            <Divider/>
        </Collapse>
    </Box>
    )
}

export default React.memo(HelpCollapse);