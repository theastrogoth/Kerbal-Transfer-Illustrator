import React, { useState, useEffect, useRef } from "react";

import { OrbitingBody } from "../../main/objects/body";
import Transfer from "../../main/objects/transfer";

import OrbitDisplay, { OrbitDisplayProps } from "../OrbitDisplay2";

import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import LoadingButton from "@mui/lab/LoadingButton";
import CalculateIcon from '@mui/icons-material/Calculate';
import TableContainer from "@mui/material/TableContainer";
import Table from "@mui/material/Table";
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Grid from "@mui/material/Grid";

import { useAtom } from "jotai";
import { transferAtom, timeSettingsAtom } from "../../App";


const emptyProps: OrbitDisplayProps[] = [];

function transferPlotProps(transfer: Transfer): OrbitDisplayProps {
    const trajectories = [transfer.transferTrajectory];
    const centralBody = transfer.transferBody;
    const system = transfer.system;
    const startDate = transfer.startDate;
    const endDate = transfer.endDate;

    if(transfer.ejections.length === 0) {
        trajectories.push({orbits: [transfer.startOrbit], intersectTimes: [-Infinity, startDate], maneuvers: []});
    }
    if(transfer.insertions.length === 0) {
        trajectories.push({orbits: [transfer.endOrbit], intersectTimes: [endDate, Infinity], maneuvers: []});
    }

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
        label:  'Transfer',
        index:  0,
        centralBody,
        system,
        startDate,
        endDate,
        trajectories,
        slider: true,
        marks,
    }
}

function ejectionPlotProps(transfer: Transfer, ejectionIdx: number): OrbitDisplayProps {
    const trajectory = transfer.ejections[ejectionIdx];
    const trajectories = [trajectory];
    const trajLen = trajectory.orbits.length;
    const centralBody  = transfer.system.bodyFromId(trajectory.orbits[0].orbiting) as OrbitingBody;
    const system = transfer.system;
    const startDate  = trajectory.intersectTimes[0];
    const endDate = trajectory.intersectTimes[trajLen];

    if(ejectionIdx === 0) {
        console.log("add starting orbit to ejection")
        trajectories.push({orbits: [transfer.startOrbit], intersectTimes: [-Infinity, startDate], maneuvers: []});
    }

    const marks = [
        {
            value: Math.ceil(startDate),
            label: "Ejection Start",
        },
        {
            value: Math.floor(endDate),
            label: "SoI Escape",
        },
    ]

    return {
        label:          centralBody.name + " Departure",
        index:          ejectionIdx - transfer.ejections.length,
        centralBody,
        system,
        startDate,
        endDate,
        trajectories,
        slider:         true,
        marks,
    }
}

function insertionPlotProps(transfer: Transfer, insertionIdx: number): OrbitDisplayProps {
    const trajectory = transfer.insertions[insertionIdx];
    const trajectories = [trajectory];
    const trajLen = trajectory.orbits.length;
    const centralBody  = transfer.system.bodyFromId(trajectory.orbits[0].orbiting) as OrbitingBody;
    const system = transfer.system;
    const startDate  = trajectory.intersectTimes[0];
    const endDate = trajectory.intersectTimes[trajLen];

    if(insertionIdx === transfer.insertions.length - 1) {
        trajectories.push({orbits: [transfer.endOrbit], intersectTimes: [endDate, Infinity], maneuvers: []});
    }

    const marks = [
        {
            value: Math.ceil(startDate),
            label: "SoI Encounter",
        },
        {
            value: Math.floor(endDate),
            label: "Target Encounter",
        },
    ]

    return {
        label:          centralBody.name + " Arrival",
        index:          insertionIdx + 1,
        centralBody,
        system,
        startDate,
        endDate,
        trajectories,
        slider:         true,
        marks,
    }
}

export function prepareAllDisplayProps(transfer: Transfer) {
    const orbDisplayProps: OrbitDisplayProps[] = [];    

    for(let i=0; i<transfer.ejections.length; i++) {
        orbDisplayProps.push(ejectionPlotProps(transfer, i));
    }

    orbDisplayProps.push(transferPlotProps(transfer));

    for(let i=0; i<transfer.insertions.length; i++) {
        orbDisplayProps.push(insertionPlotProps(transfer, i))
    }
    // console.log('...Orbit plot traces computed from transfer.')
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

const transferOptWorker = new Worker(new URL("../../workers/transfer-optimizer.worker.ts", import.meta.url));

function OrbitDisplayTabs() {
    const [transfer, setTransfer] = useAtom(transferAtom);

    const [timeSettings] = useAtom(timeSettingsAtom);
    const timeSettingsRef = useRef(timeSettings);

    const [value, setValue] = useState(0);
    const valueRef = useRef(value);

    const [refined, setRefined] = useState(false);
    const [orbitDisplayProps, setOrbitDisplayProps] = useState(emptyProps);

    const [calculating, setCalculating] = useState(false);

    useEffect(() => {
        transferOptWorker.onmessage = (event: MessageEvent<ITransfer>) => {
            if (event && event.data) {
                // console.log('...Patch optimization worker returned a new transfer')
                setTransfer(new Transfer(event.data));
                setRefined(true);
                setCalculating(false);
            }
        } 
        // eslint-disable-next-line react-hooks/exhaustive-deps       
    }, [transferOptWorker]);

    function handleRefineButtonPress() {
        console.log('Optimizing SoI patches')
        setCalculating(true);
        transferOptWorker
            .postMessage(transfer);   
    }

    useEffect(() => {
        if(value !== valueRef.current) {
            valueRef.current = value;
        } else if(timeSettings !== timeSettingsRef.current) {
            timeSettingsRef.current = timeSettings;
        } else {
            console.log('Updating Orbit plots with a new transfer')
            if(value < -transfer.ejections.length || value > transfer.insertions.length) {
                setValue(0);
            }
            setOrbitDisplayProps(prepareAllDisplayProps(transfer));
        }
        // hide warning for missing setters
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [transfer, timeSettings, value]);

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
        // console.log('Orbit plot tab '.concat(String(newValue)).concat(' selected.'));
    }

    return (
        <>
            <Tabs value={value} onChange={handleChange} variant="scrollable" scrollButtons={true}>
                {orbitDisplayProps.map(props => <Tab key={props.label} value={props.index} label={props.label} ></Tab>)}
            </Tabs>
            {orbitDisplayProps.map(props => <OrbitTabPanel key={props.index} value={value} index={props.index} props={props}/>)}
            {transfer.deltaV > 0 &&
                <Box component="div" textAlign='center'>
                    <LoadingButton 
                        variant="contained" 
                        loadingPosition="end"
                        endIcon={<CalculateIcon />}
                        loading={calculating}
                        onClick={() => handleRefineButtonPress()}
                        sx={{ mx: 'auto', my: 4 }}
                    >
                        Refine Transfer
                    </LoadingButton>
                    {refined && 
                        <Grid container justifyContent='center'>
                            <Grid item xs={12} sm={10} md={8}>
                                <TableContainer>
                                    <Table>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell width="50%" align="right">SoI Patch Position Error:</TableCell>
                                                <TableCell>{String(Math.round(transfer.patchPositionError * 1000) / 1000).concat(" m")}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell width="50%" align="right">SoI Patch Time Error:</TableCell>
                                                <TableCell>{String(Math.round(transfer.patchTimeError * 1000000) / 1000000).concat(" s")}</TableCell>
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