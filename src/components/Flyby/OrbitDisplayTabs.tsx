import React, {useState, useEffect, useRef} from "react";

import MultiFlyby from "../../main/objects/multiflyby";
import { OrbitingBody } from "../../main/objects/body";

import OrbitDisplay, { OrbitDisplayProps } from "../OrbitDisplay2";

import Box from "@mui/material/Box";
import LoadingButton from "@mui/lab/LoadingButton";
import CalculateIcon from '@mui/icons-material/Calculate';
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Grid from "@mui/material/Grid";
import TableContainer from "@mui/material/TableContainer";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";

import { useAtom } from "jotai";
import { multiFlybyAtom, timeSettingsAtom } from "../../App";

const emptyProps: OrbitDisplayProps[] = [];

function transferPlotProps(multiFlyby: MultiFlyby): OrbitDisplayProps {
    const trajectories = multiFlyby.transfers.slice();
    const startDate = multiFlyby.startDate;
    const endDate = multiFlyby.endDate;

    if(multiFlyby.ejections.length === 0 && multiFlyby.transfers.length > 0) {
        trajectories.push({orbits: [multiFlyby.startOrbit], intersectTimes: [-Infinity, startDate], maneuvers: []});
    }
    if(multiFlyby.insertions.length === 0 && multiFlyby.transfers.length > 0) {
        trajectories.push({orbits: [multiFlyby.endOrbit], intersectTimes: [endDate, Infinity], maneuvers: []});
    }

    const trajectoryIcons = trajectories.map(trajectory => {
        const maneuver: number[] = [];
        const soi: number[] =[];

        for(let i=1; i<trajectory.intersectTimes.length-1; i++) {
            if(Number.isFinite(trajectory.intersectTimes[i])) {
                maneuver.push(i);
            }
        }
        if(Number.isFinite(trajectory.intersectTimes[0])) {
            soi.push(0)
        }
        if(Number.isFinite(trajectory.intersectTimes[trajectory.intersectTimes.length-1])) {
            soi.push(trajectory.intersectTimes.length-1)
        }

        return {maneuver, soi};
    })

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
        system:         multiFlyby.system,
        trajectories,
        startDate:      startDate,
        endDate:        endDate,
        slider:         true,
        trajectoryIcons,
    };
}

function ejectionPlotProps(multiFlyby: MultiFlyby, ejectionIdx: number): OrbitDisplayProps {
    const trajectory = multiFlyby.ejections[ejectionIdx];
    const trajectories = [trajectory];
    const trajLen = trajectory.orbits.length;
    const body = multiFlyby.system.bodyFromId(trajectory.orbits[0].orbiting) as OrbitingBody;
    const startDate  = trajectory.intersectTimes[0];
    const endDate = trajectory.intersectTimes[trajLen];

    const soiIcons: number[] = [];
    const maneuverIcons: number[] = [];
    const trajectoryIcons = [{maneuver: maneuverIcons, soi: soiIcons}];

    if(ejectionIdx === 0) {
        trajectories.unshift({orbits: [multiFlyby.startOrbit], intersectTimes: [-Infinity, startDate], maneuvers: []});
        trajectoryIcons.unshift({maneuver: [], soi: []});
        if(trajectory.maneuvers.length > 0) {
            maneuverIcons.push(0);
        }
    } else {
        soiIcons.push(0);
    }
    soiIcons.push(trajectory.intersectTimes.length-1)

    for(let i=1; i<trajectory.intersectTimes.length-1; i++) {
        maneuverIcons.push(i);
    }

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
        system:         multiFlyby.system,
        trajectories,
        startDate:      startDate,
        endDate:        endDate,
        slider:         true,
        trajectoryIcons,
    };
}

function insertionPlotProps(multiFlyby: MultiFlyby, insertionIdx: number): OrbitDisplayProps {
    const trajectory = multiFlyby.insertions[insertionIdx];
    const trajectories = [trajectory];
    const trajLen = trajectory.orbits.length;
    const body = multiFlyby.system.bodyFromId(trajectory.orbits[0].orbiting) as OrbitingBody;
    const startDate  = trajectory.intersectTimes[0];
    const endDate = trajectory.intersectTimes[trajLen];

    const soiIcons: number[] = [];
    const maneuverIcons: number[] = [];
    const trajectoryIcons = [{maneuver: maneuverIcons, soi: soiIcons}];

    soiIcons.push(0);
    for(let i=1; i<trajectory.intersectTimes.length-1; i++) {
        maneuverIcons.push(i);
    }

    if(insertionIdx === multiFlyby.insertions.length - 1) {
        trajectories.push({orbits: [multiFlyby.endOrbit], intersectTimes: [endDate, Infinity], maneuvers: []});
        trajectoryIcons.push({maneuver: [], soi: []});
        if(trajectory.maneuvers.length > 0) {
            maneuverIcons.push(trajectory.intersectTimes.length-1)        
        }
    } else {
        soiIcons.push(trajectory.intersectTimes.length-1)
    }

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
        system:         multiFlyby.system,
        trajectories,
        startDate:      startDate,
        endDate:        endDate,
        slider:         true,
        trajectoryIcons,
    };
}

function flybyPlotProps(multiFlyby: MultiFlyby, flybyIdx: number): OrbitDisplayProps {
    const trajectory = multiFlyby.flybys[flybyIdx];
    const trajLen = trajectory.orbits.length;
    const body = multiFlyby.system.bodyFromId(trajectory.orbits[0].orbiting) as OrbitingBody;
    const startDate = trajectory.intersectTimes[0];
    const midDate = trajectory.intersectTimes[1];
    const endDate = trajectory.intersectTimes[trajLen];

    const soiIcons: number[] = [];
    const maneuverIcons: number[] = [];
    const trajectoryIcons = [{maneuver: maneuverIcons, soi: soiIcons}];

    soiIcons.push(0, trajectory.intersectTimes.length - 1);
    maneuverIcons.push(1);
    
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
        system:         multiFlyby.system,
        trajectories:   [trajectory],
        startDate:      startDate,
        endDate:        endDate,
        slider:         true,
        trajectoryIcons,
    };
}

export function prepareAllDisplayProps(multiFlyby: MultiFlyby) {
    const orbDisplayProps: OrbitDisplayProps[] = [];    

    for(let i=0; i<multiFlyby.ejections.length; i++) {
        orbDisplayProps.push(ejectionPlotProps(multiFlyby, i));
    }

    orbDisplayProps.push(transferPlotProps(multiFlyby));

    for(let i=0; i<multiFlyby.flybys.length; i++) {
        orbDisplayProps.push(flybyPlotProps(multiFlyby, i));
    }
    for(let i=0; i<multiFlyby.insertions.length; i++) {
        orbDisplayProps.push(insertionPlotProps(multiFlyby, i));
    }

    // console.log('...Orbit plot traces computed from trajectory.')
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

function OrbitDisplayTabs() {
    const [multiFlyby, setMultiFlyby] = useAtom(multiFlybyAtom);

    const [timeSettings] = useAtom(timeSettingsAtom);
    const timeSettingsRef = useRef(timeSettings);

    const [value, setValue] = useState(0);
    const valueRef = useRef(value);

    const [refined, setRefined] = useState(false);
    const [calculating, setCalculating] = useState(false);

    const [orbitDisplayProps, setOrbitDisplayProps] = useState(emptyProps);

    useEffect(() => {
        multiFlybyOptWorker.onmessage = (event: MessageEvent<IMultiFlyby>) => {
            if (event && event.data) {
                // console.log('...Patch optimization worker returned a new multiFlyby')
                setRefined(true);
                setCalculating(false);
                setMultiFlyby(new MultiFlyby(event.data));
            }
        }        
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [multiFlybyOptWorker]);

    function handleRefineButtonPress() {
        console.log('Optimizing SoI patches')
        setCalculating(true);
        multiFlybyOptWorker
            .postMessage(multiFlyby);   
    }

    useEffect(() => {
        if(value !== valueRef.current) {
            valueRef.current = value;
        } else if(timeSettings !== timeSettingsRef.current) {
            timeSettingsRef.current = timeSettings;
        } else {
            console.log('Updating Orbit plots with a new multi-flyby')
            if(value < -multiFlyby.ejections.length || value > multiFlyby.flybys.length + multiFlyby.insertions.length) {
                setValue(0);
            }
            setOrbitDisplayProps(prepareAllDisplayProps(multiFlyby));
        }
        // hide warning for missing setters
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [multiFlyby, timeSettings, value]);

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
        // console.log('Orbit plot tab '.concat(String(newValue)).concat(' selected.'));
    }

    return (
        <>
            <Tabs value={value} onChange={handleChange} variant="scrollable" scrollButtons={true}>
                {orbitDisplayProps.map((props, index) => <Tab key={index} value={props.index} label={props.label} ></Tab>)}
            </Tabs>
            {orbitDisplayProps.map((props, index) => <OrbitTabPanel key={index} value={value} index={props.index} props={props}/>)}
            {multiFlyby.deltaV > 0 &&
            <Box component="div" textAlign='center'>
                <LoadingButton 
                    variant="contained" 
                    loadingPosition="end"
                    endIcon={<CalculateIcon />}
                    loading={calculating}
                    onClick={() => handleRefineButtonPress()}
                    sx={{ mx: 'auto', my: 4 }}
                >
                    Refine Trajectory
                </LoadingButton>
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