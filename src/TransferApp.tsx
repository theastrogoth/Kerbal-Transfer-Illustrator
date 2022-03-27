import { OrbitingBody } from './main/objects/body';
import SolarSystem from './main/objects/system';
import Orbit from './main/objects/orbit';
import Vessel from './main/objects/vessel';
import Transfer from './main/objects/transfer';
import Kepler from './main/libs/kepler';

import kspbodies from './data/kspbodies.json';

import { DateFieldState } from './components/DateField';
import { DateControlsState } from './components/TransferApp/DateControls';
import { TimeSettingsControlsState } from "./components/TimeSettingsControls";
import { OrbitControlsState } from './components/OrbitControls';
import {ControlsOptionsState } from './components/ControlsOptions';

import MissionControls from './components/TransferApp/MissionControls'
import PorkchopPlot from './components/TransferApp/PorkChopPlot';
import OrbitDisplayTabs from './components/TransferApp/OrbitDisplayTabs';
import TransferInfo from './components/TransferApp/TransferInfo';
import TopButtonControls from './components/TransferApp/TopButtonControls';

import './App.css';
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
import CircularProgress from "@mui/material/CircularProgress";
import Fade from '@mui/material/Fade';


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

function defaultPorkchopTimes(system: SolarSystem, startOrbit: IOrbit, endOrbit: IOrbit, earlyStartDate: number): number[] {
  const transferBodyId = system.commonAttractorId(startOrbit.orbiting, endOrbit.orbiting);
  const transferBody = system.bodyFromId(transferBodyId);
  let sOrb = startOrbit;
  let sBody = system.bodyFromId(startOrbit.orbiting) as OrbitingBody;
  if(sBody.id !== transferBodyId) {
    while(sBody.orbiting !== transferBodyId) {
      sBody = system.bodyFromId(sBody.orbiting) as OrbitingBody;
    }
    sOrb = sBody.orbit;
  }
  let eOrb = endOrbit;
  let eBody = system.bodyFromId(endOrbit.orbiting) as OrbitingBody;
  if(eBody.id !== transferBodyId) {
    while(eBody.orbiting !== transferBodyId) {
      eBody = system.bodyFromId(eBody.orbiting) as OrbitingBody;
    }
    eOrb = eBody.orbit;
  }
  // for start date range, cover a little more than a full rotation of one orbit relative to the other
  // unless the two orbits have close to the same period, in which case cover a full revolution of the starting orbit
  const relativePeriod = Math.abs(eOrb.siderealPeriod - sOrb.siderealPeriod) < 1.0 ? sOrb.siderealPeriod : 1.25 * Math.abs(1 / (1 / eOrb.siderealPeriod - 1 / sOrb.siderealPeriod));
  const lateStartDate = earlyStartDate + Math.min(3 * sOrb.siderealPeriod, relativePeriod);
  // for the flight time range, use the apoapses of sOrb and eOrb (the largest possible axis of a Hohmann transfer will be the summed apoapses)
  const hohmannAxis = Math.max(Math.abs(sOrb.semiMajorAxis * (1 - sOrb.eccentricity)) + Math.abs(eOrb.semiMajorAxis * (1 + eOrb.eccentricity)), 
                               Math.abs(sOrb.semiMajorAxis * (1 + sOrb.eccentricity)) + Math.abs(eOrb.semiMajorAxis * (1 - eOrb.eccentricity)));
  const hohmannPeriod = Kepler.siderealPeriod(hohmannAxis/2, transferBody.stdGravParam);
  const shortFlightTime = hohmannPeriod / 4;
  const longFlightTime = hohmannPeriod;
  // return the 3 computed times
  return [lateStartDate, shortFlightTime, longFlightTime]
}

function porkchopInputsFromUI(system: SolarSystem, startOrbitControlsState: OrbitControlsState, endOrbitControlsState: OrbitControlsState,
                              earlyStartField: DateFieldState, lateStartField: DateFieldState, shortFlightField: DateFieldState, longFlightField: DateFieldState,
                              planeChange: boolean, matchStartMo: boolean, matchEndMo: boolean, noInsertionBurn: boolean, timeSettings: TimeSettings): PorkchopInputs {
  const startOrbit     = orbitFromControlsState(system, startOrbitControlsState);
  const endOrbit       = orbitFromControlsState(system, endOrbitControlsState);

  // set start dates and durations
  const startDateMin = timeFromDateFieldState(earlyStartField, timeSettings, 1, 1)
  const defaultTimes   = defaultPorkchopTimes(system, startOrbit, endOrbit, startDateMin)

  let startDateMax = defaultTimes[0];
  if(!dateFieldIsEmpty(lateStartField)) {
    const fieldTime = timeFromDateFieldState(lateStartField, timeSettings, 1, 1);
    startDateMax = fieldTime > startDateMin ? fieldTime : startDateMax;
  }
  let flightTimeMin = defaultTimes[1]
  if(!dateFieldIsEmpty(shortFlightField)) {
    const fieldTime = timeFromDateFieldState(shortFlightField, timeSettings, 0, 0);
    flightTimeMin = fieldTime > 0 ? fieldTime : flightTimeMin;
  }
  let flightTimeMax = defaultTimes[2]
  if(!dateFieldIsEmpty(longFlightField)) {
    const fieldTime = timeFromDateFieldState(longFlightField, timeSettings, 0, 0);
    flightTimeMax = fieldTime > flightTimeMin ? fieldTime : flightTimeMax;
  }

  return {
  system,
  startOrbit,
  endOrbit,
  startDateMin,
  startDateMax,
  flightTimeMin,
  flightTimeMax,
  nTimes:                51,
  ejectionInsertionType: "oberth",
  planeChange,
  matchStartMo,
  matchEndMo, 
  noInsertionBurn,
  }
}

// other constants
const system = kspSystem;
const emptyVessels: Vessel[] = [];




////////// App Content //////////

function TransferAppContent() { 

  ///// System (TODO: provide other loadable systems, like RSS and OPM) /////
  // const [system, setSystem] = useState(kspSystem)

  ///// Save Upload Button /////

  const [vessels, setVessels]: [Vessel[], React.Dispatch<React.SetStateAction<Vessel[]>>] = useState(emptyVessels);


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
  const [endBodyId, setEndBodyId] = useState(6);
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

  const [shortFlightYear, setShortFlightYear] = useState('')
  const [shortFlightDay, setShortFlightDay] = useState('')
  const [shortFlightHour, setShortFlightHour] = useState('')
  const shortFlightField: DateFieldState = {
    year:     shortFlightYear,
    day:      shortFlightDay,
    hour:     shortFlightHour,
    setYear:  setShortFlightYear,
    setDay:   setShortFlightDay,
    setHour:  setShortFlightHour,
  }

  const [longFlightYear, setLongFlightYear] = useState('')
  const [longFlightDay, setLongFlightDay] = useState('')
  const [longFlightHour, setLongFlightHour] = useState('')
  const longFlightField: DateFieldState = {
    year:     longFlightYear,
    day:      longFlightDay,
    hour:     longFlightHour,
    setYear:  setLongFlightYear,
    setDay:   setLongFlightDay,
    setHour:  setLongFlightHour,
  }

  const dateControlsState: DateControlsState = {
    earlyStartDate:   earlyStartField,
    lateStartDate:    lateStartField,
    shortFlightTime:  shortFlightField,
    longFlightTime:   longFlightField,
  }



  ///// Transfer controls states /////
  const [planeChange, setPlaneChange] = useState(false);
  const [matchStartMo, setMatchStartMo] = useState(true);
  const [matchEndMo, setMatchEndMo] = useState(false);
  const [noInsertionBurn, setNoInsertionBurn] = useState(false);

  const controlsOptionsState: ControlsOptionsState = {
    planeChange,
    matchStartMo,
    matchEndMo,
    noInsertionBurn,
    setPlaneChange,
    setMatchStartMo,
    setMatchEndMo,
    setNoInsertionBurn,
  }


  ///// Transfer and Orbit Plots /////
  const [transfer, setTransfer] = useState(new Transfer({
    system,
    startOrbit:             (system.bodyFromId(1) as OrbitingBody).orbit,
    endOrbit:               (system.bodyFromId(1) as OrbitingBody).orbit,
    startDate:              0.0,
    flightTime:             (system.bodyFromId(1) as OrbitingBody).orbit.siderealPeriod,
    endDate:                (system.bodyFromId(1) as OrbitingBody).orbit.siderealPeriod,
    transferTrajectory:     {orbits: [], intersectTimes: [], maneuvers: []},
    ejections:              [],
    insertions:             [],
    maneuvers:              [],
    deltaV:                 0.0,
    ejectionInsertionType:  "simple",
    planeChange:            false,
    matchStartMo:           true,
    matchEndMo:             false,
    noInsertionBurn:        false,
    soiPatchPositions:      [],
    patchPositionError:     0,
    patchTimeError:         0,
  }));


  ///// Porkchop Plot /////
  const [porkchopInputs, setPorkchopInputs] = useState({system, startOrbit: orbitFromControlsState(system, startOrbitControlsState), endOrbit: orbitFromControlsState(system, endOrbitControlsState), startDateMin: 0.0, startDateMax: 12960000.0, flightTimeMin: 17280000.0, flightTimeMax: 0.0, nTimes: 0} as PorkchopInputs);


  ///// invalid input alert /////
  const [invalidInput, setInvalidInput] = useState(false);
  

  ///// Plot Button /////
  const [plotCount, setPlotCount] = useState(0);
  const [porkCalculating, setPorkCalculating] = useState(false);

  function handlePlotButtonPress() {
    
    // ensure there are no invalid orbit inputs
    let invalidFlag = isInvalidOrbitInput(startOrbitControlsState);
    invalidFlag = isInvalidOrbitInput(endOrbitControlsState) ? true : invalidFlag;
    
    // display a warning and do not calculate a Porkchop if the inputs are invalid
    if(invalidFlag) {
      setInvalidInput(invalidFlag);
      return
    }

    // prepare porkchop inputs
    const porkInputs = porkchopInputsFromUI(system, startOrbitControlsState, endOrbitControlsState, earlyStartField, lateStartField, shortFlightField, longFlightField, 
                                            planeChange, matchStartMo, matchEndMo, noInsertionBurn, timeSettings);

    setPorkchopInputs(porkInputs);
    console.log('"Plot!" button pressed.');
  }

  ///// App Body /////
  return (
    <ThemeProvider theme={mdTheme}>
      <Stack sx={{mx: 4, my: 1, minWidth: "1200px"}}>
        <CssBaseline />
        <Box textAlign='left' sx={{mx: 2, my: 1}}>
          <Typography variant="h4">Kerbal Transfer Illustrator</Typography>
          <Divider />
        </Box>
        <TopButtonControls
          system={system}
          setVessels={setVessels}
        />
        <Collapse in={invalidInput}>
          <Alert severity='error'>
            <AlertTitle>Error</AlertTitle>
            Orbit inputs are invalid. Check for boxes outlined in red under "Orbit Settings".
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
                endOrbitControlsState= {endOrbitControlsState} 
                dateControlsState={dateControlsState}
                controlsOptionsState={controlsOptionsState}
                timeSettingsControlsState={timeSettingsControlsState}
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
                timeSettings={timeSettings}
                transfer={transfer}
                plotCount={plotCount}
                setTransfer={setTransfer}
                setCalculating={setPorkCalculating}
                setPlotCount={setPlotCount}
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
                <OrbitDisplayTabs transfer={transfer} setTransfer={setTransfer} timeSettings={timeSettings}/>
            </Paper>
          </Grid>
          <Grid item xs={4} xl={4}>
            <Fade in={plotCount > 0} timeout={400}>
              <Paper
                elevation={3}
                sx={{
                  my: 1, 
                  mx: 1,
                  display: 'flex',
                  flexDirection: 'column',
              }}
              >
                <TransferInfo transfer={transfer} timeSettings={timeSettings}/>
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

function TransferApp() {
  return <>{TransferAppContent()}</>
}

export default TransferApp;
