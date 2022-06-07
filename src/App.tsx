import { useEffect } from 'react';
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

import { defaultManeuverComponents, defaultOrbit, makeDateFields } from './utils';
import { EvolutionPlotData } from './components/Flyby/EvolutionPlot';
import { ThemeProvider } from '@emotion/react';

import { PrimitiveAtom, atom, useAtom } from 'jotai';

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
export const vesselsAtom = atom([] as Vessel[]);
export const timeSettingsAtom = atom(kspTimeSettings);

export const copiedOrbitAtom = atom(defaultOrbit(kspSystem) as IOrbit);
export const copiedManeuverAtom = atom(defaultManeuverComponents());
export const copiedFlightPlanAtom = atom(blankFlightPlan);

export const customSystemAtom = atom(kspSystem);

// transfer planner state (atoms)
export const transferStartOrbitAtom = atom(defaultOrbit(kspSystem, 1) as OrbitalElements);
export const transferEndOrbitAtom = atom(defaultOrbit(kspSystem, 6) as OrbitalElements);
export const transferEarlyStartDateAtom = atom(makeDateFields(1,1,0));
export const transferLateStartDateAtom = atom(makeDateFields()); 
export const transferShortFlightTimeAtom = atom(makeDateFields());
export const transferLongFlightTimeAtom = atom(makeDateFields()); 
export const transferAtom = atom(blankInitialTransfer);
export const porkchopInputsAtom = atom(initialPorkchopInputs);
export const porkchopPlotDataAtom = atom(initialPorkchopPlotData);
export const transferControlsOptionsAtom = atom({
    planeChange:        false,
    matchStartMo:       true,
    matchEndMo:         false,
    oberthManeuvers:    false,
    noInsertionBurn:    false,
});

// flyby planner state (atoms)
export const multiFlybyStartOrbitAtom = atom(defaultOrbit(kspSystem, 1) as OrbitalElements);
export const multiFlybyEndOrbitAtom = atom(defaultOrbit(kspSystem, 16) as OrbitalElements);
export const flybyIdSequenceAtom = atom([5, 8]);
export const multiFlybyEarlyStartDateAtom = atom(makeDateFields(1,1,0));
export const multiFlybyLateStartDateAtom = atom(makeDateFields());
export const multiFlybyFlightTimesAtomsAtom = atom<PrimitiveAtom<CalendarDate>[]>([atom(makeDateFields()), atom(makeDateFields()), atom(makeDateFields()), atom(makeDateFields()), atom(makeDateFields()), atom(makeDateFields())]);
export const multiFlybyFlightTimesAtom = atom<CalendarDate[]>(
  (get) => get(multiFlybyFlightTimesAtomsAtom).map(a => get(a))
);
export const multiFlybyAtom = atom(blankMultiFlyby(kspSystem));
export const evolutionPlotDataAtom = atom({x: [], bestY: [], meanY: []} as EvolutionPlotData);
export const multiFlybyControlsOptionsAtom = atom({
  planeChange:        false,
  matchStartMo:       false,
  matchEndMo:         false,
  oberthManeuvers:    false,
  noInsertionBurn:    true,
});

// flight planner state (atoms)
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
          md: 1250,
          lg: 1630,
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

  return (
    <ThemeProvider theme={theme}>
      <Routes>
        <Route path='/' element={<TransferApp />} />
        <Route path='/Flyby/' element={<FlybyApp />} />
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