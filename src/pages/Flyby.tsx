import SolarSystem from '../main/objects/system';
import { OrbitingBody } from '../main/objects/body';
import MultiFlyby from '../main/objects/multiflyby';

import { isInvalidOrbitInput, searchInputsFromUI } from '../utils';

import { FlybyDateControlsState } from '../components/Flyby/FlybyDateControls';
import { OrbitControlsState } from '../components/OrbitControls';
import { ControlsOptionsState } from '../components/ControlsOptions';
import { FlybySequenceControlsState } from '../components/Flyby/FlybySequenceControls';

import MissionControls from '../components/Flyby/MissionControls'
import EvolutionPlot, { EvolutionPlotData } from '../components/Flyby/EvolutionPlot';
import OrbitDisplayTabs from '../components/Flyby/OrbitDisplayTabs';
import MultiFlybyInfo from '../components/Flyby/MultiFlybyInfo';
import Navbar from '../components/Navbar';
import HelpCollapse from '../components/Flyby/HelpCollapse';

import React, { useState, useEffect } from "react";
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

import { useAtom } from 'jotai';
import { multiFlybyAtom, systemAtom, timeSettingsAtom } from '../App';


type FlybyAppState = {
  startOrbitControlsState:    OrbitControlsState,
  endOrbitControlsState:      OrbitControlsState,
  flybySequenceControlsState: FlybySequenceControlsState,
  dateControlsState:          FlybyDateControlsState,
  controlsOptionsState:       ControlsOptionsState,
  evolutionPlotData:          EvolutionPlotData,
  searchCount:                number,
  setSearchCount:             React.Dispatch<React.SetStateAction<number>>,
}

export function blankMultiFlyby(system: SolarSystem): MultiFlyby {
  return new MultiFlyby({
    system:                 system,
    startOrbit:             (system.bodyFromId(1) as OrbitingBody).orbit,
    endOrbit:               (system.bodyFromId(1) as OrbitingBody).orbit,
    flybyIdSequence:        [],
    transferBody:           system.sun,
    startDate:              0,
    flightTimes:            [],
    endDate:                426 * 6 * 3600,
    transfers:              [],
    ejections:              [],
    insertions:             [],
    flybys:                 [],
    maneuvers:              [],
    maneuverContexts:       [],
    deltaV:                 0,
    soiPatchPositions:      [],
    flybyDurations:         [],
    ejectionInsertionType:  'fastdirect',
    planeChange:            false,
    matchStartMo:           false,
    matchEndMo:             false,
    noInsertionBurn:        false,
    patchPositionError:     0.0,
    patchTimeError:         0.0,
  });
}

///// App Content /////
function FlybyAppContent({startOrbitControlsState, endOrbitControlsState, flybySequenceControlsState,  dateControlsState, 
                          controlsOptionsState, evolutionPlotData, searchCount, setSearchCount}: FlybyAppState) {
  
  const [system] = useAtom(systemAtom);
  const [timeSettings] = useAtom(timeSettingsAtom);
  const [multiFlyby, setMultiFlyby] = useAtom(multiFlybyAtom);


  const [mfSearchInputs, setMfSearchInputs] = useState(searchInputsFromUI(system, startOrbitControlsState, endOrbitControlsState, flybySequenceControlsState.flybyIdSequence, dateControlsState, controlsOptionsState, timeSettings));
  const [invalidInput, setInvalidInput] = useState(false);
  const [buttonPresses, setButtonPresses] = useState(0);
  const [calculating, setCalculating] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  function handleButtonPress() {
    // update orbits
    let invalid = isInvalidOrbitInput(startOrbitControlsState);
    invalid = isInvalidOrbitInput(endOrbitControlsState) ? true : invalid;

    const transferBody = system.bodyFromId(system.commonAttractorId(flybySequenceControlsState.startBodyId, flybySequenceControlsState.endBodyId));

    // make sure that the flyby sequence contains appropriate bodies.
    for(let i=0; i<flybySequenceControlsState.flybyIdSequence.length; i++) {
      invalid = transferBody.orbiterIds.includes(flybySequenceControlsState.flybyIdSequence[i]) ? invalid : true;
    }

    // make sure that the time settings are valid
    // TO DO

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

  useEffect(() => {
    if(buttonPresses > 0 || multiFlyby.deltaV === 0) {
      setMultiFlyby(blankMultiFlyby(system));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [system])

  return (
      <>
      <Navbar showHelp={showHelp} setShowHelp={setShowHelp} />
      <Stack sx={{mx: 4, my: 1}}>
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
          <Grid item xs={12} sm={11} md={4} lg={3} xl={2} >
            <Paper 
              elevation={1}
              sx={{
                my: 1, 
                mx: 1, 
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <MissionControls 
                startOrbitControlsState={startOrbitControlsState}
                endOrbitControlsState={endOrbitControlsState} 
                flybySequenceControlsState={flybySequenceControlsState}
                dateControlsState={dateControlsState}
                controlsOptionsState={controlsOptionsState}
                />
            </Paper>
          </Grid>
          <Grid item xs={12} sm={12} md={8} lg={5} xl={7}>
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
                setCalculating={setCalculating}
                setSearchCount={setSearchCount}
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
                <OrbitDisplayTabs multiFlyby={multiFlyby} timeSettings={timeSettings} setMultiFlyby={setMultiFlyby} searchCount={searchCount}/>
            </Paper>
          </Grid>
          <Grid item xs={10} sm={8} md={7} lg={4} xl={3}>
            <Fade in={searchCount > 0} timeout={400}>
              <Paper
                elevation={1}
                sx={{
                  my: 1, 
                  mx: 1,
                  display: 'flex',
                  flexDirection: 'column',
              }}
              >
                <MultiFlybyInfo />
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
    </>
  )
}

function FlybyApp(state: FlybyAppState) {
    return <>{FlybyAppContent(state)}</>
}
  
export default FlybyApp;
  