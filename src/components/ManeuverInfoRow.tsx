import { useState } from "react";
import { useAtom } from "jotai";
import Table from "@mui/material/Table";
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import CopyButton from './CopyButton'
import Box from "@mui/system/Box";

import Kepler from "../main/libs/kepler";
import { timeToCalendarDate, calendarDateToString } from "../main/libs/math";

import { copiedManeuverAtom, timeSettingsAtom } from "../App";


export function ManeuverTable({maneuver, color=undefined}: {maneuver: Maneuver, color?: string}) {
    const maneuverComponents: ManeuverComponents = Kepler.maneuverToComponents(maneuver);
    return (
        <Table size="small">
            <TableBody>
                <TableRow>
                    <TableCell style={{color: color}} sx={{ borderBottom: 0 }}>Prograde:</TableCell>
                    <TableCell style={{color: color}} sx={{ borderBottom: 0 }}>{String(maneuverComponents.prograde).concat(" m/s")}</TableCell>
                </TableRow>
                <TableRow>
                    <TableCell style={{color: color}} sx={{ borderBottom: 0 }}>Normal:</TableCell>
                    <TableCell style={{color: color}} sx={{ borderBottom: 0 }}>{String(maneuverComponents.normal).concat(" m/s")}</TableCell>
                </TableRow>
                <TableRow>
                    <TableCell style={{color: color}} sx={{ borderBottom: 0 }}>Radial:</TableCell>
                    <TableCell style={{color: color}} sx={{ borderBottom: 0 }}>{String(maneuverComponents.radial).concat(" m/s")}</TableCell>
                </TableRow>
                <TableRow>
                    <TableCell style={{color: color}} sx={{ borderBottom: 0 }}>UT:</TableCell>
                    <TableCell style={{color: color}} sx={{ borderBottom: 0 }}>{String(maneuverComponents.date).concat("s")}</TableCell>
                </TableRow>
            </TableBody>
        </Table>
    )
}

function ManeuverInfoRow({name = undefined, color = undefined, maneuver}: {name?: String, color?: string, maneuver: Maneuver}) {
    const [open, setOpen] = useState(false);
    const [copiedManeuver, setCopiedManeuver] = useAtom(copiedManeuverAtom);
    const [timeSettings] = useAtom(timeSettingsAtom);

    const handleToggle = () => {
        setOpen(!open);
    }

    return (
    <>
        <TableRow>
            <TableCell style={{color: color}} sx={{ borderBottom: 0 }}>
                <IconButton
                    size="small"
                    onClick={ handleToggle }
                    style={{color: color}}
                >
                    {open ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
                </IconButton>
            </TableCell>
            {name &&
                <TableCell style={{color: color}} sx={{ borderBottom: 0 }}>
                    {name}
                </TableCell>
            }
            <TableCell style={{color: color}} sx={{ borderBottom: 0 }}>
                {Number(Math.round(maneuver.deltaVMag * 100) / 100).toLocaleString().concat( " m/s")}
            </TableCell>
            <TableCell style={{color: color}} sx={{ borderBottom: 0 }}>
                {calendarDateToString(timeToCalendarDate(maneuver.preState.date, timeSettings, 1, 1))}
            </TableCell>
            <TableCell style={{color: color}} sx={{ borderBottom: 0 }}>
                <CopyButton obj={Kepler.maneuverToComponents(maneuver)} copiedObj={copiedManeuver} setCopiedObj={setCopiedManeuver}/>
            </TableCell>
        </TableRow>
        <TableRow>
            <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={4} sx={{ borderBottom: 0 }}>
                <Collapse in={open} timeout="auto">
                    <Box component="div" sx={{ margin: 1 }}>
                        <ManeuverTable maneuver={maneuver} color={color}/>
                    </Box>
                </Collapse>
            </TableCell>
        </TableRow>
    </>
    )
}

export default ManeuverInfoRow;