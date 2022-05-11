import SolarSystem from '../main/objects/system';
import Orbit from '../main/objects/orbit';
import Vessel from '../main/objects/vessel';
import MultiFlyby from '../main/objects/multiflyby';

import { isInvalidOrbitInput, searchInputsFromUI } from '../utils';

import { DateControlsState } from '../components/DateControls';
import { OrbitControlsState } from '../components/OrbitControls';
import { ControlsOptionsState } from '../components/ControlsOptions';
import { FlybySequenceControlsState } from '../components/FlybyApp/FlybySequenceControls';

import MissionControls from '../components/FlybyApp/MissionControls'
import EvolutionPlot, { EvolutionPlotData } from '../components/FlybyApp/EvolutionPlot';
import OrbitDisplayTabs from '../components/FlybyApp/OrbitDisplayTabs';
import MultiFlybyInfo from '../components/FlybyApp/MultiFlybyInfo';
import Navbar from '../components/Navbar';

import React, { useState } from "react";
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/system/Box';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Collapse from '@mui/material/Collapse';
import Fade from '@mui/material/Fade';
import HelpCollapse from '../components/TransferApp/HelpCollapse';

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

type FlybyAppState = {
  system:                     SolarSystem,
  setSystem:                  React.Dispatch<React.SetStateAction<SolarSystem>>,
  timeSettings:               TimeSettings,
  setTimeSettings:            React.Dispatch<React.SetStateAction<TimeSettings>>,
  vessels:                    Vessel[],
  setVessels:                 React.Dispatch<React.SetStateAction<Vessel[]>>,
  copiedOrbit:                IOrbit,
  setCopiedOrbit:             React.Dispatch<React.SetStateAction<IOrbit>>,
  copiedManeuver:             Maneuver,
  setCopiedManeuver:          React.Dispatch<React.SetStateAction<Maneuver>>,
  startOrbitControlsState:    OrbitControlsState,
  endOrbitControlsState:      OrbitControlsState,
  flybySequenceControlsState: FlybySequenceControlsState,
  dateControlsState:          DateControlsState,
  controlsOptionsState:       ControlsOptionsState,
  multiFlyby:                 MultiFlyby,
  setMultiFlyby:              React.Dispatch<React.SetStateAction<MultiFlyby>>,
  evolutionPlotData:          EvolutionPlotData,
  searchCount:                number,
  setSearchCount:             React.Dispatch<React.SetStateAction<number>>,
}


///// App Content /////
function FlybyAppContent({system, setSystem, timeSettings, setTimeSettings, vessels, setVessels, copiedOrbit, setCopiedOrbit, copiedManeuver, setCopiedManeuver, startOrbitControlsState, endOrbitControlsState, 
                          flybySequenceControlsState,  dateControlsState, controlsOptionsState, multiFlyby, setMultiFlyby, evolutionPlotData, searchCount, setSearchCount}: FlybyAppState) {

  ///// Multi-flyby search inputs /////
  const [mfSearchInputs, setMfSearchInputs] = useState(searchInputsFromUI(system, startOrbitControlsState, endOrbitControlsState, flybySequenceControlsState.flybyIdSequence, dateControlsState, controlsOptionsState, timeSettings))

  ///// invalid input alert /////
  const [invalidInput, setInvalidInput] = useState(false);


  ///// Search Button /////
  const [buttonPresses, setButtonPresses] = useState(0);
  const [calculating, setCalculating] = useState(false);

  function handleButtonPress() {
    // update orbits
    let invalid = isInvalidOrbitInput(startOrbitControlsState);
    invalid = isInvalidOrbitInput(endOrbitControlsState) ? true : invalid;

    // check to make sure the start and end orbits share a near-enough common parent
    const transferBody = system.bodyFromId(system.commonAttractorId(flybySequenceControlsState.startBodyId, flybySequenceControlsState.endBodyId));
    // invalid = transferBody.orbiterIds.includes(startBodyId) || transferBody.id === startBodyId ? invalid: true;
    // invalid = transferBody.orbiterIds.includes(endBodyId)   || transferBody.id === endBodyId   ? invalid: true;

    // make sure that the flyby sequence contains appropriate bodies.
    for(let i=0; i<flybySequenceControlsState.flybyIdSequence.length; i++) {
      invalid = transferBody.orbiterIds.includes(flybySequenceControlsState.flybyIdSequence[i]) ? invalid : true;
    }

    // display a warning and do not calculate a Porkchop if the inputs are invalid
    setInvalidInput(invalid);
    if(invalid) {
      return
    }

    const newMfSearchInputs = searchInputsFromUI(system, startOrbitControlsState, endOrbitControlsState, flybySequenceControlsState.flybyIdSequence, dateControlsState, controlsOptionsState, timeSettings);

    setMfSearchInputs(newMfSearchInputs);
    setButtonPresses(buttonPresses + 1);

    console.log('"Search Trajectories" button pressed.');
  }

  const [showHelp, setShowHelp] = useState(false);

  return (
      <ThemeProvider theme={mdTheme}>
      <Navbar system={system} setVessels={setVessels} showHelp={showHelp} setShowHelp={setShowHelp} />
      <Stack sx={{mx: 4, my: 1, minWidth: "1200px"}}>
        <CssBaseline />
        <Box textAlign='left' sx={{mx: 2, my: 3}}>
          <Typography variant="h4">Multi-Flyby Planner</Typography>
          <Divider />
        </Box>
        <HelpCollapse showHelp={showHelp} />
        <Collapse in={invalidInput}>
          <Alert severity='error'>
            <AlertTitle>Error</AlertTitle>
            Mission inputs are invalid. Check for boxes outlined in red under "Orbit Settings". Make sure your Flyby Sequence fields have been filled.
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
              <MissionControls 
                system={system} 
                vessels={vessels}
                startOrbitControlsState={startOrbitControlsState}
                endOrbitControlsState={endOrbitControlsState} 
                flybySequenceControlsState={flybySequenceControlsState}
                copiedOrbit={copiedOrbit}
                dateControlsState={dateControlsState}
                timeSettings={timeSettings}
                setTimeSettings={setTimeSettings}
                controlsOptionsState={controlsOptionsState}
                />
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
                    disabled={calculating}
                    onClick={() => handleButtonPress()}
                    sx={{ mx: 'auto', my: 2 }}
                >
                  ⇩ Search Trajectories
                </Button>
              </Box>
              <EvolutionPlot 
                inputs={mfSearchInputs}
                plotData={evolutionPlotData}
                buttonPresses={buttonPresses} 
                searchCount={searchCount} 
                setMultiFlyby={setMultiFlyby}
                setCalculating={setCalculating}
                setSearchCount={setSearchCount}
              />
            </Paper>
            <Paper 
                elevation={8}
                sx={{
                  my: 3, 
                  mx: 1,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <OrbitDisplayTabs multiFlyby={multiFlyby} timeSettings={timeSettings} setMultiFlyby={setMultiFlyby} searchCount={searchCount}/>
            </Paper>
          </Grid>
          <Grid item xs={4} xl={4}>
            <Fade in={searchCount > 0} timeout={400}>
              <Paper
                elevation={8}
                sx={{
                  my: 1, 
                  mx: 1,
                  display: 'flex',
                  flexDirection: 'column',
              }}
              >
                <MultiFlybyInfo multiFlyby={multiFlyby} timeSettings={timeSettings} copiedOrbit={copiedOrbit} setCopiedOrbit={setCopiedOrbit} copiedManeuver={copiedManeuver} setCopiedManeuver={setCopiedManeuver} />
              </Paper>
            </Fade>
          </Grid>
        </Grid>
        <Box sx={{my:4}}>
          <Typography variant="h5">Acknowledgements</Typography>
          <Box sx={{mx:4}}>
            <Typography variant="h6">Many thanks to...</Typography>
            <Stack spacing={0.1}>
              <Typography>...Arrowstar, for his incredible <a href="https://forum.kerbalspaceprogram.com/index.php?/topic/33568-winmaclinux-ksp-trajectory-optimization-tool-v168-new-matlab-version/">KSP Trajectory Optimization Tool</a>, which this page is modeled after.</Typography>
              <Typography>...krafpy, for motivating me via his <a href="https://krafpy.github.io/KSP-MGA-Planner/">Multiple Gravity Assist Trajectory Planner for KSP</a> to attempt a Javascript project. </Typography>
              <Typography>...mark9064, for insight into .sfs parsing via <a href="https://github.com/mark9064/sfsutils/">sfsutils</a>. </Typography>
            </Stack>
            <Typography variant="h6">References:</Typography>
            <Stack spacing={0.1}>
            <Typography>Robert Braeunig's <a href="http://www.braeunig.us/space/index.htm">website</a>, for an introduction to orbital mechanics.</Typography>
              <Typography>The handouts in René Schwarz' <a href="https://www.rene-schwarz.com/web/Science/Memorandum_Series">Memorandum Series</a>, for handling Keplerian orbit elements.</Typography>
              <Typography>The European Space Agency's <a href="https://github.com/esa/pykep/blob/master/src/lambert_problem.cpp">Lambert Solver Script</a>, as well as krafpy's <a href="https://github.com/Krafpy/KSP-MGA-Planner/blob/master/src/dedicated-workers/libs/lambert.ts">Typescript port</a>.</Typography>
              <Typography>Numerous Wikipedia pages, particularly those for <a href="https://en.wikipedia.org/wiki/Brent%27s_method">Brent's method</a>, the <a href="https://en.wikipedia.org/wiki/Nelder%E2%80%93Mead_method">Nelder-Mead method</a>, and <a href="https://en.wikipedia.org/wiki/Differential_evolution">Differential Evolution</a>.</Typography>
            </Stack>
          </Box>
        </Box>
      </Stack>
    </ThemeProvider>
  )
}

function FlybyApp(state: FlybyAppState) {
    return <>{FlybyAppContent(state)}</>
}
  
export default FlybyApp;
  