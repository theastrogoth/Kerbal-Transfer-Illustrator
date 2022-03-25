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

import MultiFlyby from "../../main/objects/multiflyby";
import { timeToCalendarDate, calendarDateToString, calendarDateToDurationString} from "../../main/libs/math";



function MultiFlybyInfo({multiFlyby, timeSettings}: {multiFlyby: MultiFlyby, timeSettings: TimeSettings}) {

    const departureTime = multiFlyby.ejections.length  === 0 ? multiFlyby.startDate : multiFlyby.ejections[0].orbits[0].epoch;
    const arrivalTime   = multiFlyby.insertions.length === 0 ? multiFlyby.endDate   : multiFlyby.insertions[0].orbits[0].epoch;
    const duration = arrivalTime - departureTime;

    const lastIdx = multiFlyby.transfers.length - 1;
    const lastManeuverIdx = multiFlyby.maneuvers.length - 1;

    const maneuverInfoRows: JSX.Element[] = []
    if(lastManeuverIdx >= 0) {
        maneuverInfoRows.push(<ManeuverInfoRow key={"maneuverDepart"}  name={"Departure Burn"}  maneuver={multiFlyby.maneuvers[0]} timeSettings={timeSettings}/>);
        let maneuverCounter = 1;
        for(let i=0; i<= lastIdx; i++) {
            if(multiFlyby.transfers[i].maneuvers.length > 2) {
                maneuverInfoRows.push(<ManeuverInfoRow key={"planeChange"+String(i+1)} name={"Plane Change "+String(i+1)}  maneuver={multiFlyby.maneuvers[maneuverCounter]} timeSettings={timeSettings}/>);
                maneuverCounter++;
            }
            if(i < lastIdx) {
                maneuverInfoRows.push(<ManeuverInfoRow key={"flyby"+String(i+1)}  name={multiFlyby.system.bodyFromId(multiFlyby.flybyIdSequence[i]).name + " Flyby"}  maneuver={multiFlyby.maneuvers[maneuverCounter]} timeSettings={timeSettings}/>)
                maneuverCounter++;
            }
        }
        if(!multiFlyby.noInsertionBurn) {
            maneuverInfoRows.push(<ManeuverInfoRow key={"maneuverArrive"+String(lastManeuverIdx+1)} name={"Arrival Burn"} maneuver={multiFlyby.maneuvers[lastManeuverIdx]} timeSettings={timeSettings}/>)
        }
    }

    const orbitInfoRows: JSX.Element[] = [];
    if(lastIdx >= 0){
        orbitInfoRows.push(<OrbitInfoRow key="start" name="Starting Orbit" orbit={multiFlyby.startOrbit} system={multiFlyby.system}/>)
        orbitInfoRows.push(...multiFlyby.ejections.map((traj, tidx) => traj.orbits.map((orbit, index) => <OrbitInfoRow key={"ejection"+String(tidx+1)+String(index+1)}  name={"Ejection from " + multiFlyby.system.bodyFromId(orbit.orbiting).name}  orbit={orbit} system={multiFlyby.system}/>)).flat());
        for(let i=0; i<=lastIdx; i++) {
            const bodyName = i < lastIdx ? multiFlyby.system.bodyFromId(multiFlyby.flybyIdSequence[i]).name : multiFlyby.insertions.length > 0 ? multiFlyby.system.bodyFromId(multiFlyby.insertions[0].orbits[0].orbiting).name : "Target";
            orbitInfoRows.push(...multiFlyby.transfers[i].orbits.map((orbit,index) => <OrbitInfoRow key={"transfer"+String(i+1)+String(index+1)} name={"Transfer To " + bodyName} orbit={orbit} system={multiFlyby.system}/>));
            if(i < lastIdx) {
                orbitInfoRows.push(...[<OrbitInfoRow key={"inflyby"+String(i+1)}  name={bodyName +" Encounter"} orbit={multiFlyby.flybys[i].orbits[0]}  system={multiFlyby.system}/>, 
                                       <OrbitInfoRow key={"outflyby"+String(i+1)} name={bodyName +" Escape"}    orbit={multiFlyby.flybys[i].orbits[1]} system={multiFlyby.system}/>]);
            }
        }
        orbitInfoRows.push(...multiFlyby.insertions.map((traj, tidx) => traj.orbits.map((orbit, index) => <OrbitInfoRow key={"insertion"+String(tidx+1)+String(index+1)}  name={"Insertion at " + multiFlyby.system.bodyFromId(orbit.orbiting).name}  orbit={orbit} system={multiFlyby.system}/>)).flat());
        if(!multiFlyby.noInsertionBurn) {
           orbitInfoRows.push(<OrbitInfoRow key="end" name="Target Orbit" orbit={multiFlyby.endOrbit} system={multiFlyby.system}/>)
        }
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
                        {orbitInfoRows}
                    </TableBody>
                </Table>
            </TableContainer>
        </Stack>
    )
}

export default React.memo(MultiFlybyInfo);