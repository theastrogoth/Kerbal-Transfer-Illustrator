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

import MultiFlyby from "../../main/objects/multiflyby";
import { timeToCalendarDate, calendarDateToString, calendarDateToDurationString} from "../../main/libs/math";



function MultiFlybyInfo({multiFlyby, timeSettings, copiedOrbit, setCopiedOrbit, copiedManeuver, setCopiedManeuver, copiedFlightPlan, setCopiedFlightPlan}: 
    {multiFlyby: MultiFlyby, timeSettings: TimeSettings, copiedOrbit: IOrbit, setCopiedOrbit: React.Dispatch<React.SetStateAction<IOrbit>>, 
     copiedManeuver: Maneuver, setCopiedManeuver: React.Dispatch<React.SetStateAction<Maneuver>>, copiedFlightPlan: FlightPlan, setCopiedFlightPlan: React.Dispatch<React.SetStateAction<FlightPlan>>}) {

    const departureTime = multiFlyby.ejections.length  === 0 ? multiFlyby.startDate : multiFlyby.ejections[0].orbits[0].epoch;
    const arrivalTime   = multiFlyby.insertions.length === 0 ? multiFlyby.endDate   : multiFlyby.insertions[0].orbits[0].epoch;
    const duration = arrivalTime - departureTime;

    const lastIdx = multiFlyby.transfers.length - 1;

    const maneuverInfoRows: JSX.Element[] = []
    if(multiFlyby.maneuvers.length > 0) {
        for(let i=0; i<multiFlyby.maneuvers.length; i++) {
            maneuverInfoRows.push(<ManeuverInfoRow key={"maneuver"+String(i+1)} name={multiFlyby.maneuverContexts[i]}  maneuver={multiFlyby.maneuvers[i]} timeSettings={timeSettings} copiedManeuver={copiedManeuver} setCopiedManeuver={setCopiedManeuver}/>)
        }
    }

    const trajectoryInfoRows: JSX.Element[] = [];
    if(lastIdx >= 0){
        trajectoryInfoRows.push(<TrajectoryInfoRow key="start" name="Start" orbitnames={["Starting Orbit"]} trajectory={[multiFlyby.startOrbit]} system={multiFlyby.system} copiedOrbit={copiedOrbit} setCopiedOrbit={setCopiedOrbit}/>)
        trajectoryInfoRows.push(...multiFlyby.ejections.map((traj, idx) => <TrajectoryInfoRow key={"ejection"+String(idx+1)} name={"Escape from " + multiFlyby.system.bodyFromId(traj.orbits[0].orbiting).name} orbitnames={traj.orbits.length > 1 ? ["Oberth Maneuver Orbit", "Outgoing Orbit"] : ["Outgoing Orbit"]} trajectory={traj.orbits} system={multiFlyby.system} copiedOrbit={copiedOrbit} setCopiedOrbit={setCopiedOrbit} />));
        for(let i=0; i<=lastIdx; i++) {
            const bodyName = i < lastIdx ? multiFlyby.system.bodyFromId(multiFlyby.flybyIdSequence[i]).name : multiFlyby.insertions.length > 0 ? multiFlyby.system.bodyFromId(multiFlyby.insertions[0].orbits[0].orbiting).name : "Target";
            trajectoryInfoRows.push(<TrajectoryInfoRow key={"transfer"+String(i+1)} name={"Transfer to " + bodyName} orbitnames={multiFlyby.transfers[i].orbits.length > 1 ? ["Orbit before plane change", "Orbit after plane change"] : ["Transfer Orbit"]} trajectory={multiFlyby.transfers[i].orbits} system={multiFlyby.system} copiedOrbit={copiedOrbit} setCopiedOrbit={setCopiedOrbit} />);
            if(i < lastIdx) {
                trajectoryInfoRows.push(<TrajectoryInfoRow key={"flyby"+String(i+1)} name={bodyName +" Flyby"} orbitnames={["Incoming Orbit", "Outgoing Orbit"]} trajectory={multiFlyby.flybys[i].orbits} system={multiFlyby.system} copiedOrbit={copiedOrbit} setCopiedOrbit={setCopiedOrbit} />);
            }
        }
        trajectoryInfoRows.push(...multiFlyby.insertions.map((traj, idx) => <TrajectoryInfoRow key={"insertion"+String(idx+1)} name={"Encounter at " + multiFlyby.system.bodyFromId(traj.orbits[0].orbiting).name}  orbitnames={traj.orbits.length > 1 ? [ "Incoming Orbit", "Oberth Maneuver Orbit"] : ["Incoming Orbit"]} trajectory={traj.orbits} system={multiFlyby.system} copiedOrbit={copiedOrbit} setCopiedOrbit={setCopiedOrbit} />));
        if(!multiFlyby.noInsertionBurn) {
           trajectoryInfoRows.push(<TrajectoryInfoRow key="end" name="End" orbitnames={["Target Orbit"]} trajectory={[multiFlyby.endOrbit]} system={multiFlyby.system} copiedOrbit={copiedOrbit} setCopiedOrbit={setCopiedOrbit} />)
        }
    }

    const flightPlan: FlightPlan = {
        trajectories:   [...multiFlyby.ejections, ...multiFlyby.transfers, ...multiFlyby.insertions],
        name:           'Copied Multi-Flyby Trajectory',
        color:          {r: 255, g: 255, b: 255},
    }

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
                            <TableCell sx={{ fontWeight: 700}}>Mission Duration:</TableCell>
                            <TableCell>{calendarDateToDurationString(timeToCalendarDate(duration, timeSettings, 0, 0))}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 700}}>Total Δv:</TableCell>
                            <TableCell>{String(Math.round(multiFlyby.deltaV * 100) / 100).concat(" m/s")}</TableCell>
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
                <Typography variant="body1" sx={{fontWeight: 600}}>
                        Copy Flight Plan
                </Typography>
                <CopyButton obj={flightPlan} copiedObj={copiedFlightPlan} setCopiedObj={setCopiedFlightPlan} size={"large"}/>
            </Box>
        </Stack>
    )
}

export default React.memo(MultiFlybyInfo);