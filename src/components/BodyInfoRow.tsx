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

export function BodyTable({body}: {body: CelestialBody}) {
    return (
        <Table size="small">
            <TableBody>
                <TableRow>
                    <TableCell sx={{ borderBottom: 0 }}>Radius:</TableCell>
                    <TableCell sx={{ borderBottom: 0 }}>{String(body.radius).concat("m")}</TableCell>
                </TableRow>
                <TableRow>
                    <TableCell sx={{ borderBottom: 0 }}>Mass:</TableCell>
                    <TableCell sx={{ borderBottom: 0 }}>{String(body.mass).concat("kg")}</TableCell>
                </TableRow>
                <TableRow>
                    <TableCell sx={{ borderBottom: 0 }}>Rotation Period:</TableCell>
                    <TableCell sx={{ borderBottom: 0 }}>{String(body.rotationPeriod).concat("s")}</TableCell>
                </TableRow>
                <TableRow>
                    <TableCell sx={{ borderBottom: 0 }}>Surface Gravity:</TableCell>
                    <TableCell sx={{ borderBottom: 0 }}>{String(body.geeASL).concat(" gees")}</TableCell>
                </TableRow>
                { body.soi && 
                    <TableRow>
                        <TableCell sx={{ borderBottom: 0 }}>Sphere of Influence:</TableCell>
                        <TableCell sx={{ borderBottom: 0 }}>{String(body.soi as number).concat("m")}</TableCell>
                    </TableRow>
                }
                { body.atmosphereHeight > 0 &&
                    <TableRow>
                        <TableCell sx={{ borderBottom: 0 }}>Atmosphere Height:</TableCell>
                        <TableCell sx={{ borderBottom: 0 }}>{String(body.atmosphereHeight).concat("m")}</TableCell>
                    </TableRow>
                }
            </TableBody>
        </Table>
    )
}

function BodyInfoRow({name = 'Physical Characteristics', body}: {name?: string, body: CelestialBody}) {
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
        </TableRow>
        <TableRow>
            <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={3} sx={{ borderBottom: 0 }}>
                <Collapse in={open} timeout="auto" unmountOnExit>
                    <Box component="div" sx={{ margin: 1 }}>
                        <BodyTable body={body} />
                    </Box>
                </Collapse>
            </TableCell>
        </TableRow>
    </>
    )
}

export default BodyInfoRow;