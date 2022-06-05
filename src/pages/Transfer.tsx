import SolarSystem from '../main/objects/system';
import { OrbitingBody } from '../main/objects/body';
import Transfer from '../main/objects/transfer';

import MissionControls from '../components/Transfer/MissionControls'
import PorkchopPlot from '../components/Transfer/PorkChopPlot';
import OrbitDisplayTabs from '../components/Transfer/OrbitDisplayTabs';
import TransferInfo from '../components/Transfer/TransferInfo';
import HelpCollapse from '../components/Transfer/HelpCollapse';
import Navbar from '../components/Navbar';

import { isInvalidOrbitInput, porkchopInputsFromUI } from '../utils';

import React, { useState, useEffect } from "react";
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

import { useAtom } from 'jotai';
import { porkchopInputsAtom, systemAtom, timeSettingsAtom, transferAtom, transferEarlyStartDateAtom, transferEndOrbitAtom, transferLateStartDateAtom, transferLongFlightTimeAtom, transferShortFlightTimeAtom, transferStartOrbitAtom, transferControlsOptionsAtom } from '../App';


export function blankTransfer(system: SolarSystem): Transfer {
  return new Transfer({
    system:                 system,
    startOrbit:             (system.bodyFromId(1) as OrbitingBody).orbit,
    endOrbit:               (system.bodyFromId(1) as OrbitingBody).orbit,
    startDate:              0.0,
    flightTime:             (system.bodyFromId(1) as OrbitingBody).orbit.siderealPeriod,
    endDate:                (system.bodyFromId(1) as OrbitingBody).orbit.siderealPeriod,
    transferTrajectory:     {orbits: [], intersectTimes: [], maneuvers: []},
    ejections:              [],
    insertions:             [],
    maneuvers:              [],
    maneuverContexts:       [],
    deltaV:                 0.0,
    ejectionInsertionType:  "fastoberth",
    planeChange:            false,
    matchStartMo:           true,
    matchEndMo:             false,
    noInsertionBurn:        false,
    soiPatchPositions:      [],
    patchPositionError:     0,
    patchTimeError:         0,
  })
}

////////// App Content //////////

function TransferAppContent() { 
  const [system] = useAtom(systemAtom);
  const [timeSettings] = useAtom(timeSettingsAtom);
  const [transfer, setTransfer] = useAtom(transferAtom);
  const [, setPorkchopInputs] = useAtom(porkchopInputsAtom);

  const [startOrbit] = useAtom(transferStartOrbitAtom);
  const [endOrbit] = useAtom(transferEndOrbitAtom);

  const [earlyStartDate] = useAtom(transferEarlyStartDateAtom);
  const [lateStartDate] = useAtom(transferLateStartDateAtom);
  const [shortFlightTime] = useAtom(transferShortFlightTimeAtom);
  const [longFlightTime] = useAtom(transferLongFlightTimeAtom)
  const [controlsOptionsState] = useAtom(transferControlsOptionsAtom);

  const [invalidInput, setInvalidInput] = useState(false);
  const [porkCalculating, setPorkCalculating] = useState(false);
  const [plotCount, setPlotCount] = useState(0);
  const [showHelp, setShowHelp] = useState(false);

  // TODO: Implement system editor with custom system, store custom system in URL hash
  // const [customSystem, setCustomSystem] = useAtom(customSystemAtom);
  // const customSystemRef = useRef(customSystem);
  // const customSystemHashAtom = useRef(atomWithHash("customSystem", customSystem)).current;
  // const [customSystemHash, setSystemHash] = useAtom(customSystemHashAtom)

  // useEffect(() => {
  //   if(customSystem !== customSystemRef.current){
  //     customSystemRef.current = customSystemHash;
  //     setSystemHash(customSystem);
  //   }
  // }, [customSystem])

  // useEffect(() => {
  //   if(customSystemHash !== customSystemRef.current) {
  //     customSystemRef.current = customSystemHash;
  //     setCustomSystem(customSystemHash);
  //   }
  // }, [customSystemHash])

  function handlePlotButtonPress() {
    // ensure there are no invalid orbit inputs
    let invalidFlag = isInvalidOrbitInput(startOrbit);
    invalidFlag = isInvalidOrbitInput(endOrbit) ? true : invalidFlag;
    
    // display a warning and do not calculate a Porkchop if the inputs are invalid
    setInvalidInput(invalidFlag);
    if(invalidFlag) {
      return
    }

    // prepare porkchop inputs
    const porkInputs = porkchopInputsFromUI(system, startOrbit, endOrbit, earlyStartDate, lateStartDate, shortFlightTime, longFlightTime, controlsOptionsState, timeSettings);
    setPorkchopInputs(porkInputs);
    setPlotCount(plotCount + 1)
    console.log('"Plot!" button pressed.');
  }

  useEffect(() => {
    if(plotCount > 0 || transfer.deltaV === 0) {
      setTransfer(blankTransfer(system));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [system])

  ///// App Body /////
  return (
    <>
      <Navbar showHelp={showHelp} setShowHelp={setShowHelp} />
      <Stack sx={{mx: 4, my: 1}}>
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
          <Grid item xs={12} sm={11} md={4} lg={3} xl={2}>
            <Paper 
              elevation={1}
              sx={{
                my: 1, 
                mx: 1, 
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <MissionControls />
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
              <PorkchopPlot 
                plotCount={plotCount}
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
                <OrbitDisplayTabs />
            </Paper>
          </Grid>
          <Grid item xs={10} sm={8} md={7} lg={4} xl={3}>
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
                <TransferInfo />
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
    </>
  )
}

function TransferApp() {
  return <>{TransferAppContent()}</>
}

export default React.memo(TransferApp);
