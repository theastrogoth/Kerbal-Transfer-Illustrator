import { useState } from 'react';

import Orbit from './main/objects/orbit';
import { OrbitingBody } from './main/objects/body';
import SolarSystem from './main/objects/system';

import Kepler from './main/libs/kepler';
import FlybyCalcs from './main/libs/flybycalcs';

import { DateFieldState } from './components/DateField';
import { OrbitControlsState } from './components/OrbitControls';
import { DateControlsState } from './components/DateControls';
import { ControlsOptionsState } from './components/ControlsOptions';

// for re-used components

export function dateFieldIsEmpty(field: DateFieldState): boolean {
    return ((field.year === '') && (field.day === '') && (field.hour === ''))
}

export function timeFromDateFieldState(state: DateFieldState, timeSettings: TimeSettings, yearOffset: number = 1, dayOffset: number = 1): number {
    const years = state.year === "" ? 0 : parseFloat(state.year) - yearOffset;
    const days  = state.day  === "" ? 0 : parseFloat(state.day)  - dayOffset;
    const hours = state.hour === "" ? 0 : parseFloat(state.hour);
    return ( (timeSettings.daysPerYear * years + days) * timeSettings.hoursPerDay + hours ) * 3600
}

export function orbitFromControlsState(system: SolarSystem, state: OrbitControlsState): Orbit {
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

export function isInvalidOrbitInput(ocState: OrbitControlsState): boolean {
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
    invalid = e < 0 ? true : invalid;
    invalid = a > 0 && e > 1 ? true : invalid;
    invalid = a < 0 && e < 1 ? true : invalid;
    return invalid;
}

export function defaultOrbit(system: SolarSystem, id: number = 1, altitude: number = 100000): Orbit {
    const body = system.bodyFromId(id);
    const a = altitude + body.radius;
    const elements: OrbitalElements = {
        semiMajorAxis:      a,
        eccentricity:       0.0,
        inclination:        0.0,
        ascNodeLongitude:   0.0,
        argOfPeriapsis:     0.0,
        meanAnomalyEpoch:   0.0,
        epoch:              0.0,
    }
    const data = Kepler.orbitFromElements(elements, body)
    return new Orbit(data, body, false)
}

export function defaultManeuver(): Maneuver {
    const zeroVec = {x: 0, y: 0, z:0};
    const zeroState: OrbitalState = {date: 0, pos: zeroVec, vel: zeroVec};
    return {
        preState:   zeroState,
        postState:  zeroState,
        deltaV:     zeroVec,
        deltaVMag:  0.0,
    }
}

export function useOrbitControls(system: SolarSystem, id: number) {
    const [vesselId, setVesselId] = useState(-1);
    const [bodyId, setBodyId] = useState(id);
    const [sma, setSma] = useState(String(100000 + system.bodyFromId(id).radius));
    const [ecc, setEcc] = useState('0');
    const [inc, setInc] = useState('0');
    const [arg, setArg] = useState('0');
    const [lan, setLan] = useState('0');
    const [moe, setMoe] = useState('0');
    const [epoch, setEpoch] = useState('0');
  
    const orbitControlsState: OrbitControlsState = {
        vesselId,
        bodyId,
        sma,
        ecc,
        inc,
        arg,
        lan,
        moe,
        epoch,
        setVesselId,
        setBodyId,
        setSma,
        setEcc,
        setInc,
        setArg,
        setLan,
        setMoe,
        setEpoch
    };

    return orbitControlsState;
}

export function useDateField(y: string = '', d: string = '', h: string = '') {
    const [year, setYear] = useState(y)
    const [day, setDay] = useState(d)
    const [hour, setHour] = useState(h)
    const dateFieldState: DateFieldState = {
        year:     year,
        day:      day,
        hour:     hour,
        setYear:  setYear,
        setDay:   setDay,
        setHour:  setHour,
    };

    return dateFieldState
}

export function useControlOptions() {
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
    };

    return controlsOptionsState
}

// for transfer components

export function defaultPorkchopTimes(system: SolarSystem, startOrbit: IOrbit, endOrbit: IOrbit, earlyStartDate: number): number[] {
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
  
  export function porkchopInputsFromUI(system: SolarSystem, startOrbitControlsState: OrbitControlsState, endOrbitControlsState: OrbitControlsState,
                                       dateControlsState: DateControlsState, controlsOptionsState: ControlsOptionsState, timeSettings: TimeSettings): PorkchopInputs {
    const startOrbit = orbitFromControlsState(system, startOrbitControlsState);
    const endOrbit   = orbitFromControlsState(system, endOrbitControlsState);
  
    // set start dates and durations
    const startDateMin = timeFromDateFieldState(dateControlsState.earlyStartDate, timeSettings, 1, 1)
    const defaultTimes = defaultPorkchopTimes(system, startOrbit, endOrbit, startDateMin)
  
    let startDateMax = defaultTimes[0];
    if(!dateFieldIsEmpty(dateControlsState.lateStartDate)) {
        const fieldTime = timeFromDateFieldState(dateControlsState.lateStartDate, timeSettings, 1, 1);
        startDateMax = fieldTime > startDateMin ? fieldTime : startDateMax;
    }
    let flightTimeMin = defaultTimes[1]
    if(!dateFieldIsEmpty(dateControlsState.shortFlightTime)) {
        const fieldTime = timeFromDateFieldState(dateControlsState.shortFlightTime, timeSettings, 0, 0);
        flightTimeMin = fieldTime > 0 ? fieldTime : flightTimeMin;
    }
    let flightTimeMax = defaultTimes[2]
    if(!dateFieldIsEmpty(dateControlsState.longFlightTime)) {
        const fieldTime = timeFromDateFieldState(dateControlsState.longFlightTime, timeSettings, 0, 0);
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
        nTimes:                201,
        ejectionInsertionType: controlsOptionsState.oberthManeuvers ? "fastoberth" : "fastdirect",
        planeChange:           controlsOptionsState.planeChange,
        matchStartMo:          controlsOptionsState.matchStartMo,
        matchEndMo:            controlsOptionsState.matchEndMo,
        noInsertionBurn:       controlsOptionsState.noInsertionBurn,
    }
}

// for multi-flyby
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


export function searchInputsFromUI(system: SolarSystem, startOrbitControlsState: OrbitControlsState, endOrbitControlsState: OrbitControlsState, flybyIdSequence: number[],  
                                   dateControlsState: DateControlsState, controlsOptionsState: ControlsOptionsState, timeSettings: TimeSettings): MultiFlybySearchInputs {
                                       
    const startOrbit     = orbitFromControlsState(system, startOrbitControlsState);
    const endOrbit       = orbitFromControlsState(system, endOrbitControlsState);
    const ftBounds       = flightTimesBounds(system, startOrbit, endOrbit, flybyIdSequence);
    const flightTimesMin = ftBounds.flightTimesMin;
    const flightTimesMax = ftBounds.flightTimesMax;
    // const sumFlightTimesMin = flightTimesMin.reduce((p,c) => p + c);
    // const sumFlightTimesMax = flightTimesMax.reduce((p,c) => p + c);

    const startDateMin   = dateFieldIsEmpty(dateControlsState.earlyStartDate)  ? 0.0 : timeFromDateFieldState(dateControlsState.earlyStartDate, timeSettings, 1, 1); 
    let startDateMax     = dateFieldIsEmpty(dateControlsState.lateStartDate)   ? startDateMin + 5 * 365 * 24 * 3600 : timeFromDateFieldState(dateControlsState.lateStartDate, timeSettings, 1, 1);
    startDateMax = startDateMax < startDateMin ? startDateMin + 5 * 365 * 24 * 3600 : startDateMax;
    // let flightTimeMin    = dateFieldIsEmpty(dateControlsState.shortFlightTime) ? sumFlightTimesMin : timeFromDateFieldState(dateControlsState.shortFlightTime, timeSettings, 0, 0);
    // flightTimeMin = flightTimeMin < 0 ? sumFlightTimesMin : flightTimeMin;
    // let flightTimeMax    = dateFieldIsEmpty(dateControlsState.longFlightTime)  ? sumFlightTimesMax : timeFromDateFieldState(dateControlsState.longFlightTime, timeSettings, 0, 0);
    // flightTimeMax = (flightTimeMax < flightTimeMin) ? Math.max(sumFlightTimesMax, flightTimeMin) : flightTimeMax;

    // const overshoot = sumFlightTimesMax - flightTimeMax;
    // if(overshoot > 0) {
    //     const proportions = flightTimesMax.map(ft => ft / sumFlightTimesMax)
    //     for(let i=0; i<flightTimesMax.length; i++) {
    //         flightTimesMax[i] = flightTimesMax[i] - overshoot * proportions[i]
    //     }
    // }

    // const undershoot = flightTimeMin - sumFlightTimesMin;
    // if(undershoot > 0) {
    //     const squaredTimes = flightTimesMin.map(t => t * t);
    //     const squaredSum = squaredTimes.reduce((p, c) => p + c);
    //     const sqProportions = squaredTimes.map(sqt => sqt / squaredSum)
    //     for(let i=0; i<flightTimesMin.length; i++) {
    //         flightTimesMin[i] = flightTimesMin[i] + undershoot * sqProportions[i]
    //     }
    // }

    return {
        system,
        startOrbit,
        endOrbit,
        flybyIdSequence,
        startDateMin,
        startDateMax,
        flightTimesMin,
        flightTimesMax,
        planeChange:            controlsOptionsState.planeChange,
        matchStartMo:           controlsOptionsState.matchStartMo,
        matchEndMo:             controlsOptionsState.matchEndMo,
        noInsertionBurn:        controlsOptionsState.noInsertionBurn,
        ejectionInsertionType:  controlsOptionsState.oberthManeuvers ? "fastoberth" : "fastdirect",
    }
}
