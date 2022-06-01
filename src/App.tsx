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

import Kepler from './main/libs/kepler';
import SolarSystem from './main/objects/system';
import Vessel from './main/objects/vessel';
import loadSystemData from './main/utilities/loadSystem';

import { DateControlsState } from './components/Transfer/DateControls';
import { FlybyDateControlsState } from './components/Flyby/FlybyDateControls';
import { defaultManeuverComponents, defaultOrbit, useControlOptions, useDateField, useOrbitControls } from './utils';
import { EvolutionPlotData } from './components/Flyby/EvolutionPlot';
import { DynamicDateFieldState } from './components/DynamicDateFields';

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

function AppBody() {
  // common parts of the state
  const [system, setSystem] = useState(kspSystem);
  const [systemName, setSystemName] = useState([...systemOptions.keys()][0]);
  const [vessels, setVessels] = useState(emptyVessels);
  const [timeSettings, setTimeSettings] = useState(kspTimeSettings);

  const [copiedOrbit, setCopiedOrbit] = useState(defaultOrbit(kspSystem) as IOrbit);
  const [copiedManeuver, setCopiedManeuver] = useState(defaultManeuverComponents());
  const [copiedFlightPlan, setCopiedFlightPlan] = useState(blankFlightPlan);

  // MUI theme
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [mode, setMode] = useState((prefersDarkMode ? 'dark' : 'light') as PaletteMode);
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
    timeSettings:       timeSettings,
  }

  const transferControlsState = useControlOptions();
  const [transfer, setTransfer] = useState(blankInitialTransfer);

  const [porkchopInputs, setPorkchopInputs] = useState(initialPorkchopInputs);
  const [porkchopPlotData, setPorkchopPlotData] = useState(initialPorkchopPlotData);

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
    timeSettings:       timeSettings,
  }

  const [flybyIdSequence, setFlybyIdSequence] = useState([5, 8]);
  const flybySequenceControlsState = {
    system:             system,            
    startBodyId:        flybyStartOrbit.orbit.orbiting,        
    endBodyId:          flybyEndOrbit.orbit.orbiting,         
    flybyIdSequence,    
    setFlybyIdSequence, 
    dateControlsState:  flybyDateControlsState,
  };

  const flybyControlsState = useControlOptions();
  const [multiFlyby, setMultiFlyby] = useState(blankMultiFlyby(kspSystem));

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
  const [vesselPlans, setVesselPlans] = useState([{
    // name: 'Kerbin To Duna Example', 
    // maneuvers: [
    //   {
    //     prograde:   1034.6537492357884,
    //     normal:     189.57709325770122,
    //     radial:     0,
    //     date:       5249443.549858202,
    //   },
    //   {
    //     prograde:   -643.4676863825554,
    //     normal:     22.839528196905174,
    //     radial:     0,
    //     date:       10856519.37835302,
    //   }
    // ] as ManeuverComponents[], 
    // orbit: defaultOrbit(kspSystem, 1)
    name: 'Minmus To Ike Example', 
    maneuvers: [
      {
        prograde:   474.8533119242105,
        normal:     25.89508681510052,
        radial:     0,
        date:       4917299.01384942,
      },
      {
        prograde:   -448.7532077944218,
        normal:     21.6158998538224,
        radial:     0,
        date:       10861527.5706846,
      }
    ] as ManeuverComponents[], 
    orbit: Kepler.orbitFromElements(
      {semiMajorAxis:     70000,
       eccentricity:      0,
       inclination:       0,
       argOfPeriapsis:    0,
       ascNodeLongitude:  0,
       meanAnomalyEpoch:  0.1480249964499558,
       epoch:             4917299.01384942 - 2769.211791103803},
       kspSystem.bodyFromId(3)
    )
    // name: 'Testing', 
    // maneuvers: [
    //   {
    //     prograde:   842.25,
    //     normal:     0,
    //     radial:     0,
    //     date:       0,
    //   }
    // ] as ManeuverComponents[], 
    // orbit: defaultOrbit(kspSystem, 1)
  }] as IVessel[]);

  const [flightPlans, setFlightPlans] = useState([] as FlightPlan[]);

  return (
    <Routes>
      <Route path='/' element={<TransferApp
        theme={theme}
        mode={mode}
        setMode={setMode}
        systemOptions={systemOptions}
        system={system}
        setSystem={setSystem}
        systemName={systemName}
        setSystemName={setSystemName}
        timeSettings={timeSettings}
        setTimeSettings={setTimeSettings}
        vessels={vessels}
        setVessels={setVessels}
        copiedOrbit={copiedOrbit}
        setCopiedOrbit={setCopiedOrbit}
        copiedManeuver={copiedManeuver}
        setCopiedManeuver={setCopiedManeuver}
        copiedFlightPlan={copiedFlightPlan}
        setCopiedFlightPlan={setCopiedFlightPlan}
        startOrbitControlsState={transferStartOrbit}
        endOrbitControlsState={transferEndOrbit}
        dateControlsState={transferDateControlsState}
        controlsOptionsState={transferControlsState}
        transfer={transfer}
        setTransfer={setTransfer}
        porkchopInputs={porkchopInputs}
        setPorkchopInputs={setPorkchopInputs}
        porkchopPlotData={porkchopPlotData}
        setPorkchopPlotData={setPorkchopPlotData}
       />} />
      <Route path='/Flyby/' element={<FlybyApp 
        theme={theme}
        mode={mode}
        setMode={setMode}
        systemOptions={systemOptions}
        system={system}
        setSystem={setSystem}
        systemName={systemName}
        setSystemName={setSystemName}
        timeSettings={timeSettings}
        setTimeSettings={setTimeSettings}
        vessels={vessels}
        setVessels={setVessels}
        copiedOrbit={copiedOrbit}
        setCopiedOrbit={setCopiedOrbit}
        copiedManeuver={copiedManeuver}
        setCopiedManeuver={setCopiedManeuver}
        copiedFlightPlan={copiedFlightPlan}
        setCopiedFlightPlan={setCopiedFlightPlan}
        startOrbitControlsState={flybyStartOrbit}
        endOrbitControlsState={flybyEndOrbit}
        flybySequenceControlsState={flybySequenceControlsState}
        dateControlsState={flybyDateControlsState}
        controlsOptionsState={flybyControlsState}
        multiFlyby={multiFlyby}
        setMultiFlyby={setMultiFlyby}
        evolutionPlotData={evolutionPlotData}
        searchCount={flybySearchCount}
        setSearchCount={setFlybySearchCount}
      />} />
      <Route path='/FlightPlan/' element={<ManeuversApp 
        theme={theme}
        mode={mode}
        setMode={setMode}
        systemOptions={systemOptions}
        system={system}
        setSystem={setSystem}
        systemName={systemName}
        setSystemName={setSystemName}
        timeSettings={timeSettings}
        setTimeSettings={setTimeSettings}
        vessels={vessels}
        setVessels={setVessels}
        copiedOrbit={copiedOrbit}
        setCopiedOrbit={setCopiedOrbit}
        copiedManeuver={copiedManeuver}
        setCopiedManeuver={setCopiedManeuver}
        copiedFlightPlan={copiedFlightPlan}
        setCopiedFlightPlan={setCopiedFlightPlan}
        vesselPlans={vesselPlans}
        setVesselPlans={setVesselPlans}
        flightPlans={flightPlans}
        setFlightPlans={setFlightPlans}
      />} />
      <Route path='/System/' element={<SolarSystemApp 
        theme={theme}
        mode={mode}
        setMode={setMode}
        systemOptions={systemOptions}
        system={system}
        setSystem={setSystem}
        systemName={systemName}
        setSystemName={setSystemName}
        timeSettings={timeSettings}
        setTimeSettings={setTimeSettings}
        vessels={vessels}
        setVessels={setVessels}
      />} />
    </Routes>
  );
}

function App() {
  return (
    <AppBody />
  )
}

export default App;