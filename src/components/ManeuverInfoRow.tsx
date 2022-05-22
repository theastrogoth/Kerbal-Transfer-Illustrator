import { useState } from "react";
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


function ManeuverInfoRow({name, maneuver, timeSettings, copiedManeuver, setCopiedManeuver}: {name: String, maneuver: Maneuver, timeSettings: TimeSettings, copiedManeuver: ManeuverComponents, setCopiedManeuver: React.Dispatch<React.SetStateAction<ManeuverComponents>>}) {
    const [open, setOpen] = useState(false);

    const handleToggle = () => {
        setOpen(!open);
    }

    const maneuverComponents: ManeuverComponents = Kepler.maneuverToComponents(maneuver);
    // const maneuverString = JSON.stringify(maneuverComponents);

    return (
    <>
        <TableRow>
            <TableCell sx={{ borderBottom: 0 }}>
                <IconButton
                    size="small"
                    onClick={ handleToggle }
                >
                    {open ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
                </IconButton>
            </TableCell>
            <TableCell sx={{ borderBottom: 0 }}>
                {name}
            </TableCell>
            <TableCell sx={{ borderBottom: 0 }}>
                {String(Math.round(maneuver.deltaVMag * 100) / 100).concat( " m/s")}
            </TableCell>
            <TableCell sx={{ borderBottom: 0 }}>
                {calendarDateToString(timeToCalendarDate(maneuver.preState.date, timeSettings, 1, 1))}
            </TableCell>
            <TableCell sx={{ borderBottom: 0 }}>
                <CopyButton obj={Kepler.maneuverToComponents(maneuver)} copiedObj={copiedManeuver} setCopiedObj={setCopiedManeuver}/>
            </TableCell>
        </TableRow>
        <TableRow>
            <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={4}>
                <Collapse in={open} timeout="auto">
                    <Box sx={{ margin: 1 }}>
                        <Table size="small">
                            <TableBody>
                                <TableRow>
                                    <TableCell sx={{ borderBottom: 0 }}>Prograde:</TableCell>
                                    <TableCell sx={{ borderBottom: 0 }}>{String(maneuverComponents.prograde).concat(" m/s")}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell sx={{ borderBottom: 0 }}>Normal:</TableCell>
                                    <TableCell sx={{ borderBottom: 0 }}>{String(maneuverComponents.normal).concat(" m/s")}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell sx={{ borderBottom: 0 }}>Radial:</TableCell>
                                    <TableCell sx={{ borderBottom: 0 }}>{String(maneuverComponents.radial).concat(" m/s")}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell sx={{ borderBottom: 0 }}>UT:</TableCell>
                                    <TableCell sx={{ borderBottom: 0 }}>{String(maneuverComponents.date).concat(" s")}</TableCell>
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

export default ManeuverInfoRow;