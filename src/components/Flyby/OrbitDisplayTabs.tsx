import React, {useState, useEffect, useRef} from "react";

import MultiFlyby from "../../main/objects/multiflyby";
import { OrbitingBody } from "../../main/objects/body";

import OrbitDisplay, { OrbitDisplayProps } from "../Display/OrbitDisplay";
import InfoPopper from "../Display/InfoPopper";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
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

import { atom, PrimitiveAtom, useAtom } from "jotai";
import { commsOptionsAtom, multiFlybyAtom, timeSettingsAtom, unrefinedMultiFlybyAtom } from "../../App";

const emptyProps: OrbitDisplayProps[] = [];

function transferPlotProps(multiFlyby: MultiFlyby, commsRange: number): OrbitDisplayProps {
    const startDate = multiFlyby.startDate;
    const endDate = multiFlyby.endDate;

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
        flightPlans:    [multiFlyby.flightPlan(commsRange)],
        startDate:      startDate,
        endDate:        endDate,
        slider:         true,
    };
}

function ejectionPlotProps(multiFlyby: MultiFlyby, ejectionIdx: number, commsRange: number): OrbitDisplayProps {
    const trajectory = multiFlyby.ejections[ejectionIdx];
    const trajLen = trajectory.orbits.length;
    const body = multiFlyby.system.bodyFromId(trajectory.orbits[0].orbiting) as OrbitingBody;
    const startDate  = trajectory.intersectTimes[0];
    const endDate = trajectory.intersectTimes[trajLen];

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
        flightPlans:    [multiFlyby.flightPlan(commsRange)],
        startDate:      startDate,
        endDate:        endDate,
        slider:         true,
    };
}

function insertionPlotProps(multiFlyby: MultiFlyby, insertionIdx: number, commsRange: number): OrbitDisplayProps {
    const trajectory = multiFlyby.insertions[insertionIdx];
    const trajLen = trajectory.orbits.length;
    const body = multiFlyby.system.bodyFromId(trajectory.orbits[0].orbiting) as OrbitingBody;
    const startDate  = trajectory.intersectTimes[0];
    const endDate = trajectory.intersectTimes[trajLen];

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
        flightPlans:    [multiFlyby.flightPlan(commsRange)],
        startDate:      startDate,
        endDate:        endDate,
        slider:         true,
    };
}

function flybyPlotProps(multiFlyby: MultiFlyby, flybyIdx: number, commsRange: number): OrbitDisplayProps {
    const trajectory = multiFlyby.flybys[flybyIdx];
    const trajLen = trajectory.orbits.length;
    const body = multiFlyby.system.bodyFromId(trajectory.orbits[0].orbiting) as OrbitingBody;
    const startDate = trajectory.intersectTimes[0];
    const midDate = trajectory.intersectTimes[1];
    const endDate = trajectory.intersectTimes[trajLen];
    
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
        flightPlans:    [multiFlyby.flightPlan(commsRange)],
        startDate:      startDate,
        endDate:        endDate,
        slider:         true,
    };
}

export function prepareAllDisplayProps(multiFlyby: MultiFlyby, commsRange: number) {
    const orbDisplayProps: OrbitDisplayProps[] = [];    

    for(let i=0; i<multiFlyby.ejections.length; i++) {
        orbDisplayProps.push(ejectionPlotProps(multiFlyby, i, commsRange));
    }

    orbDisplayProps.push(transferPlotProps(multiFlyby, commsRange));

    for(let i=0; i<multiFlyby.flybys.length; i++) {
        orbDisplayProps.push(flybyPlotProps(multiFlyby, i, commsRange));
    }
    for(let i=0; i<multiFlyby.insertions.length; i++) {
        orbDisplayProps.push(insertionPlotProps(multiFlyby, i, commsRange));
    }

    // console.log('...Orbit plot traces computed from trajectory.')
    return orbDisplayProps;
} 

const OrbitTabPanel = React.memo(function WrappedOrbitTabPanel({value, index, props, infoItemAtom}: {value: number, index: number, props: OrbitDisplayProps, infoItemAtom: PrimitiveAtom<InfoItem>}) {
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
            <OrbitDisplay {...orbitPlotProps} infoItemAtom={infoItemAtom} tabValue={value} />
        </div>
    )
});

const multiFlybyOptWorker = new Worker(new URL("../../workers/multi-flyby-optimizer.worker.ts", import.meta.url));

function OrbitDisplayTabs() {
    const [multiFlyby, setMultiFlyby] = useAtom(multiFlybyAtom);
    const [unrefinedMultiFlyby] = useAtom(unrefinedMultiFlybyAtom);

    const [timeSettings] = useAtom(timeSettingsAtom);
    const timeSettingsRef = useRef(timeSettings);

    const [commsOptions] = useAtom(commsOptionsAtom);
    const commsOptionsRef = useRef(commsOptions);

    const [value, setValue] = useState(0);
    const valueRef = useRef(value);

    const [refined, setRefined] = useState(false);
    const [calculating, setCalculating] = useState(false);

    const [orbitDisplayProps, setOrbitDisplayProps] = useState(emptyProps);
    const infoItemAtom = useRef(atom<InfoItem>(null)).current;
    const canvasRef = useRef<HTMLDivElement | null>(null);

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

    function handleUndoRefineButtonPress() {
        console.log('Reset to unrefined trajectory')
        setMultiFlyby(unrefinedMultiFlyby);
    }

    useEffect(() => {
        if(value !== valueRef.current) {
            valueRef.current = value;
        } else if(timeSettings !== timeSettingsRef.current) {
            timeSettingsRef.current = timeSettings;
        } else if (commsOptions !== commsOptionsRef.current) {
            commsOptionsRef.current = commsOptions;
            const newDisplayProps = orbitDisplayProps.map(odp => {
                const newFlightPlans = (odp.flightPlans || []).map(fp => {
                    return {...fp, commRange: commsOptions.commStrength * 1e6};
                });
                return {...odp, flightPlans: newFlightPlans};
            })
            setOrbitDisplayProps(newDisplayProps);
        } else {
            console.log('Updating Orbit plots with a new multi-flyby')
            if(value < -multiFlyby.ejections.length || value > multiFlyby.flybys.length + multiFlyby.insertions.length) {
                setValue(0);
            }
            setOrbitDisplayProps(prepareAllDisplayProps(multiFlyby, commsOptions.commStrength * 1e6));
        }
        // hide warning for missing setters
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [multiFlyby, timeSettings, value, commsOptions]);

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
        // console.log('Orbit plot tab '.concat(String(newValue)).concat(' selected.'));
    }

    return (
        <>
            <Tabs value={value} onChange={handleChange} variant="scrollable" scrollButtons={true}>
                {orbitDisplayProps.map((props, index) => <Tab key={index} value={props.index} label={props.label} ></Tab>)}
            </Tabs>
            <div ref={canvasRef}>
                {orbitDisplayProps.map((props, index) => <OrbitTabPanel key={index} value={value} index={props.index} props={props} infoItemAtom={infoItemAtom} />)}
            </div>
            <InfoPopper infoItemAtom={infoItemAtom} parentRef={canvasRef} system={multiFlyby.system} />

            {multiFlyby.deltaV > 0 &&
            <Box component="div" textAlign='center'>
                <Stack direction="row" spacing={2} textAlign='center' justifyContent='center' alignItems='center' sx={{ mx: 'auto', my: 4 }}>
                    <LoadingButton 
                        variant="contained" 
                        loadingPosition="end"
                        endIcon={<CalculateIcon />}
                        loading={calculating}
                        onClick={() => handleRefineButtonPress()}
                    >
                        Refine Trajectory
                    </LoadingButton>
                    { refined && 
                        <Button
                            variant="contained" 
                            onClick={() => handleUndoRefineButtonPress()}
                            disabled={calculating || unrefinedMultiFlyby === multiFlyby}
                        >
                            Revert to Original
                        </Button>
                    }
                </Stack>
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