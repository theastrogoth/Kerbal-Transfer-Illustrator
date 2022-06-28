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
    <Box component="div" justifyContent="center" textAlign='left' sx={{mx: 4, my: 1}}>
        <Collapse in={showHelp}>
            <Typography variant="h6">Basic Instructions</Typography>
            <Box component="div" sx={{mx:8}}>
                <TableContainer>
                    <Table size="small">
                        <TableBody>
                            <TableRow>
                                <TableCell align="right" sx={{borderBottom: "none"}}>1.</TableCell>
                                <TableCell sx={{borderBottom: "none"}}>To start from scratch, press the "X Clear Bodies" button. To start from a popular system configuration, select it from the dropdown.</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell align="right" sx={{borderBottom: "none"}}>2.</TableCell>
                                <TableCell sx={{borderBottom: "none"}}>Upload the Kopernicus configuration file for the sun by pressing the "Upload Sun Config" button.</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell align="right" sx={{borderBottom: "none"}}>3.</TableCell>
                                <TableCell sx={{borderBottom: "none"}}>Upload the Kopernicus configuration file for the planets/moons by pressing the "Upload Body Configs" button. Note that multiple files can be uploaded together</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell align="right" sx={{borderBottom: "none"}}>4.</TableCell>
                                <TableCell sx={{borderBottom: "none"}}>If you wish to rescale the system, enter the desired scaling factor in the "System Scale" field. </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell align="right" sx={{borderBottom: "none"}}>5.</TableCell>
                                <TableCell sx={{borderBottom: "none"}}>To select a body for viewing/editing, click on its name in the "Custom Bodies" list. </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell align="right" sx={{borderBottom: "none"}}>6.</TableCell>
                                <TableCell sx={{borderBottom: "none"}}>Edit the body parameters as desired under the "Body Configuration" section. If a field is left blank, it will borrow the corresponding value for the template body</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell align="right" sx={{borderBottom: "none"}}>7.</TableCell>
                                <TableCell sx={{borderBottom: "none"}}>The system that results from your custom body configurations and settings will be displayed in an interactive 3D plot in the "Custom System" section. Focus on a particular body by selecting it with the "Central Body" dropdown. Click on a body in the plot to see its detailed information (after scaling has been applied).</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell align="right" sx={{borderBottom: "none"}}>8.</TableCell>
                                <TableCell sx={{borderBottom: "none"}}>To save or share your custom system, press the "Copy Link to this Custom System" button. Be warned: the copied URL will be very long!</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell align="right" sx={{borderBottom: "none"}}>9.</TableCell>
                                <TableCell sx={{borderBottom: "none"}}>After using the System Editor page, the created solar system can be selected as the "Custom System" on other pages in the app.</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
            <Typography variant="h6">Additional Information</Typography>
            <Stack sx={{mx:8, my: 1}} spacing={1.25}>
                <Typography variant="body2">
                    It is possible that some Kopernicus configuration files will not be read correctly, and the information for the body may need to be input manually.
                </Typography>
            </Stack>
            <Divider/>
        </Collapse>
    </Box>
    )
}

export default React.memo(HelpCollapse);