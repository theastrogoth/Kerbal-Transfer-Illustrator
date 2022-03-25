import React from "react";
import TableContainer from "@mui/material/TableContainer";
import Table from "@mui/material/Table";
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Box from "@mui/system/Box";
import Stack from "@mui/material/Stack";
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';

import OrbitInfoRow from "../OrbitInfoRow";
import ManeuverInfoRow from "../ManeuverInfoRow";

import Transfer from "../../main/objects/transfer";
import { radToDeg, timeToCalendarDate, calendarDateToString, calendarDateToDurationString} from "../../main/libs/math";


function TransferInfo({transfer, timeSettings}: {transfer: Transfer, timeSettings: TimeSettings}) {

    const departureTime = transfer.ejections.length === 0 ? transfer.startDate : transfer.ejections[0].orbits[0].epoch;
    let lastInsertionLen = 0;
    if (transfer.insertions.length > 0) {
        lastInsertionLen = transfer.insertions[transfer.insertions.length - 1].orbits.length;
    }
    const arrivalTime = transfer.insertions.length === 0 ? transfer.endDate : transfer.insertions[transfer.insertions.length - 1].orbits[lastInsertionLen - 1].epoch;
    const duration = arrivalTime - departureTime;

    const maneuversLen = transfer.maneuvers.length;

    return (
        <Stack spacing={1} sx={{ my: 2, mx: 2 }}>
            <Box textAlign="center">
                <Typography variant="h5">Selected Transfer Details</Typography>
            </Box>
            <Divider />
            <Typography variant="h6">Overview</Typography>
            <TableContainer>
                <Table size="small">
                    <TableBody>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 700}}>Departure Date:</TableCell>
                            <TableCell>{calendarDateToString(timeToCalendarDate(departureTime, timeSettings, 1, 1))}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 700}}>Arrival Date:</TableCell>
                            <TableCell>{calendarDateToString(timeToCalendarDate(arrivalTime, timeSettings, 1, 1))}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 700}}>Transfer Duration:</TableCell>
                            <TableCell>{calendarDateToDurationString(timeToCalendarDate(duration, timeSettings, 0, 0))}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 700}}>Total Δv:</TableCell>
                            <TableCell>{String(Math.round(transfer.deltaV * 100) / 100).concat(" m/s")}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 700}}>Phase Angle:</TableCell>
                            <TableCell>{String(Math.round(radToDeg(transfer.phaseAngle) * 100) / 100).concat("°")}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
            <Typography variant="h6">Maneuvers</Typography>
            <TableContainer>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell></TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700}}>#</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700}}>Δv</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700}}>Date</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {[
                        ...transfer.maneuvers.map((maneuver, index) => <ManeuverInfoRow key={"maneuver".concat(String(index+1))}  name={index === 0 ? "Departure Burn" : index === maneuversLen-1 ? "Arrival Burn" : "Plane-change Burn"}  maneuver={maneuver} timeSettings={timeSettings}/>),
                        ]}
                    </TableBody>
                </Table>
            </TableContainer>
            <Typography variant="h6">Orbits</Typography>
            <TableContainer>
                <Table size="small">
                    <TableBody>
                        {[
                        <OrbitInfoRow key="start" name="Starting Orbit" orbit={transfer.startOrbit} system={transfer.system}/>,
                        ...transfer.ejections.map((traj, tidx) => traj.orbits.map((orbit, index)   => <OrbitInfoRow key={"ejection"+String(tidx+1)+String(index+1)}  name={"Ejection Orbit from " + transfer.system.bodyFromId(orbit.orbiting).name} orbit={orbit} system={transfer.system}/>)).flat(),
                        ...transfer.transferTrajectory.orbits.map((orbit, index)   => <OrbitInfoRow key={"transfer".concat(String(index+1))}  name={"Transfer Orbit" + (transfer.transferTrajectory.orbits.length === 1 ? "" : (" "+String(index+1)))}    orbit={orbit} system={transfer.system}/>),
                        ...transfer.insertions.map((traj, tidx) => traj.orbits.map((orbit, index)  => <OrbitInfoRow key={"insertion"+String(tidx+1)+String(index+1)} name={"Insertion Orbit at "  + transfer.system.bodyFromId(orbit.orbiting).name} orbit={orbit} system={transfer.system}/>)).flat(),
                        <OrbitInfoRow key="end" name="Target Orbit" orbit={transfer.endOrbit} system={transfer.system}/>,
                        ]}
                    </TableBody>
                </Table>
            </TableContainer>
        </Stack>
    )
}

export default React.memo(TransferInfo);