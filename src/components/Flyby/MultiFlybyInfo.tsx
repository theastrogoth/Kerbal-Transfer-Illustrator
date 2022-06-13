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
import { timeToCalendarDate, calendarDateToString, calendarDateToDurationString} from "../../main/libs/math";

import { useAtom } from "jotai";
import { copiedFlightPlanAtom, multiFlybyAtom, timeSettingsAtom } from "../../App";
import GetLinkButton from "./GetLinkButton";



function MultiFlybyInfo() {
    const [timeSettings] = useAtom(timeSettingsAtom);
    const [multiFlyby] = useAtom(multiFlybyAtom);
    const [copiedFlightPlan, setCopiedFlightPlan] = useAtom(copiedFlightPlanAtom)

    const departureTime = multiFlyby.ejections.length  === 0 ? multiFlyby.startDate : multiFlyby.ejections[0].orbits[0].epoch;
    const arrivalTime   = multiFlyby.insertions.length === 0 ? multiFlyby.endDate   : multiFlyby.insertions[0].orbits[0].epoch;
    const duration = arrivalTime - departureTime;

    const lastIdx = multiFlyby.transfers.length - 1;

    const maneuverInfoRows: JSX.Element[] = []
    if(multiFlyby.maneuvers.length > 0) {
        for(let i=0; i<multiFlyby.maneuvers.length; i++) {
            maneuverInfoRows.push(<ManeuverInfoRow key={"maneuver"+String(i+1)} name={multiFlyby.maneuverContexts[i]}  maneuver={multiFlyby.maneuvers[i]} />)
        }
    }

    const trajectoryInfoRows: JSX.Element[] = [];
    if(lastIdx >= 0){
        trajectoryInfoRows.push(<TrajectoryInfoRow key="start" name="Start" orbitnames={["Starting Orbit"]} trajectory={[multiFlyby.startOrbit]} />)
        trajectoryInfoRows.push(...multiFlyby.ejections.map((traj, idx) => <TrajectoryInfoRow key={"ejection"+String(idx+1)} name={"Escape from " + multiFlyby.system.bodyFromId(traj.orbits[0].orbiting).name} orbitnames={traj.orbits.length > 1 ? ["Oberth Maneuver Orbit", "Outgoing Orbit"] : ["Outgoing Orbit"]} trajectory={traj.orbits} />));
        for(let i=0; i<=lastIdx; i++) {
            const bodyName = i < lastIdx ? multiFlyby.system.bodyFromId(multiFlyby.flybyIdSequence[i]).name : multiFlyby.insertions.length > 0 ? multiFlyby.system.bodyFromId(multiFlyby.insertions[0].orbits[0].orbiting).name : "Target";
            trajectoryInfoRows.push(<TrajectoryInfoRow key={"transfer"+String(i+1)} name={"Transfer to " + bodyName} orbitnames={multiFlyby.transfers[i].orbits.length > 1 ? ["Orbit before plane change", "Orbit after plane change"] : ["Transfer Orbit"]} trajectory={multiFlyby.transfers[i].orbits}  />);
            if(i < lastIdx) {
                trajectoryInfoRows.push(<TrajectoryInfoRow key={"flyby"+String(i+1)} name={bodyName +" Flyby"} orbitnames={["Incoming Orbit", "Outgoing Orbit"]} trajectory={multiFlyby.flybys[i].orbits} />);
            }
        }
        trajectoryInfoRows.push(...multiFlyby.insertions.map((traj, idx) => <TrajectoryInfoRow key={"insertion"+String(idx+1)} name={"Encounter at " + multiFlyby.system.bodyFromId(traj.orbits[0].orbiting).name}  orbitnames={traj.orbits.length > 1 ? [ "Incoming Orbit", "Oberth Maneuver Orbit"] : ["Incoming Orbit"]} trajectory={traj.orbits} />));
        if(!multiFlyby.noInsertionBurn) {
           trajectoryInfoRows.push(<TrajectoryInfoRow key="end" name="End" orbitnames={["Target Orbit"]} trajectory={[multiFlyby.endOrbit]} />)
        }
    }

    const flightPlan: IVessel = {
        name:       'Copied Multi-Flyby',
        orbit:      multiFlyby.startOrbit,
        maneuvers:  multiFlyby.maneuvers.map(m => Kepler.maneuverToComponents(m)),
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
                            <TableCell sx={{ fontWeight: 700}}>Mission Duration:</TableCell>
                            <TableCell>{calendarDateToDurationString(timeToCalendarDate(duration, timeSettings, 0, 0))}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 700}}>Total Δv:</TableCell>
                            <TableCell>{String(Math.round(multiFlyby.deltaV * 100) / 100).concat(" m/s")}</TableCell>
                        </TableRow>
                        {multiFlyby.flightTimes.map((ft, idx) => 
                            <TableRow key={idx}>
                                <TableCell sx={{ fontWeight: 700}}>{"Leg #" + String(idx+1) + " Duration"}</TableCell>
                                <TableCell>{calendarDateToDurationString(timeToCalendarDate(ft, timeSettings, 0, 0))}</TableCell>
                            </TableRow>
                        )}
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
                        {maneuverInfoRows}
                    </TableBody>
                </Table>
            </TableContainer>
            <Typography variant="h6">Orbits</Typography>
            <TableContainer>
                <Table size="small">
                    <TableBody>
                        {trajectoryInfoRows}
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

export default React.memo(MultiFlybyInfo);