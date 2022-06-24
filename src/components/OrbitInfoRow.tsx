import { useState } from "react";
import Table from "@mui/material/Table";
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import Box from "@mui/system/Box";

import { calendarDateToDurationString, timeToCalendarDate, radToDeg } from "../main/libs/math";
import CopyButton from "./CopyButton";

import { useAtom } from "jotai";
import { copiedOrbitAtom, systemAtom, timeSettingsAtom } from "../App";
import Orbit from "../main/objects/orbit";

export function OrbitTable({orbit}: {orbit: IOrbit}) {
    const [system] = useAtom(systemAtom);
    const [timeSettings] = useAtom(timeSettingsAtom);
    const attractor = system.bodyFromId(orbit.orbiting);
    const fullOrbit = new Orbit(orbit, attractor);
    const dateString = calendarDateToDurationString(timeToCalendarDate(orbit.siderealPeriod, timeSettings, 0, 0));
    return (
        <Table size="small">
            <TableBody>
                <TableRow>
                    <TableCell sx={{ borderBottom: 0 }}>Orbiting:</TableCell>
                    <TableCell sx={{ borderBottom: 0 }}>{attractor.name}</TableCell>
                </TableRow>
                <TableRow>
                    <TableCell sx={{ borderBottom: 0 }}>Periapsis:</TableCell>
                    <TableCell sx={{ borderBottom: 0 }}>{String(Math.round(fullOrbit.periapsis * 100) / 100).concat("m")}</TableCell>
                </TableRow>
                { Number.isFinite(fullOrbit.apoapsis) && 
                    <TableRow>
                        <TableCell sx={{ borderBottom: 0 }}>Apoapsis:</TableCell>
                        <TableCell sx={{ borderBottom: 0 }}>{String(Math.round(fullOrbit.apoapsis * 100) / 100).concat("m")}</TableCell>
                    </TableRow>
                }
                <TableRow>
                    <TableCell sx={{ borderBottom: 0 }}>Sidereal Period:</TableCell>
                    <TableCell sx={{ borderBottom: 0 }}>{dateString}</TableCell>
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
                    <TableCell sx={{ borderBottom: 0 }}>{String(orbit.epoch).concat("s")}</TableCell>
                </TableRow>
            </TableBody>
        </Table>
    )
}

function OrbitInfoRow({name, orbit}: {name: string, orbit: IOrbit}) {
    const [copiedOrbit, setCopiedOrbit] = useAtom(copiedOrbitAtom);

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
            <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={3} sx={{ borderBottom: 0 }}>
                <Collapse in={open} timeout="auto" unmountOnExit>
                    <Box component="div" sx={{ margin: 1 }}>
                        <OrbitTable orbit={orbit} />
                    </Box>
                </Collapse>
            </TableCell>
        </TableRow>
    </>
    )
}

export default OrbitInfoRow;