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
                                <TableCell sx={{borderBottom: "none"}}>Select the celestial body where you will be starting from.</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell align="right" sx={{borderBottom: "none"}}>2.</TableCell>
                                <TableCell sx={{borderBottom: "none"}}>Enter the altitude of your starting orbit. Optionally, enter other orbit parameters.</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell align="right" sx={{borderBottom: "none"}}>3.</TableCell>
                                <TableCell sx={{borderBottom: "none"}}>Select the target celestial body. It does not have to orbit around the same body as the starting body! </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell align="right" sx={{borderBottom: "none"}}>4.</TableCell>
                                <TableCell sx={{borderBottom: "none"}}>Enter the altitude of your target parking orbit. Optionally, enter other orbit parameters.</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell align="right" sx={{borderBottom: "none"}}>5.</TableCell>
                                <TableCell sx={{borderBottom: "none"}}>Set the sequence of flybies for the mission. Not all sequences will yield a good result!</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell align="right" sx={{borderBottom: "none"}}>6.</TableCell>
                                <TableCell sx={{borderBottom: "none"}}>Set the beginning of the launch window. Optionally, specify the date when the launch window closes.</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell align="right" sx={{borderBottom: "none"}}>7.</TableCell>
                                <TableCell sx={{borderBottom: "none"}}>Select whether or not an insertion burn will be calculated and included in the mission's total Δv.</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell align="right" sx={{borderBottom: "none"}}>8.</TableCell>
                                <TableCell sx={{borderBottom: "none"}}>Press the "SEARCH TRAJECTORIES" button. A multi-flyby trajectory within the launch window bounds will be optimized.</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell align="right" sx={{borderBottom: "none"}}>9.</TableCell>
                                <TableCell sx={{borderBottom: "none"}}>View the trajectory using the orbit plots. Left-click and drag to rotate, right-click and drag to pan, and scroll to zoom. Hover over orbit paths to see detailed information. Use the slider beneath the plot to view the system at different times throughout the transfer.</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell align="right" sx={{borderBottom: "none"}}>10.</TableCell>
                                <TableCell sx={{borderBottom: "none"}}>To save or share the computed trajectory, press the "Copy Link to this Multi-Flyby" button. Be warned: the copied URL will be very long!</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
            <Typography variant="h6">Advanced Usage</Typography>
            <Box sx={{mx:8, my: 1}}>
                <Typography variant="body2">
                    For those playing on PC, upload your savefile using the "UPLOAD SAVE FILE" button near the top of the page. Once loaded, orbits of any not-landed vessels, asteroids, and comets in your save can be selected under "Orbit Settings".
                    If you are using a modded system, be sure to select it under the System dropdown selector, or upload your Kopernics config files on the System Editor page.
                </Typography>
            </Box>
            <Typography variant="h6">Additional Information</Typography>
            <Stack sx={{mx:8, my: 1}} spacing={1.25}>
                <Typography variant="body2">
                    In the orbit plots, all orbiting bodies will have two wireframe traces. The smaller one represents the surface of the body, while the larger one represents its sphere of influence (SoI).
                    The SoI is where body escapes or encounters occur in KSP.
                </Typography>
                <Typography variant="body2">
                    The trajectories calculated by the app make use of powered flybys, but do not consider the use of deep space maneuvers. 
                </Typography>
                <Typography variant="body2">
                    The "unrefined" trajectories calculated by the app use the "zero SoI" assumption for computing transfers. For situations where a body's SoI is not negligible compared to the transfer distances, the resulting trajectories may not be accurate.
                </Typography>
                <Typography variant="body2">
                    The optimizer for patching trajectories across an SoI has not yet been fine-tuned, so it may take many presses of the "REFINE TRAJECTORY" button to reduce the error to near-zero.
                    Keep in mind that the distances involved in interplanetary travel are large, so even errors of a few thousand meters can sometimes be safely ignored. Trajectories can be very sensitive to time errors, however.
                </Typography>
            </Stack>
            <Divider/>
        </Collapse>
    </Box>
    )
}

export default HelpCollapse;