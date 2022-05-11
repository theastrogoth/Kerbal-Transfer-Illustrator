import React, { useState } from "react";
import Table from "@mui/material/Table";
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import Box from "@mui/system/Box";

import SolarSystem from "../main/objects/system";
import { radToDeg } from "../main/libs/math";
import CopyButton from "./CopyButton";
import Orbit from "../main/objects/orbit";


function OrbitInfoRow({name, orbit, system, copiedOrbit, setCopiedOrbit}: {name: string, orbit: IOrbit, system: SolarSystem, copiedOrbit: IOrbit, setCopiedOrbit: React.Dispatch<React.SetStateAction<IOrbit>>}) {
    const [open, setOpen] = useState(false);

    const handleToggle = () => {
        setOpen(!open);
    }

    return (
    <>
        <TableRow >
            <TableCell sx={{ borderBottom: 0 }}>
                <IconButton
                    size="small"
                    onClick={ handleToggle }
                >
                    {open ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
                </IconButton>
            </TableCell>
            <TableCell sx={{ borderBottom: 0}}>{name}</TableCell>
            <TableCell sx={{ borderBottom: 0}}>
                <CopyButton obj={orbit} copiedObj={copiedOrbit} setCopiedObj={setCopiedOrbit} />
            </TableCell>
        </TableRow>
        <TableRow>
            <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={2}>
                <Collapse in={open} timeout="auto" unmountOnExit>
                    <Box sx={{ margin: 1 }}>
                        <Table size="small">
                            <TableBody>
                                <TableRow>
                                    <TableCell sx={{ borderBottom: 0 }}>Orbiting:</TableCell>
                                    <TableCell sx={{ borderBottom: 0 }}>{system.bodyFromId(orbit.orbiting).name}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell sx={{ borderBottom: 0 }}>Semi-major axis:</TableCell>
                                    <TableCell sx={{ borderBottom: 0 }}>{String(orbit.semiMajorAxis).concat("m")}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell sx={{ borderBottom: 0 }}>Eccentricity:</TableCell>
                                    <TableCell sx={{ borderBottom: 0 }}>{String(orbit.eccentricity)}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell sx={{ borderBottom: 0 }}>Inclination:</TableCell>
                                    <TableCell sx={{ borderBottom: 0 }}>{String(radToDeg(orbit.inclination)).concat("°")}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell sx={{ borderBottom: 0 }}>Argument of the periapsis:</TableCell>
                                    <TableCell sx={{ borderBottom: 0 }}>{String(radToDeg(orbit.argOfPeriapsis)).concat("°")}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell sx={{ borderBottom: 0 }}>Longitude of the Ascending Node:</TableCell>
                                    <TableCell sx={{ borderBottom: 0 }}>{String(radToDeg(orbit.ascNodeLongitude)).concat("°")}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell sx={{ borderBottom: 0 }}>Mean anomaly at Epoch:</TableCell>
                                    <TableCell sx={{ borderBottom: 0 }}>{String(orbit.meanAnomalyEpoch).concat(" rad")}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell sx={{ borderBottom: 0 }}>Epoch:</TableCell>
                                    <TableCell sx={{ borderBottom: 0 }}>{String(orbit.epoch).concat(" rad")}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </Box>
                </Collapse>
            </TableCell>
        </TableRow>
    </>
    )
}

export default OrbitInfoRow;