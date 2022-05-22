import SolarSystem from '../main/objects/system';
import Vessel from '../main/objects/vessel';
import Transfer from '../main/objects/transfer';

import { DateControlsState } from '../components/TransferApp/DateControls';
import { OrbitControlsState } from '../components/OrbitControls';
import {ControlsOptionsState } from '../components/ControlsOptions';

import MissionControls from '../components/TransferApp/MissionControls'
import PorkchopPlot from '../components/TransferApp/PorkChopPlot';
import OrbitDisplayTabs from '../components/TransferApp/OrbitDisplayTabs';
import TransferInfo from '../components/TransferApp/TransferInfo';
import HelpCollapse from '../components/TransferApp/HelpCollapse';
import Navbar from '../components/Navbar';

import { isInvalidOrbitInput, porkchopInputsFromUI } from '../utils';

import React, { useState } from "react";
import { ThemeProvider, Theme } from '@mui/material/styles';
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
import CircularProgress from "@mui/material/CircularProgress";
import Fade from '@mui/material/Fade';

type TransferAppState = {
  theme:                   Theme,
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
  copiedFlightPlan:        IVessel,
  setCopiedFlightPlan:     React.Dispatch<React.SetStateAction<IVessel>>,
  startOrbitControlsState: OrbitControlsState,
  endOrbitControlsState:   OrbitControlsState,
  dateControlsState:       DateControlsState,
  controlsOptionsState:    ControlsOptionsState,
  transfer:                Transfer,
  setTransfer:             React.Dispatch<React.SetStateAction<Transfer>>,
  porkchopInputs:          PorkchopInputs,
  setPorkchopInputs:       React.Dispatch<React.SetStateAction<PorkchopInputs>>,
  porkchopPlotData:        PorkchopPlotData,
  setPorkchopPlotData:     React.Dispatch<React.SetStateAction<PorkchopPlotData>>,
}


////////// App Content //////////

function TransferAppContent({theme, system, setSystem, timeSettings, setTimeSettings, vessels, setVessels, copiedOrbit, setCopiedOrbit, copiedManeuver, setCopiedManeuver,
                             copiedFlightPlan, setCopiedFlightPlan, startOrbitControlsState, endOrbitControlsState, dateControlsState, controlsOptionsState, transfer, setTransfer, 
                             porkchopInputs, setPorkchopInputs, porkchopPlotData, setPorkchopPlotData}: TransferAppState) { 
  
  const [invalidInput, setInvalidInput] = useState(false);
  const [porkCalculating, setPorkCalculating] = useState(false);
  const [plotCount, setPlotCount] = useState(0);
  const [showHelp, setShowHelp] = useState(false);

  function handlePlotButtonPress() {
    
    // ensure there are no invalid orbit inputs
    let invalidFlag = isInvalidOrbitInput(startOrbitControlsState);
    invalidFlag = isInvalidOrbitInput(endOrbitControlsState) ? true : invalidFlag;
    
    // display a warning and do not calculate a Porkchop if the inputs are invalid
    setInvalidInput(invalidFlag);
    if(invalidFlag) {
      return
    }

    // prepare porkchop inputs
    const porkInputs = porkchopInputsFromUI(system, startOrbitControlsState, endOrbitControlsState, dateControlsState, controlsOptionsState, timeSettings);

    setPorkchopInputs(porkInputs);
    setPlotCount(plotCount + 1)
    console.log('"Plot!" button pressed.');
  }

  ///// App Body /////
  return (
    <ThemeProvider theme={theme}>
      <Navbar system={system} setVessels={setVessels} showHelp={showHelp} setShowHelp={setShowHelp} />
      <Stack sx={{mx: 4, my: 1, minWidth: "1200px"}}>
        <CssBaseline />
        <Box textAlign='left' sx={{mx: 2, my: 3}}>
          <Typography variant="h4">Transfer Planner</Typography>
          <Divider />
        </Box>
        <HelpCollapse showHelp={showHelp} />
        <Collapse in={invalidInput}>
          <Alert severity='error'>
            <AlertTitle>Error</AlertTitle>
            Orbit inputs are invalid. Check for boxes outlined in red under "Orbit Settings".
          </Alert>
        </Collapse>
        <Grid container component='main' justifyContent="center">
          <Grid item xs={3} xl={2}>
            <Paper 
              elevation={1}
              sx={{
                my: 1, 
                mx: 1, 
                minWidth: 250,
                maxWidth: 350,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <MissionControls 
                system={system} 
                vessels={vessels}
                startOrbitControlsState={startOrbitControlsState}
                endOrbitControlsState= {endOrbitControlsState} 
                dateControlsState={dateControlsState}
                controlsOptionsState={controlsOptionsState}
                copiedOrbit={copiedOrbit}
                timeSettings={timeSettings}
                setTimeSettings={setTimeSettings}
                />
            </Paper>
          </Grid>
          <Grid item xs={5} xl={6}>
            <Paper 
              elevation={1}
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
                      disabled={porkCalculating}
                      onClick={() => handlePlotButtonPress()}
                      sx={{ mx: 'auto', my: 2 }}
                  >
                    ⇩ Plot It!
                    {porkCalculating &&
                    <CircularProgress
                      size={24}
                      sx={{
                        position: 'relative',
                        left: '10px',
                      }}
                    />
                  }
                  </Button>
                </Box>
              {/* @ts-ignore */}
              <PorkchopPlot 
                inputs={porkchopInputs}
                plotData={porkchopPlotData}
                timeSettings={timeSettings}
                plotCount={plotCount}
                setPlotData={setPorkchopPlotData}
                setTransfer={setTransfer}
                setCalculating={setPorkCalculating}
              />
            </Paper>
            <Paper 
                elevation={1}
                sx={{
                  my: 3, 
                  mx: 1,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <OrbitDisplayTabs transfer={transfer} setTransfer={setTransfer} timeSettings={timeSettings}/>
            </Paper>
          </Grid>
          <Grid item xs={4} xl={4}>
            <Fade in={transfer.deltaV > 0} timeout={400}>
              <Paper
                elevation={1}
                sx={{
                  my: 1, 
                  mx: 1,
                  display: 'flex',
                  flexDirection: 'column',
              }}
              >
                <TransferInfo transfer={transfer} timeSettings={timeSettings} copiedOrbit={copiedOrbit} setCopiedOrbit={setCopiedOrbit} copiedManeuver={copiedManeuver}
                  setCopiedManeuver={setCopiedManeuver} copiedFlightPlan={copiedFlightPlan} setCopiedFlightPlan={setCopiedFlightPlan}/>
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

function TransferApp(state: TransferAppState) {
  return <>{TransferAppContent(state)}</>
}

export default React.memo(TransferApp);
