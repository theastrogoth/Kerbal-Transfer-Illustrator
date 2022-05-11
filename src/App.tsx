import { useState } from 'react';
import {Routes, Route } from 'react-router-dom';
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

import { DateControlsState } from './components/DateControls';

// import { createTheme } from '@mui/material/styles';
import { defaultManeuver, defaultOrbit, useControlOptions, useDateField, useOrbitControls } from './utils';
import { EvolutionPlotData } from './components/FlybyApp/EvolutionPlot';

const bodiesData = {
  sun:      kspbodies[0]       as ICelestialBody,
  orbiters: kspbodies.slice(1) as IOrbitingBody[]
};
const kspSystem = new SolarSystem(bodiesData.sun, bodiesData.orbiters, true);

const kspTimeSettings: TimeSettings = {hoursPerDay: 6, daysPerYear: 426};

const emptyVessels: Vessel[] = [];
const emptyNumberArray: number[] = [];

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
  const [copiedManeuver, setCopiedManeuver] = useState(defaultManeuver());

  // state for transfer calculator
  const transferStartOrbit = useOrbitControls(kspSystem, 1);
  const transferEndOrbit = useOrbitControls(kspSystem, 6);

  const transferEarlyStartDate = useDateField('1','1','0');
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
  const [transfer, setTransfer] = useState(initialTransfer);

  const [porkchopInputs, setPorkchopInputs] = useState(initialPorkchopInputs);
  const [porkchopPlotData, setPorkchopPlotData] = useState(initialPorkchopPlotData);

  const [transferPlotCount, setTransferPlotCount] = useState(0);

  // state for flyby calculator
  const flybyStartOrbit= useOrbitControls(kspSystem, 1);
  const flybyEndOrbit  = useOrbitControls(kspSystem, 16);

  const [flybyIdSequence, setFlybyIdSequence] = useState([5, 8]);
  const flybySequenceControlsState = {
    system:           kspSystem,            
    startBodyId:      1,        
    endBodyId:        16,         
    flybyIdSequence,    
    setFlybyIdSequence, 
  };

  const flybyEarlyStartDate = useDateField('1','1','0');
  const flybyLateStartDate= useDateField();
  const flybyShortFlightTime = useDateField();
  const flybyLongFlightTime = useDateField();
  const flybyDateControlsState: DateControlsState = {
    earlyStartDate:     flybyEarlyStartDate,
    lateStartDate:      flybyLateStartDate,
    shortFlightTime:    flybyShortFlightTime,
    longFlightTime:     flybyLongFlightTime,
  }

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

  return (
    <Routes>
      <Route path='/' element={<TransferApp
        system={system}
        setSystem={setSystem}
        setCopiedManeuver={setCopiedManeuver}
        timeSettings={timeSettings}
        vessels={vessels}
        setVessels={setVessels}
        copiedOrbit={copiedOrbit}
        setCopiedOrbit={setCopiedOrbit}
        copiedManeuver={copiedManeuver}
        setTimeSettings={setTimeSettings}
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
        plotCount={transferPlotCount}
        setPlotCount={setTransferPlotCount}
       />} />
      <Route path='/Flyby/' element={<FlybyApp 
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
      <Route path='/FlightPlan/' element={<ManeuversApp />} />
    </Routes>
  );
}

function App() {
  return (
    <AppBody />
  )
}

export default App;