import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack';
import Popper from '@mui/material/Popper';
import Fade from '@mui/material/Fade';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Typography from '@mui/material/Typography';
import Table from "@mui/material/Table";
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';

import { useResizeDetector } from 'react-resize-detector';
import { useContainerDimensions } from '../../utils';
import OrbitInfoRow from '../OrbitInfoRow';
import ManeuverInfoRow from '../ManeuverInfoRow';
import BodyInfoRow from '../BodyInfoRow';

import CelestialBody from '../../main/objects/body';
import { calendarDateToString, timeToCalendarDate } from '../../main/libs/math';

import { timeSettingsAtom } from '../../App';
import { useAtom } from 'jotai';

const defaultColor: IColor = {r:255,g:255,b:255};
const getClearColor = (color: IColor) => 'rgba('+String(color.r)+","+String(color.g)+","+String(color.b)+",0.075)";

const getTitle = (info: InfoItem) => {
    if(info === null) {
        return "";
    }else if(info.hasOwnProperty('name')) {
        return (info as IVessel | ICelestialBody | IOrbitingBody | SoiChangeInfo | ManeuverInfo).name;
    } else {
        return "";
    }
}

const getContent = (info: InfoItem, timeSettings: TimeSettings) => {
    if(!info) {
        return <></>;
    } else if(info.hasOwnProperty('preState')) {
        return <Table>
            <TableBody>
                <ManeuverInfoRow maneuver={info as Maneuver} />
            </TableBody>
        </Table>;
    } else if(info.hasOwnProperty('pos')) {
        const dateString = calendarDateToString(timeToCalendarDate((info as SoiChangeInfo).date, timeSettings, 1, 1))
        return <Table>
            <TableBody>
                <TableRow>
                    <TableCell sx={{ borderBottom: 0 }}>Date:</TableCell>
                    <TableCell sx={{ borderBottom: 0 }}>{dateString}</TableCell>
                </TableRow>
            </TableBody>
        </Table>;
    } else if(info.hasOwnProperty('maneuvers')) {
        const vesselInfo = info as IVessel;
        return <Table>
            <TableBody>
                <OrbitInfoRow name='Orbit' orbit={vesselInfo.orbit} />
            </TableBody>
        </Table>;
    } else if(info.hasOwnProperty('orbiting')) {
        const orbitingBodyInfo = info as IOrbitingBody;
        return <Table>
            <TableBody>
                <BodyInfoRow body={new CelestialBody(orbitingBodyInfo)} />
                <OrbitInfoRow name='Orbit' orbit={orbitingBodyInfo.orbit} />
            </TableBody>
        </Table>;
    } else if(info.hasOwnProperty('radius')) {
        return <Table>
            <TableBody>
                <BodyInfoRow body={new CelestialBody(info as ICelestialBody)} />
            </TableBody>
        </Table>;
    } else {
        return <></>;
    }
}

function InfoPopper({info, setInfo, parentRef, color=defaultColor}: {info: InfoItem, setInfo: React.Dispatch<React.SetStateAction<InfoItem>>, parentRef: React.MutableRefObject<null | HTMLElement>, color?: IColor}) {
    const {width, ref} = useResizeDetector();
    const parentDimensions = useContainerDimensions(parentRef);

    const [timeSettings] = useAtom(timeSettingsAtom);

    const [title, setTitle] = useState(getTitle(info))
    const [content, setContent] = useState(getContent(info, timeSettings));

    const [clearColor, setClearColor] = useState(getClearColor(color));


    useEffect(() => {
        if(info !== null) {
            setTitle(getTitle(info));
            setContent(getContent(info, timeSettings));
            const newColor: IColor = (info.hasOwnProperty('color')) ? (info as ICelestialBody | IOrbitingBody | IVessel | ManeuverInfo | SoiChangeInfo).color || defaultColor : defaultColor; 
            setClearColor(getClearColor(newColor)); 
        }
    }, [info, timeSettings])

    const maxWidth = parentDimensions.width * 0.4;
    const maxHeight = 400;

    return (
        <Popper 
            open={info !== null} 
            transition anchorEl={parentRef.current} 
            placement={'right-start'} 
            modifiers={[
                {
                    name: "offset",
                    options: {
                        offset: [15, -Math.min(width || maxWidth, maxWidth) - 30]
                    }
                },
                {
                    name: 'flip',
                    enabled: false,
                }
            ]}
        >
            {({ TransitionProps }) => (
            <Fade {...TransitionProps} timeout={350}>
                <Stack ref={ref} sx={{ p: 1, bgcolor: clearColor, borderRadius: 10, width: maxWidth, maxHeight: maxHeight, overflowY: 'auto', overflowX: 'clip' }}>
                    <Stack direction="row">
                        <Box component="div" sx={{ p: 1 }}>
                        <Typography variant="body1">
                            {title}
                        </Typography>
                        </Box>
                        <Box component="div" flexGrow={1} />
                        <Box component="div" sx={{float: "right"}}>
                            <IconButton size="small" onClick={() => setInfo(null)}>
                                <CloseIcon />
                            </IconButton>
                        </Box>
                    </Stack>
                    {content}
                </Stack>
            </Fade>
            )}
        </Popper>
    )
}

export default InfoPopper;