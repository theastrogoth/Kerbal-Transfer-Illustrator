import SolarSystem from '../main/objects/system';
import Vessel from '../main/objects/vessel';

import kspbodies from '../data/kspbodies.json';

import { DateFieldState } from '../components/DateField';

import Navbar from '../components/Navbar';
import VesselTabs, { VesselTabsState } from '../components/ManueversApp/VesselTabs';

import {useState } from "react";
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/system/Box';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Collapse from '@mui/material/Collapse';
import Fade from '@mui/material/Fade';

// MUI theme
const mdTheme = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 2280,
    },
  },
});

type ManeuversAppState = {
  system:                  SolarSystem,
  setSystem:               React.Dispatch<React.SetStateAction<SolarSystem>>,
  timeSettings:            TimeSettings,
  setTimeSettings:         React.Dispatch<React.SetStateAction<TimeSettings>>,
  vessels:                 Vessel[],
  setVessels:              React.Dispatch<React.SetStateAction<Vessel[]>>,
  copiedOrbit:             IOrbit,
  setCopiedOrbit:          React.Dispatch<React.SetStateAction<IOrbit>>,
  copiedManeuver:          ManeuverComponents,
  setCopiedManeuver:       React.Dispatch<React.SetStateAction<ManeuverComponents>>,
  copiedFlightPlan:        FlightPlan,
  setCopiedFlightPlan:     React.Dispatch<React.SetStateAction<FlightPlan>>,
  vesselPlans:             IVessel[],
  setVesselPlans:          React.Dispatch<React.SetStateAction<IVessel[]>>,
}

////////// App Content //////////

function ManeuversAppContent({system, setSystem, timeSettings, setTimeSettings, vessels, setVessels, copiedOrbit, setCopiedOrbit, 
                              copiedManeuver, setCopiedManeuver, copiedFlightPlan, setCopiedFlightPlan, vesselPlans, setVesselPlans}: ManeuversAppState) { 

  const [invalidInput, setInvalidInput] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [plotCount, setPlotCount] = useState(0);

  const vesselTabsState: VesselTabsState = {
    system,
    vessels,
    vesselPlans,
    setVesselPlans,
    copiedOrbit,
    copiedManeuver,
    copiedFlightPlan,
    timeSettings,
  }

 
  ///// App Body /////
  return (
    <ThemeProvider theme={mdTheme}>
      <Navbar system={system} setVessels={setVessels} showHelp={showHelp} setShowHelp={setShowHelp} />
      <Stack sx={{mx: 4, my: 1, minWidth: "1200px"}}>
        <CssBaseline />
        <Box textAlign='left' sx={{mx: 2, my: 3}}>
          <Typography variant="h4">Kerbal Flight Plan Illustrator</Typography>
          <Divider />
        </Box>
        <Collapse in={false}> { /* in={invalidInput} */}
          <Alert severity='error'>
            <AlertTitle>Error</AlertTitle>
            Orbit inputs are invalid. Check for boxes outlined in red under "Orbit Settings".
          </Alert>
        </Collapse>
        <Grid container component='main' justifyContent="center">
          <Grid item xs={3} xl={2}>
            <Paper 
              elevation={8}
              sx={{
                my: 1, 
                mx: 1, 
                minWidth: 250,
                maxWidth: 350,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <VesselTabs state={vesselTabsState} />
            </Paper>
          </Grid>
          <Grid item xs={5} xl={6}>
            <Paper 
              elevation={8}
              sx={{
                my: 1, 
                mx: 1,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
                <Box textAlign='center' sx={{ my: 0}}>
                  <Button 
                      variant="contained" 
                      sx={{ mx: 'auto', my: 2 }}
                  >
                    ⇩ Plot It!
                  </Button>
                </Box>
            </Paper>
            <Paper 
                elevation={8}
                sx={{
                  my: 1, 
                  mx: 1,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* <OrbitDisplayTabs transfer={transfer} setTransfer={setTransfer} timeSettings={timeSettings}/> */}
            </Paper>
          </Grid>
          <Grid item xs={4} xl={4}>
            <Fade in={plotCount > 0} timeout={400}>
              <Paper
                elevation={8}
                sx={{
                  my: 1, 
                  mx: 1,
                  display: 'flex',
                  flexDirection: 'column',
              }}
              >
              </Paper>
            </Fade>
          </Grid>
        </Grid>
        <Box sx={{my:4}}>
          <Typography variant="h5">Acknowledgements</Typography>
          <Box sx={{mx:4}}>
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
    </ThemeProvider>
  )
}

function ManeuversApp(state: ManeuversAppState) {
  return <>{ManeuversAppContent(state)}</>
}

export default ManeuversApp;
