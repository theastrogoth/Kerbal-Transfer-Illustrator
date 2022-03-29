import { OrbitingBody } from './main/objects/body';
import SolarSystem from './main/objects/system';
import Orbit from './main/objects/orbit';
import Vessel from './main/objects/vessel';
import Kepler from './main/libs/kepler';
import FlybyCalcs from './main/libs/flybycalcs';
import MultiFlyby from './main/objects/multiflyby';

import kspbodies from './data/kspbodies.json';

import { DateFieldState } from './components/DateField';
import { DateControlsState } from './components/FlybyApp/DateControls';
import { TimeSettingsControlsState } from "./components/TimeSettingsControls";
import { OrbitControlsState } from './components/OrbitControls';
import { ControlsOptionsState } from './components/ControlsOptions';

import MissionControls from './components/FlybyApp/MissionControls'
import EvolutionPlot from './components/FlybyApp/EvolutionPlot';
import OrbitDisplayTabs from './components/FlybyApp/OrbitDisplayTabs';
import MultiFlybyInfo from './components/FlybyApp/MultiFlybyInfo';

import './App.css';
import { useState } from "react";
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
import TopButtonControls from './components/FlybyApp/TopButtonControls';




// load KSP system
const bodiesData = {
    sun:      kspbodies[0]       as ICelestialBody,
    orbiters: kspbodies.slice(1) as IOrbitingBody[]
};
const kspSystem = new SolarSystem(bodiesData.sun, bodiesData.orbiters, true);
  
// Time Settings
const kspTimeSettings:   TimeSettings = {hoursPerDay: 6,   daysPerYear: 426};

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

// constant functions
function dateFieldIsEmpty(field: DateFieldState): boolean {
  return ((field.year === '') && (field.day === '') && (field.hour === ''))
}

function timeFromDateFieldState(state: DateFieldState, timeSettings: TimeSettings, yearOffset: number = 1, dayOffset: number = 1): number {
  const years = state.year === "" ? 0 : parseFloat(state.year) - yearOffset;
  const days  = state.day  === "" ? 0 : parseFloat(state.day)  - dayOffset;
  const hours = state.hour === "" ? 0 : parseFloat(state.hour);
  return ( (timeSettings.daysPerYear * years + days) * timeSettings.hoursPerDay + hours ) * 3600
}

function orbitFromControlsState(system: SolarSystem, state: OrbitControlsState): Orbit {
  const body = system.bodyFromId(state.bodyId);
  return new Orbit(Kepler.orbitFromElements(
    {
      orbiting:         state.bodyId,
      semiMajorAxis:    parseFloat(state.sma),
      eccentricity:     parseFloat(state.ecc),
      inclination:      parseFloat(state.inc),
      argOfPeriapsis:   parseFloat(state.arg),
      ascNodeLongitude: parseFloat(state.lan),
      meanAnomalyEpoch: parseFloat(state.moe),
      epoch:            parseFloat(state.epoch),
    },
    body
  ), body, true)
}

function flightTimesBounds(system: SolarSystem, startOrbit: Orbit, endOrbit: Orbit, flybyIdSequence: number[]) {
  const transferBodyId = system.commonAttractorId(startOrbit.orbiting, endOrbit.orbiting);
  const transferBody = system.bodyFromId(transferBodyId);
  let startBodyId = startOrbit.orbiting;
  while (startBodyId !== transferBodyId && !transferBody.orbiterIds.includes(startBodyId)) {
    startBodyId = (system.bodyFromId(startBodyId) as OrbitingBody).orbiting;
  }
  let endBodyId = endOrbit.orbiting;
  while (endBodyId !== transferBodyId && !transferBody.orbiterIds.includes(endBodyId)) {
    endBodyId = (system.bodyFromId(endBodyId) as OrbitingBody).orbiting;
  }

  let sOrb: IOrbit;
  let eOrb: IOrbit;
  const ftBounds: {lb: number, ub: number}[] = [];
  for(let i=0; i<=flybyIdSequence.length; i++) {
    if(i === 0) {
      sOrb = transferBodyId === startOrbit.orbiting ? startOrbit : (system.bodyFromId(startBodyId) as OrbitingBody).orbit;
    } else {
      sOrb = (system.bodyFromId(flybyIdSequence[i - 1]) as OrbitingBody).orbit;
    }
    if(i === flybyIdSequence.length) {
      eOrb = transferBodyId === endOrbit.orbiting   ? endOrbit   : (system.bodyFromId(endBodyId)   as OrbitingBody).orbit; 
    } else {
      eOrb = (system.bodyFromId(flybyIdSequence[i]) as OrbitingBody).orbit;
    }
    ftBounds.push(FlybyCalcs.legDurationBounds(sOrb, eOrb, transferBody));
  }
  return {flightTimesMin: ftBounds.map(b => b.lb), flightTimesMax: ftBounds.map(b => b.ub)}
}

function isInvalidOrbitInput(ocState: OrbitControlsState): boolean {
  let invalid = false;
  const a = parseFloat(ocState.sma);
  const e = parseFloat(ocState.ecc);

  invalid = isNaN(ocState.bodyId) ? true : invalid;
  invalid = isNaN(a) ? true : invalid;
  invalid = isNaN(e) ? true : invalid;
  invalid = isNaN(parseFloat(ocState.inc)) ? true : invalid;
  invalid = isNaN(parseFloat(ocState.arg)) ? true : invalid;
  invalid = isNaN(parseFloat(ocState.lan)) ? true : invalid;
  invalid = isNaN(parseFloat(ocState.moe)) ? true : invalid;
  invalid = isNaN(parseFloat(ocState.epoch)) ? true : invalid;

  invalid = e === 1 ? true : invalid;
  invalid = a > 0 && e > 1 ? true : invalid;
  invalid = a < 0 && e < 1 ? true : invalid;
  return invalid;
}

function searchInputsFromUI(system: SolarSystem, startOrbitControlsState: OrbitControlsState, endOrbitControlsState: OrbitControlsState, flybyIdSequence: number[], earlyStartField: DateFieldState, 
                            lateStartField: DateFieldState, planeChange: boolean, matchStartMo: boolean, matchEndMo: boolean, oberthManeuvers: boolean, noInsertionBurn: boolean, timeSettings: TimeSettings): MultiFlybySearchInputs {
  const startDateMin   = dateFieldIsEmpty(earlyStartField) ? 0.0 : timeFromDateFieldState(earlyStartField, timeSettings, 1, 1); 
  const startDateMax   = dateFieldIsEmpty(lateStartField)  ? startDateMin + 5 * 365 * 24 * 3600 : timeFromDateFieldState(lateStartField, timeSettings, 1, 1);
  const startOrbit     = orbitFromControlsState(system, startOrbitControlsState);
  const endOrbit       = orbitFromControlsState(system, endOrbitControlsState);
  const ftBounds       = flightTimesBounds(system, startOrbit, endOrbit, flybyIdSequence);
  const flightTimesMin = ftBounds.flightTimesMin;
  const flightTimesMax = ftBounds.flightTimesMax;
  return {
    system,
    startOrbit,
    endOrbit,
    flybyIdSequence,
    startDateMin,
    startDateMax,
    flightTimesMin,
    flightTimesMax,
    planeChange,
    matchStartMo,
    matchEndMo,
    noInsertionBurn,
    ejectionInsertionType: oberthManeuvers ? "fastoberth" : "fastdirect",
  }
}

// other constants
const blankMultiFlyby: MultiFlyby = new MultiFlyby({
  system:                 kspSystem,
  startOrbit:             (kspSystem.bodyFromId(2) as OrbitingBody).orbit,
  endOrbit:               (kspSystem.bodyFromId(2) as OrbitingBody).orbit,
  flybyIdSequence:        [],
  transferBody:           kspSystem.sun,
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

const system = kspSystem;
const emptyVessels: Vessel[] = [];


///// App Content /////
function FlybyAppContent() {

  const [vessels, setVessels] = useState(emptyVessels);

  ///// Starting orbit states /////
  const [startVesselId, setStartVesselId] = useState(-1);
  const [startBodyId, setStartBodyId] = useState(1);
  const [startSma, setStartSma] = useState(String(100000 + system.bodyFromId(startBodyId).radius));
  const [startEcc, setStartEcc] = useState('0');
  const [startInc, setStartInc] = useState('0');
  const [startArg, setStartArg] = useState('0');
  const [startLan, setStartLan] = useState('0');
  const [startMoe, setStartMoe] = useState('0');
  const [startEpoch, setStartEpoch] = useState('0');

  const startOrbitControlsState: OrbitControlsState = {
    vesselId:    startVesselId,
    bodyId:      startBodyId,
    sma:         startSma,
    ecc:         startEcc,
    inc:         startInc,
    arg:         startArg,
    lan:         startLan,
    moe:         startMoe,
    epoch:       startEpoch,
    setVesselId: setStartVesselId,
    setBodyId:   setStartBodyId,
    setSma:      setStartSma,
    setEcc:      setStartEcc,
    setInc:      setStartInc,
    setArg:      setStartArg,
    setLan:      setStartLan,
    setMoe:      setStartMoe,
    setEpoch:    setStartEpoch,
  };


  ////// Target orbit states /////
  const [endVesselId, setEndVesselId] = useState(-1);
  const [endBodyId, setEndBodyId] = useState(16);
  const [endSma, setEndSma] = useState(String(100000 + system.bodyFromId(endBodyId).radius));
  const [endEcc, setEndEcc] = useState('0');
  const [endInc, setEndInc] = useState('0');
  const [endArg, setEndArg] = useState('0');
  const [endLan, setEndLan] = useState('0');
  const [endMoe, setEndMoe] = useState('0');
  const [endEpoch, setEndEpoch] = useState('0');

  const endOrbitControlsState: OrbitControlsState = {
    vesselId:    endVesselId,
    bodyId:      endBodyId,
    sma:         endSma,
    ecc:         endEcc,
    inc:         endInc,
    arg:         endArg,
    lan:         endLan,
    moe:         endMoe,
    epoch:       endEpoch,
    setVesselId: setEndVesselId,
    setBodyId:   setEndBodyId,
    setSma:      setEndSma,
    setEcc:      setEndEcc,
    setInc:      setEndInc,
    setArg:      setEndArg,
    setLan:      setEndLan,
    setMoe:      setEndMoe,
    setEpoch:    setEndEpoch,
  }

  ///// Time Settings /////
  const [timeSettings, setTimeSettings] = useState(kspTimeSettings);

  const timeSettingsControlsState: TimeSettingsControlsState = {
    timeSettings,
    setTimeSettings,
  }

  ///// Date parameters states /////
  const [earlyStartYear, setEarlyStartYear] = useState('1')
  const [earlyStartDay, setEarlyStartDay] = useState('1')
  const [earlyStartHour, setEarlyStartHour] = useState('0')
  const earlyStartField: DateFieldState = {
    year:     earlyStartYear,
    day:      earlyStartDay,
    hour:     earlyStartHour,
    setYear:  setEarlyStartYear,
    setDay:   setEarlyStartDay,
    setHour:  setEarlyStartHour,
  }

  const [lateStartYear, setLateStartYear] = useState('')
  const [lateStartDay, setLateStartDay] = useState('')
  const [lateStartHour, setLateStartHour] = useState('')
  const lateStartField: DateFieldState = {
    year:     lateStartYear,
    day:      lateStartDay,
    hour:     lateStartHour,
    setYear:  setLateStartYear,
    setDay:   setLateStartDay,
    setHour:  setLateStartHour,
  }

  const dateControlsState: DateControlsState = {
    earlyStartDate:   earlyStartField,
    lateStartDate:    lateStartField,
  }


  ///// Flyby sequence state /////
  const [flybyIdSequence, setFlybyIdSequence] = useState([5, 8]);

  const flybySequenceControlsState = {
    system,            
    startBodyId,        
    endBodyId,         
    flybyIdSequence,    
    setFlybyIdSequence, 
  };


  ///// Mission Settings states /////
  const [planeChange, setPlaneChange] = useState(false);
  const [matchStartMo, setMatchStartMo] = useState(true);
  const [matchEndMo, setMatchEndMo] = useState(false);
  const [oberthManeuvers, setOberthManeuvers] = useState(false);
  const [noInsertionBurn, setNoInsertionBurn] = useState(false);

  const controlsOptionsState: ControlsOptionsState = {
    planeChange,
    matchStartMo,
    matchEndMo,
    oberthManeuvers,
    noInsertionBurn,
    setPlaneChange,
    setMatchStartMo,
    setMatchEndMo,
    setOberthManeuvers,
    setNoInsertionBurn,
  }


  ///// Multi-flyby search inputs /////
  const [mfSearchInputs, setMfSearchInputs] = useState(searchInputsFromUI(system, startOrbitControlsState, endOrbitControlsState, flybyIdSequence, earlyStartField,
                                                                          lateStartField, planeChange, matchStartMo, matchEndMo, oberthManeuvers, noInsertionBurn, timeSettings))

  ///// Multi-flyby trajectory /////
  const [multiFlyby, setMultiFlyby] = useState(blankMultiFlyby);


  ///// invalid input alert /////
  const [invalidInput, setInvalidInput] = useState(false);


  ///// Search Button /////
  const [buttonPresses, setButtonPresses] = useState(0);
  const [searchCount, setSearchCount] = useState(0);
  const [calculating, setCalculating] = useState(false);

  function handleButtonPress() {
    // update orbits
    let invalid = isInvalidOrbitInput(startOrbitControlsState);
    invalid = isInvalidOrbitInput(endOrbitControlsState) ? true : invalid;

    // check to make sure the start and end orbits share a near-enough common parent
    const transferBody = system.bodyFromId(system.commonAttractorId(startBodyId, endBodyId));
    // invalid = transferBody.orbiterIds.includes(startBodyId) || transferBody.id === startBodyId ? invalid: true;
    // invalid = transferBody.orbiterIds.includes(endBodyId)   || transferBody.id === endBodyId   ? invalid: true;

    // make sure that the flyby sequence contains appropriate bodies.
    for(let i=0; i<flybyIdSequence.length; i++) {
      invalid = transferBody.orbiterIds.includes(flybyIdSequence[i]) ? invalid : true;
    }

    // display a warning and do not calculate a Porkchop if the inputs are invalid
    if(invalid) {
      setInvalidInput(invalid);
      return
    }

    const newMfSearchInputs = searchInputsFromUI(system, startOrbitControlsState, endOrbitControlsState, flybyIdSequence, earlyStartField,
                                                 lateStartField, planeChange, matchStartMo, matchEndMo, oberthManeuvers, noInsertionBurn, timeSettings);

    setMfSearchInputs(newMfSearchInputs);
    setButtonPresses(buttonPresses + 1);

    console.log('"Search Trajectories" button pressed.');
  }

  return (
      <ThemeProvider theme={mdTheme}>
      <Stack sx={{mx: 4, my: 1, minWidth: "1200px"}}>
        <CssBaseline />
        <Box textAlign='left' sx={{mx: 2, my: 1}}>
          <Typography variant="h4">Kerbal Flyby Illustrator</Typography>
          <Divider />
        </Box>
        <TopButtonControls
          system={system}
          setVessels={setVessels}
        />
        <Collapse in={invalidInput}>
          <Alert severity='error'>
            <AlertTitle>Error</AlertTitle>
            Mission inputs are invalid. Check for boxes outlined in red under "Orbit Settings". Make sure your Flyby Sequence fields have been filled.
          </Alert>
        </Collapse>
        <Grid container component='main' justifyContent="center">
          <Grid item xs={3} xl={2}>
            <Paper 
              elevation={3}
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
                dateControlsState={dateControlsState}
                timeSettingsControlsState={timeSettingsControlsState}
                controlsOptionsState={controlsOptionsState}
                />
            </Paper>
          </Grid>
          <Grid item xs={5} xl={6}>
            <Paper 
              elevation={3}
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
                buttonPresses={buttonPresses} 
                searchCount={searchCount} 
                setMultiFlyby={setMultiFlyby}
                setCalculating={setCalculating}
                setSearchCount={setSearchCount}
              />
            </Paper>
            <Paper 
                elevation={3}
                sx={{
                  my: 1, 
                  mx: 1,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <OrbitDisplayTabs multiFlyby={multiFlyby} timeSettings={timeSettings} setMultiFlyby={setMultiFlyby}/>
            </Paper>
          </Grid>
          <Grid item xs={4} xl={4}>
            <Fade in={searchCount > 0} timeout={400}>
              <Paper
                elevation={3}
                sx={{
                  my: 1, 
                  mx: 1,
                  display: 'flex',
                  flexDirection: 'column',
              }}
              >
                <MultiFlybyInfo multiFlyby={multiFlyby} timeSettings={timeSettings}/>
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

function FlybyApp() {
    return <>{FlybyAppContent()}</>
}
  
export default FlybyApp;
  