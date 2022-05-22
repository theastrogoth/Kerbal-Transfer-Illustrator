import React, {useState, useEffect} from "react";

import MultiFlyby from "../../main/objects/multiflyby";
import { OrbitingBody } from "../../main/objects/body";
import Color from "../../main/objects/color";
import Draw from "../../main/libs/draw";

import OrbitDisplay, { OrbitDisplayProps } from "../OrbitDisplay";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Grid from "@mui/material/Grid";
import TableContainer from "@mui/material/TableContainer";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";

type OrbitDisplayTabsProps  = {
    multiFlyby:             MultiFlyby,
    timeSettings:           TimeSettings,
    setMultiFlyby:          React.Dispatch<React.SetStateAction<MultiFlyby>>,   
    searchCount:            number,
}

const emptyProps: OrbitDisplayProps[] = [];


function trajectoryTraces(trajectory: Trajectory, trajectoryIdx: number, timeSettings: TimeSettings, orbitName: string = ''): Line3DTrace[] {
    const trajLen = trajectory.orbits.length;

    const orbitTraces: Line3DTrace[] = [];
    for(let i=0; i<trajLen; i++) {
        const orb = trajectory.orbits[i];
        const sTime = trajectory.intersectTimes[i];
        const eTime = trajectory.intersectTimes[i + 1];
        orbitTraces.push(Draw.drawOrbitPathFromTimes(orb, sTime, eTime, timeSettings, new Color({r: 150, g: 150, b: 150}), orbitName + " " + String(trajectoryIdx + 1) + (trajLen > 1 ? (", orbit " + String(i+1)) : ""), false, "solid"));
    }
    return orbitTraces;
}

function transferPlotProps(multiFlyby: MultiFlyby, timeSettings: TimeSettings): OrbitDisplayProps {
    const trajectories = multiFlyby.transfers.slice();
    const orbits = [...trajectories.map((traj) => traj.orbits.slice()).flat()];

    // const startDate = trajectories[0].intersectTimes[0];
    // const endDate   = trajectories[trajectories.length - 1].intersectTimes[trajectories[trajectories.length - 1].orbits.length];
    const startDate = multiFlyby.startDate;
    const endDate = multiFlyby.endDate;

    const systemTraces = Draw.drawSystemAtTime(multiFlyby.transferBody, startDate, timeSettings);
    const orbitTraces = [...trajectories.map((traj,i) => trajectoryTraces(traj, i, timeSettings, 'Transfer leg ')).flat()];
    if(multiFlyby.ejections.length === 0) {
        orbits.push(multiFlyby.startOrbit);
        orbitTraces.push(Draw.drawOrbitPathFromStartTime(multiFlyby.startOrbit, startDate, timeSettings, new Color({r: 255, g: 255, b: 255}), 'Starting Orbit'))
    }
    if(multiFlyby.insertions.length === 0) {
        orbits.push(multiFlyby.endOrbit);
        orbitTraces.push(Draw.drawOrbitPathFromStartTime(multiFlyby.endOrbit, startDate, timeSettings, new Color({r: 255, g: 255, b: 255}), 'Target Orbit'))
    }

    const markerTraces: Marker3DTrace[] = trajectories.map(traj => Draw.drawOrbitPositionMarkerAtTime(traj.orbits[0], startDate));

    const plotSize = multiFlyby.transferBody.orbiters.length === 0 ? multiFlyby.transferBody.soi : 2 * multiFlyby.transferBody.furtherstOrbiterDistance;
    const marks = [
        {
            value: Math.ceil(startDate),
            label: "Departure",
        },
        {
            value: Math.floor(endDate),
            label: "Target Encounter",
        },
    ]

    return {
        index:          0,
        label:          'Transfer Legs',
        marks,
        centralBody:    multiFlyby.transferBody,
        orbits:         orbits,
        trajectories,
        startDate:      startDate,
        endDate:        endDate,
        defaultTraces:  {systemTraces, orbitTraces, markerTraces},
        plotSize,
        timeSettings,
    };
}

function ejectionPlotProps(multiFlyby: MultiFlyby, ejectionIdx: number, timeSettings: TimeSettings): OrbitDisplayProps {
    const trajectory = multiFlyby.ejections[ejectionIdx];
    const trajLen = trajectory.orbits.length;
    const body = multiFlyby.system.bodyFromId(trajectory.orbits[0].orbiting) as OrbitingBody;
    const startDate  = trajectory.intersectTimes[0];
    const endDate = trajectory.intersectTimes[trajLen];
    const orbits = trajectory.orbits.slice();

    const systemTraces = Draw.drawSystemAtTime(body, startDate, timeSettings);    
    const orbitTraces = trajectoryTraces(trajectory, 0, timeSettings, body.name+' Ejection ');
    const markerTraces = [Draw.drawOrbitPositionMarkerAtTime(trajectory.orbits[0], startDate)];
    if(ejectionIdx === 0) {
        orbits.push(multiFlyby.startOrbit);
        orbitTraces.push(Draw.drawOrbitPathFromStartTime(multiFlyby.startOrbit, startDate, timeSettings, new Color({r: 255, g: 255, b: 255}), 'Starting Orbit'))
    }

    const plotSize = body.orbiters.length === 0 ? body.soi : Math.min(body.soi, 2 * body.furtherstOrbiterDistance);
    const marks = [
        {
            value: Math.ceil(startDate),
            label: "Departure Burn",
        },
        {
            value: Math.floor(endDate),
            label: "SoI Escape",
        },
    ]
    return {
        index:          ejectionIdx - multiFlyby.ejections.length,
        marks,
        label:          body.name + ' Departure',
        centralBody:    body,
        orbits,
        trajectories:   [trajectory],
        startDate:      startDate,
        endDate:        endDate,
        defaultTraces:  {systemTraces, orbitTraces, markerTraces},
        plotSize,
        timeSettings,
    };
}

function insertionPlotProps(multiFlyby: MultiFlyby, insertionIdx: number, timeSettings: TimeSettings): OrbitDisplayProps {
    const trajectory = multiFlyby.insertions[insertionIdx];
    const trajLen = trajectory.orbits.length;
    const body = multiFlyby.system.bodyFromId(trajectory.orbits[0].orbiting) as OrbitingBody;
    const startDate  = trajectory.intersectTimes[0];
    const endDate = trajectory.intersectTimes[trajLen];
    const orbits = trajectory.orbits.slice();

    const systemTraces = Draw.drawSystemAtTime(body, startDate, timeSettings);    
    const orbitTraces = trajectoryTraces(trajectory, 0, timeSettings, body.name+' Insertion ');
    const markerTraces = [Draw.drawOrbitPositionMarkerAtTime(trajectory.orbits[0], startDate)];
    if(insertionIdx === multiFlyby.insertions.length - 1) {
        orbits.push(multiFlyby.endOrbit);
        orbitTraces.push(Draw.drawOrbitPathFromStartTime(multiFlyby.endOrbit, endDate, timeSettings, new Color({r: 255, g: 255, b: 255}), 'Target Orbit'))
    }

    const plotSize = body.orbiters.length === 0 ? body.soi : Math.min(body.soi, 2 * body.furtherstOrbiterDistance);
    const marks = [
        {
            value: Math.ceil(startDate),
            label: "SoI Encounter",
        },
        {
            value: Math.floor(endDate),
            label: "Arrival Burn",
        },
    ]
    return {
        index:          multiFlyby.flybyIdSequence.length + insertionIdx + 1,
        marks,
        label:          body.name + ' Arrival',
        centralBody:    body,
        orbits,
        trajectories:   [trajectory],
        startDate:      startDate,
        endDate:        endDate,
        defaultTraces:  {systemTraces, orbitTraces, markerTraces},
        plotSize,
        timeSettings,
    };
}

function flybyPlotProps(multiFlyby: MultiFlyby, flybyIdx: number, timeSettings: TimeSettings): OrbitDisplayProps {
    const trajectory = multiFlyby.flybys[flybyIdx];
    const trajLen = trajectory.orbits.length;
    const body = multiFlyby.system.bodyFromId(trajectory.orbits[0].orbiting) as OrbitingBody;
    const startDate = trajectory.intersectTimes[0];
    const midDate = trajectory.intersectTimes[1];
    const endDate = trajectory.intersectTimes[trajLen];
    const orbits = trajectory.orbits.slice();

    const systemTraces = Draw.drawSystemAtTime(body, startDate, timeSettings);    
    const orbitTraces = trajectoryTraces(trajectory, 0, timeSettings, body.name+' Flyby ');
    const markerTraces = [Draw.drawOrbitPositionMarkerAtTime(trajectory.orbits[0], startDate)];
    
    const plotSize = body.orbiters.length === 0 ? body.soi : Math.min(body.soi, 2 * body.furtherstOrbiterDistance);
    const marks = [
        {
            value: Math.ceil(startDate),
            label: "SoI Encounter",
        },
        {
            value: Math.round(midDate),
            label: "Flyby Burn",
        },
        {
            value: Math.floor(endDate),
            label: "SoI Escape",
        },
    ]
    return {
        index:          flybyIdx + 1,
        marks,
        label:          body.name + " Flyby",
        centralBody:    body,
        orbits,
        trajectories:   [trajectory],
        startDate:      startDate,
        endDate:        endDate,
        defaultTraces:  {systemTraces, orbitTraces, markerTraces},
        plotSize,
        timeSettings,
    };
}

export function prepareAllDisplayProps(multiFlyby: MultiFlyby, timeSettings: TimeSettings) {
    const orbDisplayProps: OrbitDisplayProps[] = [];    

    for(let i=0; i<multiFlyby.ejections.length; i++) {
        orbDisplayProps.push(ejectionPlotProps(multiFlyby, i, timeSettings));
    }

    orbDisplayProps.push(transferPlotProps(multiFlyby, timeSettings));

    for(let i=0; i<multiFlyby.flybys.length; i++) {
        orbDisplayProps.push(flybyPlotProps(multiFlyby, i, timeSettings));
    }
    for(let i=0; i<multiFlyby.insertions.length; i++) {
        orbDisplayProps.push(insertionPlotProps(multiFlyby, i, timeSettings));
    }

    console.log('...Orbit plot traces computed from trajectory.')
    return orbDisplayProps;
} 

const OrbitTabPanel = React.memo(function WrappedOrbitTabPanel({value, index, props}: {value: number, index: number, props: OrbitDisplayProps}) {
    const [orbitPlotProps, setOrbitPlotProps] = useState(props);

    useEffect(() => {
        // console.log('Update Orbit Tab '.concat(String(index)).concat(' with new props.'));
        setOrbitPlotProps(props);
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [props]);

    useEffect(() => {
        if(value === index) {
            window.dispatchEvent(new Event('resize'));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value])

    return (
        <div style={{ display: (value === index ? 'block' : 'none'), width: "100%", height: "100%" }}>
            <OrbitDisplay {...orbitPlotProps}/>
        </div>
    )
});

const multiFlybyOptWorker = new Worker(new URL("../../workers/multi-flyby-optimizer.worker.ts", import.meta.url));

function OrbitDisplayTabs({multiFlyby, timeSettings, setMultiFlyby, searchCount}: OrbitDisplayTabsProps) {
    const [value, setValue] = useState(0);
    const [refined, setRefined] = useState(false);
    const [calculating, setCalculating] = useState(false);

    const [orbitDisplayProps, setOrbitDisplayProps] = useState(emptyProps);

    useEffect(() => {
        multiFlybyOptWorker.onmessage = (event: MessageEvent<IMultiFlyby>) => {
            if (event && event.data) {
                console.log('...Patch optimization worker returned a new multiFlyby')
                setRefined(true);
                setCalculating(false);
                setMultiFlyby(new MultiFlyby(event.data));
            }
        }        
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [multiFlybyOptWorker]);

    function handleRefineButtonPress() {
        console.log('Starting SoI patch optimization worker...')
        setCalculating(true);
        multiFlybyOptWorker
            .postMessage(multiFlyby);   
    }

    useEffect(() => {
        console.log('Updating Orbit plots with a new trajectory...')
        if(value < -multiFlyby.ejections.length || value > multiFlyby.flybys.length + multiFlyby.insertions.length) {
            setValue(0);
        }
        setOrbitDisplayProps(prepareAllDisplayProps(multiFlyby, timeSettings));
      // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [multiFlyby]);

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
        console.log('Orbit plot tab '.concat(String(newValue)).concat(' selected.'));
    }

    return (
        <>
            <Tabs value={value} onChange={handleChange} variant="scrollable" scrollButtons={true}>
                {orbitDisplayProps.map((props, index) => <Tab key={index} value={props.index} label={props.label} ></Tab>)}
            </Tabs>
            {orbitDisplayProps.map((props, index) => <OrbitTabPanel key={index} value={value} index={props.index} props={props}/>)}
            {searchCount > 0 &&
            <Box textAlign='center'>
                <Button 
                    variant="contained" 
                    disabled={calculating}
                    onClick={() => handleRefineButtonPress()}
                    sx={{ mx: 'auto', my: 4 }}
                >
                    Refine Trajectory
                    {calculating &&
                    <CircularProgress
                        size={24}
                        sx={{
                        position: 'relative',
                        left: '10px',
                        }}
                    />
                    }
                </Button>
                {refined &&
                <Grid container justifyContent='center'>
                    <Grid item xs={12} sm={10} md={8}>
                        <TableContainer>
                            <Table>
                                <TableBody>
                                    <TableRow>
                                        <TableCell width="50%" align="right">SoI Patch Position Error:</TableCell>
                                        <TableCell>{String(Math.round(multiFlyby.patchPositionError * 1000) / 1000).concat(" m")}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell width="50%" align="right">SoI Patch Time Error:</TableCell>
                                        <TableCell>{String(Math.round(multiFlyby.patchTimeError * 1000000) / 1000000).concat(" s")}</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                    </TableContainer>
                    </Grid>
                </Grid>
                }
            </Box>
            }
        </>
    )
}

export default React.memo(OrbitDisplayTabs);