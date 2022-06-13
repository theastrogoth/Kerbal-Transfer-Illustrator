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

import TrajectoryInfoRow from "../TrajectoryInfoRow";
import ManeuverInfoRow from "../ManeuverInfoRow";
import CopyButton from "../CopyButton";

import Kepler from "../../main/libs/kepler";
import { radToDeg, timeToCalendarDate, calendarDateToString, calendarDateToDurationString} from "../../main/libs/math";

import { useAtom } from "jotai";
import { copiedFlightPlanAtom, timeSettingsAtom, transferAtom, } from "../../App"
import GetLinkButton from "./GetLinkButton";

function TransferInfo() {
    const [transfer] = useAtom(transferAtom);
    const [timeSettings] = useAtom(timeSettingsAtom);
    const [copiedFlightPlan, setCopiedFlightPlan] = useAtom(copiedFlightPlanAtom);

    const departureTime = transfer.ejections.length === 0 ? transfer.startDate : transfer.ejections[0].orbits[0].epoch;
    let lastInsertionLen = 0;
    if (transfer.insertions.length > 0) {
        lastInsertionLen = transfer.insertions[transfer.insertions.length - 1].orbits.length;
    }
    const arrivalTime = transfer.insertions.length === 0 ? transfer.endDate : transfer.insertions[transfer.insertions.length - 1].orbits[lastInsertionLen - 1].epoch;
    const duration = arrivalTime - departureTime;

    const flightPlan: IVessel = {
        name:       'Copied Transfer',
        orbit:      transfer.startOrbit,
        maneuvers:  transfer.maneuvers.map(m => Kepler.maneuverToComponents(m))
    }

    return (
        <Stack spacing={1} sx={{ my: 2, mx: 2 }}>
            <Box textAlign="center">
                <Typography variant="h5">Selected Transfer Details</Typography>
            </Box>
            <Divider />
            <Stack alignItems="center" justifyContent="center">
                <GetLinkButton />
            </Stack>
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
                            <TableCell align="center" sx={{ fontWeight: 700}}></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {[
                        ...transfer.maneuvers.map((maneuver, index) => <ManeuverInfoRow key={"maneuver".concat(String(index+1))}  name={transfer.maneuverContexts[index]}  maneuver={maneuver} />),
                        ]}
                    </TableBody>
                </Table>
            </TableContainer>
            <Typography variant="h6">Orbits</Typography>
            <TableContainer>
                <Table size="small">
                    <TableBody>
                        {[
                        <TrajectoryInfoRow key="start"    name="Start"    orbitnames={["Starting Orbit"]} trajectory={[transfer.startOrbit]} />,
                        ...transfer.ejections.map( (traj, idx) => <TrajectoryInfoRow key={"ejection"+ String(idx)} name={"Escape from " + transfer.system.bodyFromId(traj.orbits[0].orbiting).name} orbitnames={traj.orbits.length > 1 ? ["Oberth Maneuver Orbit", "Outgoing Orbit"]  : ["Outgoing Orbit"]}  trajectory={traj.orbits} />),
                        <TrajectoryInfoRow key="transfer" name="Transfer" orbitnames={transfer.transferTrajectory.orbits.length > 1 ? ["Orbit before plane change", "Orbit after plane change"] : ["Transfer Orbit"]} trajectory={transfer.transferTrajectory.orbits} />,
                        ...transfer.insertions.map((traj, idx) => <TrajectoryInfoRow key={"insertion"+String(idx)} name={"Encounter at "  + transfer.system.bodyFromId(traj.orbits[0].orbiting).name} orbitnames={traj.orbits.length > 1 ? ["Incoming Orbit", "Oberth Maneuver Orbit"] : ["Incoming Orbit"]} trajectory={traj.orbits} />),
                        <TrajectoryInfoRow key="end"      name="End"      orbitnames={["Target Orbit"]}   trajectory={[transfer.endOrbit]} />,
                        ]}
                    </TableBody>
                </Table>
            </TableContainer>
            <Box display="flex" justifyContent="center" alignItems="center">
                <CopyButton 
                    obj={flightPlan} 
                    copiedObj={copiedFlightPlan} 
                    setCopiedObj={setCopiedFlightPlan} 
                    variant="text"
                    label="Copy Flight Plan"
                />
            </Box>
        </Stack>
    )
}

export default React.memo(TransferInfo);