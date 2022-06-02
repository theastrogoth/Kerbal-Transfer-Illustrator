import { useEffect, useState } from 'react';
import {Routes, Route } from 'react-router-dom';
import useMediaQuery from '@mui/material/useMediaQuery';
import { createTheme } from '@mui/material/styles';
import { PaletteMode } from '@mui/material';
import './App.css';

import TransferApp, { blankTransfer } from './pages/Transfer';
import FlybyApp, { blankMultiFlyby } from './pages/Flyby';
import ManeuversApp from './pages/Maneuvers';
import SolarSystemApp from './pages/System';

import kspbodies from './data/kspbodies.json';
import opmbodies from './data/opmbodies.json';
import rssbodies from './data/rssbodies.json';

import SolarSystem from './main/objects/system';
import Vessel from './main/objects/vessel';
import loadSystemData from './main/utilities/loadSystem';

import { DateControlsState } from './components/Transfer/DateControls';
import { FlybyDateControlsState } from './components/Flyby/FlybyDateControls';
import { defaultManeuverComponents, defaultOrbit, useControlOptions, useDateField, useOrbitControls } from './utils';
import { EvolutionPlotData } from './components/Flyby/EvolutionPlot';
import { DynamicDateFieldState } from './components/DynamicDateFields';
import { ThemeProvider } from '@emotion/react';

import { atom, useAtom } from 'jotai';
// import { atomWithHash } from 'jotai/utils';

// prepare popular systems
const kspSystem = loadSystemData(kspbodies);
const opmSystem = loadSystemData(opmbodies);
const rssSystem = loadSystemData(rssbodies);

const systemOptions = new Map<string, SolarSystem>()
systemOptions.set('Kerbol System', kspSystem);
systemOptions.set('Kerbol System (OPM)', opmSystem);
systemOptions.set('Sol System (RSS)', rssSystem);

// other default settings
const kspTimeSettings: TimeSettings = {hoursPerDay: 6, daysPerYear: 426};

const emptyVessels: Vessel[] = [];
const emptyNumberArray: number[] = [];
const blankFlightPlan: IVessel = {name: 'Blank Flight Plan', maneuvers: [], orbit: defaultOrbit(kspSystem, 1)};

// initial values
const blankInitialTransfer = blankTransfer(kspSystem);

const initialPorkchopInputs: PorkchopInputs = {
  system: kspSystem, 
  startOrbit: blankInitialTransfer.startOrbit,
  endOrbit: blankInitialTransfer.endOrbit,
  startDateMin: 0.0, 
  startDateMax: 0.0, 
  flightTimeMin: 0.0, 
  flightTimeMax: 0.0, 
  nTimes: 0,
}
const initialPorkchopPlotData: PorkchopPlotData = {
  deltaVs:            [[0]],
  startDates:         [0],
  flightTimes:        [0],
  logDeltaVs:         [[0]],
  startDays:          [0],
  flightDays:         [0],
  levels:             [0],
  logLevels:          [0],
  tickLabels:         [""],
  bestTransfer:       blankInitialTransfer.data,
  transferStartDay:   0,
  transferFlightDay:  0,
}

// common parts of the state (atoms)
export const lightModeAtom = atom('light' as PaletteMode);

export const systemOptionsAtom = atom(systemOptions);
export const systemAtom = atom(kspSystem);
export const systemNameAtom = atom([...systemOptions.keys()][0]);
export const vesselsAtom = atom(emptyVessels);
export const timeSettingsAtom = atom(kspTimeSettings);

export const copiedOrbitAtom = atom(defaultOrbit(kspSystem) as IOrbit);
export const copiedManeuverAtom = atom(defaultManeuverComponents());
export const copiedFlightPlanAtom = atom(blankFlightPlan);

// transfer planner state (atoms)
export const transferAtom = atom(blankInitialTransfer);
export const porkchopInputsAtom = atom(initialPorkchopInputs);
export const porkchopPlotDataAtom = atom(initialPorkchopPlotData);

// flyby planner state (atoms)
export const multiFlybyAtom = atom(blankMultiFlyby(kspSystem));

// flight planner state (atoms)

// SWAP THE FOLLOWING TWO LINES TO SAVE FLIGHT PLAN STATE IN URL
// export const vesselPlansAtom = atomWithHash("vesselPlans", [] as IVessel[]);
export const vesselPlansAtom = atom([] as IVessel[]);

export const flightPlansAtom = atom([] as FlightPlan[]);

function AppBody() {
  const [mode, setMode] = useAtom(lightModeAtom);

  // MUI theme
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const theme = createTheme({
    breakpoints: {
      values: {
          xs: 0,
          sm: 750,
          md: 1030,
          lg: 1500,
          xl: 1800,
      },
    },
    palette: {
      mode: mode,
    },
  });

  useEffect(() => {
    setMode((prefersDarkMode ? 'dark' : 'light') as PaletteMode)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefersDarkMode])

  // state for transfer calculator
  const transferStartOrbit = useOrbitControls(kspSystem, 1);
  const transferEndOrbit = useOrbitControls(kspSystem, 6);

  const transferEarlyStartDate = useDateField(1, 1, 0);
  const transferLateStartDate = useDateField();
  const transferShortFlightTime = useDateField();
  const transferLongFlightTime = useDateField();
  const transferDateControlsState: DateControlsState = {
    earlyStartDate:     transferEarlyStartDate,
    lateStartDate:      transferLateStartDate,
    shortFlightTime:    transferShortFlightTime,
    longFlightTime:     transferLongFlightTime,
  }

  const transferControlsState = useControlOptions();

  // state for flyby calculator
  const flybyStartOrbit= useOrbitControls(kspSystem, 1);
  const flybyEndOrbit  = useOrbitControls(kspSystem, 16);

  const flybyEarlyStartDate = useDateField(1, 1, 0);
  const flybyLateStartDate= useDateField();
  const [flybyFlightYears, setFlybyFlightYears] = useState(['', '', '', '', '', '']);
  const [flybyFlightDays, setFlybyFlightDays]   = useState(['', '', '', '', '', '']);
  const [flybyFlightHours, setFlybyFlightHours] = useState(['', '', '', '', '', '']);
  const flybyFlightTimes: DynamicDateFieldState = {
    years:    flybyFlightYears,
    days:     flybyFlightDays,
    hours:    flybyFlightHours,
    setYears: setFlybyFlightYears,
    setDays:  setFlybyFlightDays,
    setHours: setFlybyFlightHours,
  }
  const flybyDateControlsState: FlybyDateControlsState = {
    earlyStartDate:     flybyEarlyStartDate,
    lateStartDate:      flybyLateStartDate,
    flightTimes:        flybyFlightTimes,
  }

  const [flybyIdSequence, setFlybyIdSequence] = useState([5, 8]);
  const flybySequenceControlsState = {
    startBodyId:        flybyStartOrbit.orbit.orbiting,        
    endBodyId:          flybyEndOrbit.orbit.orbiting,         
    flybyIdSequence,    
    setFlybyIdSequence, 
    dateControlsState:  flybyDateControlsState,
  };

  const flybyControlsState = useControlOptions();

  const [x, setX] = useState(emptyNumberArray)
  const [meanY, setMeanY] = useState(emptyNumberArray)
  const [bestY, setBestY] = useState(emptyNumberArray)

  const evolutionPlotData: EvolutionPlotData = {
    x,
    setX,
    meanY,
    setMeanY,
    bestY,
    setBestY,
  }

  const [flybySearchCount, setFlybySearchCount] = useState(0);

  // state for flight plan illustrator
  // nothing here

  return (
    <ThemeProvider theme={theme}>
      <Routes>
        <Route path='/' element={<TransferApp
          startOrbitControlsState={transferStartOrbit}
          endOrbitControlsState={transferEndOrbit}
          dateControlsState={transferDateControlsState}
          controlsOptionsState={transferControlsState}
        />} />
        <Route path='/Flyby/' element={<FlybyApp 
          startOrbitControlsState={flybyStartOrbit}
          endOrbitControlsState={flybyEndOrbit}
          flybySequenceControlsState={flybySequenceControlsState}
          dateControlsState={flybyDateControlsState}
          controlsOptionsState={flybyControlsState}
          evolutionPlotData={evolutionPlotData}
          searchCount={flybySearchCount}
          setSearchCount={setFlybySearchCount}
        />} />
        <Route path='/FlightPlan/' element={<ManeuversApp />} />
        <Route path='/System/' element={<SolarSystemApp />} />
      </Routes>
    </ThemeProvider>
  );
}

function App() {
  return (
    <AppBody />
  )
}

export default App;