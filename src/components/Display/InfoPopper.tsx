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

import SolarSystem from '../../main/objects/system';
import CelestialBody from '../../main/objects/body';
import Kepler from '../../main/libs/kepler';
import Trajectories from '../../main/libs/trajectories';
import { calendarDateToString, mag3, timeToCalendarDate } from '../../main/libs/math';

import { timeSettingsAtom } from '../../App';
import { PrimitiveAtom, useAtom } from 'jotai';


const defaultColor: IColor = {r:255,g:255,b:255};
const getClearColor = (color: IColor) => 'rgba('+String(color.r)+","+String(color.g)+","+String(color.b)+",0.075)";

const getTitle = (info: InfoItem) => {
    if(info === null) {
        return "";
    }else if(info.hasOwnProperty('name')) {
        return (info as IVessel | ICelestialBody | IOrbitingBody | OrbitInfo | SoiChangeInfo | ManeuverInfo).name;
    } else {
        return "";
    }
}

const getContent = (info: InfoItem, timeSettings: TimeSettings, system: SolarSystem) => {
    if(!info) {
        return <></>;
    } else if(info.hasOwnProperty('preState')) {
        return <Table>
            <TableBody>
                <ManeuverInfoRow maneuver={info as Maneuver} color={'white'} />
            </TableBody>
        </Table>;
    } else if(info.hasOwnProperty('pos')) {
        const dateString = calendarDateToString(timeToCalendarDate((info as SoiChangeInfo).date, timeSettings, 1, 1))
        return <Table>
            <TableBody>
                <TableRow>
                    <TableCell style={{color: 'white'}} sx={{ borderBottom: 0 }}>Date:</TableCell>
                    <TableCell style={{color: 'white'}} sx={{ borderBottom: 0 }}>{dateString}</TableCell>
                </TableRow>
            </TableBody>
        </Table>;
    } else if(info.hasOwnProperty('trajectories')) {
        const flightPlan = info as FlightPlanInfo;
        const date = flightPlan.date;
        const orbit = Trajectories.currentOrbitForFlightPlan(flightPlan, date) as IOrbit;
        const attractor = system.bodyFromId(orbit.orbiting);
        const state = Kepler.orbitToStateAtDate(orbit, attractor, date);
        const altitude = mag3(state.pos) - attractor.radius;
        const speed = mag3(state.vel);
        return <Table>
            <TableBody>
                <TableRow>
                    <TableCell style={{color: 'white'}} sx={{ borderBottom: 0 }}>Altitude:</TableCell>
                    <TableCell style={{color: 'white'}} sx={{ borderBottom: 0 }}>{Number(altitude / 1000).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}).concat(" km")}</TableCell>
                </TableRow>
                <TableRow>
                    <TableCell style={{color: 'white'}} sx={{ borderBottom: 0 }}>Speed:</TableCell>
                    <TableCell style={{color: 'white'}} sx={{ borderBottom: 0 }}>{Number(Math.round(speed * 100 )/ 100).toLocaleString().concat(" m/s")}</TableCell>
                </TableRow>
                <OrbitInfoRow name='Orbit' color="white" orbit={orbit} />
            </TableBody>
        </Table>;
    } else if(info.hasOwnProperty('eccentricity')) {
        const orbitInfo = info as OrbitInfo;
        return <Table>
            <TableBody>
                <OrbitInfoRow name='Orbit' color="white" orbit={orbitInfo} />
            </TableBody>
        </Table>;
    } else if(info.hasOwnProperty('orbiting')) {
        const orbitingBodyInfo = info as IOrbitingBody;
        return <Table>
            <TableBody>
                <BodyInfoRow color="white" body={new CelestialBody(orbitingBodyInfo)} />
                <OrbitInfoRow name='Orbit' color="white" orbit={orbitingBodyInfo.orbit} />
            </TableBody>
        </Table>;
    } else if(info.hasOwnProperty('radius')) {
        return <Table>
            <TableBody>
                <BodyInfoRow color="white" body={new CelestialBody(info as ICelestialBody)} />
            </TableBody>
        </Table>;
    } else {
        return <></>;
    }
}

function InfoPopper({infoItemAtom, parentRef, system, color=defaultColor}: {infoItemAtom: PrimitiveAtom<InfoItem>, parentRef: React.MutableRefObject<null | HTMLElement>, system: SolarSystem, color?: IColor}) {
    const [info, setInfo] = useAtom(infoItemAtom);
    const {width, ref} = useResizeDetector();
    const parentDimensions = useContainerDimensions(parentRef);

    const [timeSettings] = useAtom(timeSettingsAtom);

    const [title, setTitle] = useState(getTitle(info))
    const [content, setContent] = useState(getContent(info, timeSettings, system));

    const [clearColor, setClearColor] = useState(getClearColor(color));

    useEffect(() => {
        if(info !== null) {
            setTitle(getTitle(info));
            setContent(getContent(info, timeSettings, system));
            const newColor: IColor = (info.hasOwnProperty('color')) ? (info as ICelestialBody | IOrbitingBody | IVessel | OrbitInfo | ManeuverInfo | SoiChangeInfo).color || defaultColor : defaultColor; 
            setClearColor(getClearColor(newColor)); 
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [info, timeSettings])

    useEffect(() => {
        setInfo(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [system])

    const maxWidth = parentDimensions.width * 0.5;
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
                        <Typography variant="body1" style={{color: 'white'}}>
                            {title}
                        </Typography>
                        </Box>
                        <Box component="div" flexGrow={1} />
                        <Box component="div" sx={{float: "right"}}>
                            <IconButton size="small" onClick={() => setInfo(null)}>
                                <CloseIcon style={{color: 'white'}}/>
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