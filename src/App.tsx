import { useState } from 'react';
import {Routes, Route } from 'react-router-dom';
import useMediaQuery from '@mui/material/useMediaQuery';
import { createTheme } from '@mui/material/styles';
import './App.css';

import TransferApp from './pages/TransferApp';
import FlybyApp from './pages/FlybyApp';
import ManeuversApp from './pages/ManeuversApp';

import kspbodies from './data/kspbodies.json';

import { OrbitingBody } from './main/objects/body';
import SolarSystem from './main/objects/system';
import Transfer from './main/objects/transfer';
import MultiFlyby from './main/objects/multiflyby';
import Vessel from './main/objects/vessel';

import { DateControlsState } from './components/TransferApp/DateControls';
import { FlybyDateControlsState } from './components/FlybyApp/FlybyDateControls';
import { defaultManeuverComponents, defaultOrbit, useControlOptions, useDateField, useOrbitControls } from './utils';
import { EvolutionPlotData } from './components/FlybyApp/EvolutionPlot';
import { DynamicDateFieldState } from './components/DynamicDateFields';
import Kepler from './main/libs/kepler';

const bodiesData = {
  sun:      kspbodies[0]       as ICelestialBody,
  orbiters: kspbodies.slice(1) as IOrbitingBody[]
};
const kspSystem = new SolarSystem(bodiesData.sun, bodiesData.orbiters, true);

const kspTimeSettings: TimeSettings = {hoursPerDay: 6, daysPerYear: 426};

const emptyVessels: Vessel[] = [];
const emptyNumberArray: number[] = [];
const blankFlightPlan: IVessel = {name: 'Blank Flight Plan', maneuvers: [], orbit: defaultOrbit(kspSystem, 1)};

// initial values
const initialTransfer: Transfer = new Transfer({
  system:                 kspSystem,
  startOrbit:             (kspSystem.bodyFromId(1) as OrbitingBody).orbit,
  endOrbit:               (kspSystem.bodyFromId(1) as OrbitingBody).orbit,
  startDate:              0.0,
  flightTime:             (kspSystem.bodyFromId(1) as OrbitingBody).orbit.siderealPeriod,
  endDate:                (kspSystem.bodyFromId(1) as OrbitingBody).orbit.siderealPeriod,
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
const initialPorkchopInputs: PorkchopInputs = {
  system: kspSystem, 
  startOrbit: initialTransfer.startOrbit,
  endOrbit: initialTransfer.endOrbit,
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
  bestTransfer:       initialTransfer.data,
  transferStartDay:   0,
  transferFlightDay:  0,
}

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



function AppBody() {
  // common parts of the state
  const [system, setSystem] = useState(kspSystem);
  const [vessels, setVessels] = useState(emptyVessels);
  const [timeSettings, setTimeSettings] = useState(kspTimeSettings);

  const [copiedOrbit, setCopiedOrbit] = useState(defaultOrbit(kspSystem) as IOrbit);
  const [copiedManeuver, setCopiedManeuver] = useState(defaultManeuverComponents());
  const [copiedFlightPlan, setCopiedFlightPlan] = useState(blankFlightPlan);

  // MUI theme
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const theme = createTheme({
  breakpoints: {
        values: {
            xs: 0,
            sm: 600,
            md: 900,
            lg: 1200,
            xl: 2280,
        },
    },
    palette: {
      mode: prefersDarkMode ? 'dark' : 'light',
    },
  });

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
  const [transfer, setTransfer] = useState(initialTransfer);

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
    system:             kspSystem,            
    startBodyId:        flybyStartOrbit.orbit.orbiting,        
    endBodyId:          flybyEndOrbit.orbit.orbiting,         
    flybyIdSequence,    
    setFlybyIdSequence, 
    dateControlsState:  flybyDateControlsState,
  };

  const flybyControlsState = useControlOptions();
  const [multiFlyby, setMultiFlyby] = useState(blankMultiFlyby);

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
        date:       10861479.5706846,
      }
    ] as ManeuverComponents[], 
    orbit: Kepler.orbitFromElements(
      {semiMajorAxis:     70000,
       eccentricity:      0,
       inclination:       0,
       argOfPeriapsis:    0,
       ascNodeLongitude:  0,
       meanAnomalyEpoch:  0.1480249964499558,
       epoch:             4917299.01384942 - 2769.211791103803,
       orbiting:          3},
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
        system={system}
        setSystem={setSystem}
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
        system={system}
        setSystem={setSystem}
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
        system={system}
        setSystem={setSystem}
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
    </Routes>
  );
}

function App() {
  return (
    <AppBody />
  )
}

export default App;