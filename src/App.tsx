import React, { useEffect } from 'react';
import {Routes, Route } from 'react-router-dom';
import useMediaQuery from '@mui/material/useMediaQuery';
import { createTheme } from '@mui/material/styles';
import { PaletteMode } from '@mui/material';
import { ThemeProvider } from '@emotion/react';
import './App.css';

import { EvolutionPlotData } from './components/Flyby/EvolutionPlot';

import TransferApp, { blankTransfer } from './pages/Transfer';
import FlybyApp, { blankMultiFlyby } from './pages/Flyby';
import ManeuversApp from './pages/Maneuvers';
import SolarSystemApp from './pages/System';

import kspbodies from './data/kspbodies.json';
import opmconfigs from './data/opm_configs.json';
import rssconfigs from './data/rss_configs.json';
import ksrssconfigs from './data/ksrss_configs.json';
import jnsqconfigs from './data/jnsq_configs.json';
import galileoconfigs from './data/galileo_configs.json';

import kerbingroundstations from './data/kerbin_groundstations.json';

import SolarSystem from './main/objects/system';
import Vessel from './main/objects/vessel';
import loadSystemData, { loadSystemFromConfigs } from './main/utilities/loadSystem';

import { defaultManeuverComponents, defaultOrbit, makeDateFields } from './utils';
import { bodyConfigsToTree, bodyToConfig, sunToConfig } from './main/utilities/loadPlanetConfig';

import { PrimitiveAtom, atom, useAtom } from 'jotai';
import { splitAtom } from 'jotai/utils';

// prepare popular systems
export const kspSystem = loadSystemData(kspbodies);
const opmSystem = loadSystemFromConfigs(opmconfigs, kspSystem);
const jnsqSystem = loadSystemFromConfigs(jnsqconfigs, kspSystem);
const rssSystem = loadSystemFromConfigs(rssconfigs, kspSystem);
const ksrssSystem = loadSystemFromConfigs(ksrssconfigs, kspSystem);
const galileoSystem = loadSystemFromConfigs(galileoconfigs, kspSystem);

const kerbinGroundStations = kerbingroundstations.map(gs => gs as LandedVessel);

const systemOptions = new Map<string, SolarSystem>()
systemOptions.set('Kerbol System (Stock)', kspSystem);
systemOptions.set('Kerbol System (OPM)', opmSystem);
systemOptions.set('Kerbol System (JNSQ)', jnsqSystem);
systemOptions.set('Sol System (RSS)', rssSystem);
systemOptions.set('Sol System (KSRSS)', ksrssSystem);
systemOptions.set('Ciro System (Galileo)', galileoSystem);

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
export const systemNameAtom = atom([...systemOptions.keys()][0]);
export const systemAtom = atom<SolarSystem>(
  (get) => {
    const systemOpts = get(systemOptionsAtom);
    const systemName = get(systemNameAtom);
    return systemOpts.get(systemName) as SolarSystem;
  }
);
export const vesselsAtom = atom([] as Vessel[]);
export const landedVesselsAtom = atom([] as LandedVessel[]);
export const groundStationsAtom = atom(kerbinGroundStations);
export const timeSettingsAtom = atom(kspTimeSettings);

export const copiedOrbitAtom = atom(defaultOrbit(kspSystem) as IOrbit);
export const copiedManeuverAtom = atom(defaultManeuverComponents());
export const copiedFlightPlanAtom = atom(blankFlightPlan);

export const customSystemAtom = atom(kspSystem);

export const displayOptionsAtom = atom<DisplayOptions>({
  bodies:         true,
  textures:       true,
  textureType:    'Color',
  shadows:        true,
  wireframe:      false,
  bodySprites:    true,
  atmospheres:    true,
  sois:           true,
  bodyNames:      false,
  bodyOrbits:     true,
  bodyApses:      false,
  bodyNodes:      false,
  crafts:         true,
  maneuvers:      true,
  soiChanges:     true,
  craftNames:     false,
  craftOrbits:    true,
  craftApses:     false,
  craftNodes:     false,
  comms:          true,
  referenceLine:  false,
  skyBox:         false,
});

export const commsOptionsAtom = atom<{spaceCenter: boolean, groundStations: boolean, commStrength: number, trackingLevel: number}>({
  spaceCenter:      true,
  groundStations:   true,
  commStrength:     0,
  trackingLevel:    3,
})

// transfer planner state (atoms)
export const transferStartOrbitAtom = atom({
  name:       "Starting Orbit",
  orbit:      defaultOrbit(kspSystem, 1),
  maneuvers:  [],
  type:       "Ship",
  commRange:  100000000000,
} as IVessel);
export const transferEndOrbitAtom = atom({
  name:       "Target Orbit",
  orbit:      defaultOrbit(kspSystem, 6),
  maneuvers:  [],
  type:       "Ship",
  commRange:  100000000000,
} as IVessel);
export const transferEarlyStartDateAtom = atom(makeDateFields(1,1,0));
export const transferLateStartDateAtom = atom(makeDateFields()); 
export const transferShortFlightTimeAtom = atom(makeDateFields());
export const transferLongFlightTimeAtom = atom(makeDateFields()); 
export const transferAtom = atom(blankInitialTransfer);
export const unrefinedTransferAtom = atom(blankInitialTransfer);
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
export const multiFlybyStartOrbitAtom = atom({
  name:       "Starting Orbit",
  orbit:      defaultOrbit(kspSystem, 1),
  maneuvers:  [],
  type:       "Ship",
  commRange:  100000000000,
} as IVessel);
export const multiFlybyEndOrbitAtom = atom({
  name:       "Target Orbit",
  orbit:      defaultOrbit(kspSystem, 16),
  maneuvers:  [],
  type:       "Ship",
  commRange:  100000000000,
} as IVessel);
export const flybyIdSequenceAtom = atom<number[]>([5, 8]);
export const multiFlybyEarlyStartDateAtom = atom(makeDateFields(1,1,0));
export const multiFlybyLateStartDateAtom = atom(makeDateFields());
export const multiFlybyFlightTimesAtomsAtom = atom<PrimitiveAtom<CalendarDate>[]>([atom(makeDateFields()), atom(makeDateFields()), atom(makeDateFields()), atom(makeDateFields()), atom(makeDateFields()), atom(makeDateFields())]);
export const multiFlybyFlightTimesAtom = atom<CalendarDate[]>(
  (get) => get(multiFlybyFlightTimesAtomsAtom).map(a => get(a))
);
export const multiFlybyDSNperLegAtom = atom<number[]>([0, 0, 0]);
export const multiFlybyAtom = atom(blankMultiFlyby(kspSystem));
export const unrefinedMultiFlybyAtom = atom(blankMultiFlyby(kspSystem));
export const evolutionPlotDataAtom = atom({x: [], bestY: [], meanY: []} as EvolutionPlotData);
export const multiFlybyControlsOptionsAtom = atom({
  planeChange:        false,
  matchStartMo:       false,
  matchEndMo:         false,
  oberthManeuvers:    false,
  noInsertionBurn:    true,
});

// flight planner state (atoms)
export const vesselPlansAtom = atom([{name: "New Craft", orbit: defaultOrbit(kspSystem), maneuvers: [], commRange: 5000, type: "Ship"}] as IVessel[]);
// export const vesselPlansAtom = atom([] as (IVessel)[]);
export const vesselPlansAtomAtom = splitAtom(vesselPlansAtom);
export const landedVesselPlansAtom = atom([] as LandedVessel[])
export const flightPlansAtom = atom([] as FlightPlan[]);

// system editor (atoms)
const defaultBodyConfigs = [sunToConfig(kspSystem.sun), ...kspSystem.orbiters.map(bd => bodyToConfig(bd, kspSystem))]
export const bodyConfigsAtom = atom<(SunConfig | OrbitingBodyConfig)[]>(defaultBodyConfigs);
export const editorSelectedNameAtom = atom(kspSystem.sun.name);
export const configTreeAtom = atom<{tree: TreeNode<SunConfig | OrbitingBodyConfig>, orphans: TreeNode<OrbitingBodyConfig>[]}>(
  (get) => {
    const configs = get(bodyConfigsAtom);
    const tree = bodyConfigsToTree(configs[0], configs.slice(1), kspSystem);
    return tree;
  }
);
export const systemScaleAtom = atom(1);

function AppBody() {
  const [mode, setMode] = useAtom(lightModeAtom);

  // MUI theme
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const theme = createTheme({
    breakpoints: {
      values: {
          xs: 0,
          sm: 750,
          md: 1280,
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