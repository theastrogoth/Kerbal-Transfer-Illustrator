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

import CelestialBody from "../main/objects/body";
import { calendarDateToDurationString, timeToCalendarDate } from "../main/libs/math";

import { useAtom } from "jotai";
import { timeSettingsAtom } from "../App";


export function BodyTable({body, color = undefined}: {body: CelestialBody, color?: string}) {
    const [timeSettings] = useAtom(timeSettingsAtom);
    return (
        <Table size="small">
            <TableBody>
                <TableRow>
                    <TableCell style={{color: color}} sx={{ borderBottom: 0 }}>Radius:</TableCell>
                    <TableCell style={{color: color}} sx={{ borderBottom: 0 }}>{Number(Math.round(body.radius * 100) / 100000).toLocaleString().concat(" km")}</TableCell>
                </TableRow>
                <TableRow>
                    <TableCell style={{color: color}} sx={{ borderBottom: 0 }}>Mass:</TableCell>
                    <TableCell style={{color: color}} sx={{ borderBottom: 0 }}>{(String(body.mass).includes('e') ? String(Math.round(body.mass * 100) / 100) : Number(Math.round(body.mass * 100) / 100).toLocaleString()).concat(" kg")}</TableCell>
                </TableRow>
                <TableRow>
                    <TableCell style={{color: color}} sx={{ borderBottom: 0 }}>Rotation Period:</TableCell>
                    <TableCell style={{color: color}} sx={{ borderBottom: 0 }}>{calendarDateToDurationString(timeToCalendarDate(body.rotationPeriod, timeSettings, 0, 0))}</TableCell>
                </TableRow>
                <TableRow>
                    <TableCell style={{color: color}} sx={{ borderBottom: 0 }}>Surface Gravity:</TableCell>
                    <TableCell style={{color: color}} sx={{ borderBottom: 0 }}>{Number(Math.round(body.geeASL * 9.80655 * 1000) / 1000).toLocaleString().concat(" m/s")}</TableCell>
                </TableRow>
                { body.soi && 
                    <TableRow>
                        <TableCell style={{color: color}} sx={{ borderBottom: 0 }}>Sphere of Influence:</TableCell>
                        <TableCell style={{color: color}} sx={{ borderBottom: 0 }}>{Number(Math.round(body.soi as number * 100) / 100000).toLocaleString().concat(" km")}</TableCell>
                    </TableRow>
                }
                { body.atmosphereHeight > 0 &&
                    <TableRow>
                        <TableCell style={{color: color}} sx={{ borderBottom: 0 }}>Atmosphere Height:</TableCell>
                        <TableCell style={{color: color}} sx={{ borderBottom: 0 }}>{Number(Math.round(body.atmosphereHeight) / 100).toLocaleString().concat(" m")}</TableCell>
                    </TableRow>
                }
            </TableBody>
        </Table>
    )
}

function BodyInfoRow({name = 'Physical Characteristics', color = undefined, body}: {name?: string, color?: string, body: CelestialBody}) {
    const [open, setOpen] = useState(false);

    const handleToggle = () => {
        setOpen(!open);
    }

    return (
    <>
        <TableRow >
            <TableCell style={{color: color}} sx={{ borderBottom: 0 }}>
                <IconButton
                    size="small"
                    onClick={ handleToggle }
                >
                    {open ? <ArrowDropUpIcon style={{color: color}} /> : <ArrowDropDownIcon style={{color: color}} />}
                </IconButton>
            </TableCell>
            <TableCell style={{color: color}} sx={{ borderBottom: 0}}>{name}</TableCell>
        </TableRow>
        <TableRow>
            <TableCell style={{ paddingBottom: 0, paddingTop: 0, color: color}} colSpan={3} sx={{ borderBottom: 0 }}>
                <Collapse in={open} timeout="auto" unmountOnExit>
                    <Box component="div" sx={{ margin: 1 }}>
                        <BodyTable body={body} color={color} />
                    </Box>
                </Collapse>
            </TableCell>
        </TableRow>
    </>
    )
}

export default BodyInfoRow;