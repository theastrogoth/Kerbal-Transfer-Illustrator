import Navbar from '../components/Navbar';
import VesselTabs from '../components/Manuevers/VesselTabs';
import OrbitDisplayTabs from '../components/Manuevers/OrbitDisplayTabs';
import FlightPlanInfoTabs from '../components/Manuevers/FlightPlanInfoTabs';
import HelpCollapse from '../components/Manuevers/HelpCollapse';

import React, {useEffect, useState, useRef } from "react";
import ReactGA from 'react-ga';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/system/Box';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Collapse from '@mui/material/Collapse';

import { useAtom } from 'jotai';
import { systemAtom, flightPlansAtom, vesselPlansAtom } from '../App';
import Kepler from '../main/libs/kepler';


// worker
const propagateWorker = new Worker(new URL("../workers/propagate.worker.ts", import.meta.url));

////////// App Content //////////
function ManeuversAppContent() { 
  useEffect(() => {
    ReactGA.pageview('/Maneuvers');
  }, [])

  const [vesselPlans] = useAtom(vesselPlansAtom);
  const vesselPlansRef = useRef<IVessel[]>(vesselPlans);

  const [system] = useAtom(systemAtom);
  const [, setFlightPlans] = useAtom(flightPlansAtom);

  // const [invalidInput, setInvalidInput] = useState(false);
  const [showHelp, setShowHelp] = useState(false);


useEffect(() => {
  propagateWorker.onmessage = (event: MessageEvent<FlightPlan[]>) => {
    if (event && event.data) {
      setFlightPlans(event.data);
    }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [propagateWorker]);

useEffect(() => {
if(!Kepler.vesselListsAreEqual(vesselPlansRef.current, vesselPlans)) {
    vesselPlansRef.current = vesselPlans;
    propagateWorker
    .postMessage({vesselPlans, system});
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [vesselPlans, system]);


  ///// App Body /////
  return (
    <>
      <Navbar showHelp={showHelp} setShowHelp={setShowHelp} />
      <Stack sx={{mx: 4, my: 1}}>
        <CssBaseline />
        <Box component="div" textAlign='left' sx={{mx: 2, my: 3}}>
          <Typography variant="h4">Flight Planner</Typography>
          <Divider />
        </Box>
        <HelpCollapse showHelp={showHelp} />
        <Collapse in={false}> { /* in={invalidInput} */}
          <Alert severity='error'>
            <AlertTitle>Error</AlertTitle>
            Orbit inputs are invalid. Check for boxes outlined in red under "Orbit Settings".
          </Alert>
        </Collapse>
        <Grid container component='main' justifyContent="center">
          <Grid item xs={12} sm={11} md={6} lg={4} xl={3}>
            <Paper 
              elevation={1}
              sx={{
                my: 1, 
                mx: 1, 
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <VesselTabs />
            </Paper>
          </Grid>
          <Grid item xs={12} sm={12} md={6} lg={4} xl={6}>
            <Paper 
                elevation={1}
                sx={{
                  my: 1, 
                  mx: 1,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <OrbitDisplayTabs />
            </Paper>
          </Grid>
          <Grid item xs={12} sm={10} md={8} lg={4} xl={3}>
            <Paper
              elevation={1}
              sx={{
                my: 1, 
                mx: 1,
                display: 'flex',
                flexDirection: 'column',
            }}
            >
              <FlightPlanInfoTabs />
            </Paper>
          </Grid>
        </Grid>
        <Box component="div" sx={{my:4}}>
          <Typography variant="h5">Acknowledgements</Typography>
          <Box component="div" sx={{mx:4}}>
            <Typography variant="h6">Many thanks to...</Typography>
            <Stack spacing={0.1}>
              <Typography>...Arrowstar, for his incredible <a href="https://forum.kerbalspaceprogram.com/index.php?/topic/33568-winmaclinux-ksp-trajectory-optimization-tool-v168-new-matlab-version/">KSP Trajectory Optimization Tool</a>.</Typography>
              <Typography>...alexmoon, for providing the inspiration for this site with his <a href="https://alexmoon.github.io/ksp/">Launch Window Planner</a>.</Typography>
              <Typography>...krafpy, for motivating me via his <a href="https://krafpy.github.io/KSP-MGA-Planner/">Multiple Gravity Assist Trajectory Planner for KSP</a> to attempt a Javascript project. </Typography>
              <Typography>...mark9064, for insight into .sfs parsing via <a href="https://github.com/mark9064/sfsutils/">sfsutils</a>. </Typography>
            </Stack>
            <Typography variant="h6">References:</Typography>
            <Stack spacing={0.1}>
            <Typography>Robert Braeunig's <a href="http://www.braeunig.us/space/index.htm">website</a>, for an introduction to orbital mechanics.</Typography>
              <Typography>The handouts in René Schwarz' <a href="https://www.rene-schwarz.com/web/Science/Memorandum_Series">Memorandum Series</a>, for handling Keplerian orbit elements.</Typography>
              <Typography>The European Space Agency's <a href="https://github.com/esa/pykep/blob/master/src/lambert_problem.cpp">Lambert Solver Script</a>, as well as krafpy's <a href="https://github.com/Krafpy/KSP-MGA-Planner/blob/master/src/dedicated-workers/libs/lambert.ts">Typescript port</a>.</Typography>
              <Typography>Numerous Wikipedia pages, particularly those for <a href="https://en.wikipedia.org/wiki/Brent%27s_method">Brent's method</a> and the <a href="https://en.wikipedia.org/wiki/Nelder%E2%80%93Mead_method">Nelder-Mead method</a>. </Typography>
            </Stack>
          </Box>
        </Box>
      </Stack>
    </>
  )
}

function ManeuversApp() {
  return <>{ManeuversAppContent()}</>
}

export default React.memo(ManeuversApp);
