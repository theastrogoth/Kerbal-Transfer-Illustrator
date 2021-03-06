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

import { flightPlanToVessel } from "../../main/libs/propagate";

import { useAtom } from "jotai";
import { copiedFlightPlanAtom, systemAtom } from "../../App";


function FlightPlanInfo({flightPlan}: {flightPlan: FlightPlan}) {
    const [system] = useAtom(systemAtom);
    const [copiedFlightPlan, setCopiedFlightPlan] = useAtom(copiedFlightPlanAtom);

    const deltaV: number = flightPlan.trajectories.reduce<number>((acc, curr) => acc + curr.maneuvers.reduce<number>((a,c) => a + c.deltaVMag, 0), 0);
    const maneuvers: Maneuver[] = flightPlan.trajectories.map(t => t.maneuvers).flat();
    const vesselPlan: IVessel = flightPlanToVessel(flightPlan);

    return (
        <Stack spacing={1} sx={{ my: 2, mx: 2 }}>
            <Box component="div" textAlign="center">
                <Typography variant="h5">{flightPlan.name + " Trajectory Details"}</Typography>
            </Box>
            <Divider />
            <Typography variant="h6">Overview</Typography>
            <TableContainer>
                <Table size="small">
                    <TableBody>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 700}}>Total Δv:</TableCell>
                            <TableCell>{Number(Math.round(deltaV * 100) / 100).toLocaleString().concat(" m/s")}</TableCell>
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
                        ...maneuvers.map((maneuver, index) => <ManeuverInfoRow key={"maneuver".concat(String(index+1))}  name={"Maneuver #" + String(index + 1)}  maneuver={maneuver} />),
                        ]}
                    </TableBody>
                </Table>
            </TableContainer>
            <Typography variant="h6">Orbits</Typography>
            <TableContainer>
                <Table size="small">
                    <TableBody>
                        { flightPlan.trajectories.map((traj, idx) => <TrajectoryInfoRow key={idx} name={system.bodyFromId(traj.orbits[0].orbiting).name + " System"} orbitnames={traj.orbits.map((o,idx) => "Orbit #" + String(idx+1))} trajectory={traj.orbits} />) }
                    </TableBody>
                </Table>
            </TableContainer>
            <Box component="div" display="flex" justifyContent="center" alignItems="center">
                <CopyButton 
                    obj={vesselPlan} 
                    copiedObj={copiedFlightPlan} 
                    setCopiedObj={setCopiedFlightPlan} 
                    variant="text"
                    label="Copy Flight Plan"
                />
            </Box>
        </Stack>
    )
}

export default React.memo(FlightPlanInfo);