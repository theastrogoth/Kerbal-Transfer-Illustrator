import { useState } from 'react';

import Orbit from './main/objects/orbit';
import { OrbitingBody } from './main/objects/body';
import SolarSystem from './main/objects/system';

import Kepler from './main/libs/kepler';
import FlybyCalcs from './main/libs/flybycalcs';

import { DateFieldState } from './components/DateField';
import { OrbitControlsState } from './components/OrbitControls';
import { DateControlsState } from './components/Transfer/DateControls';
import { FlybyDateControlsState } from './components/Flyby/FlybyDateControls';
import { ControlsOptionsState } from './components/ControlsOptions';
import { DynamicDateFieldState } from './components/DynamicDateFields';
import { clamp, calendarDateToTime } from './main/libs/math';

// for re-used components
export function dateFieldIsEmpty(field: DateFieldState): boolean {
    return ((isNaN(field.calendarDate.year)) && (isNaN(field.calendarDate.day)) && (isNaN(field.calendarDate.hour)))
}

export function timeFromDateFieldState(state: DateFieldState, timeSettings: TimeSettings, yearOffset: number = 1, dayOffset: number = 1): number {
    const year   = isNaN(state.calendarDate.year)   ? yearOffset : state.calendarDate.year;
    const day    = isNaN(state.calendarDate.day)    ? dayOffset : state.calendarDate.day;
    const hour   = isNaN(state.calendarDate.hour)   ? 0 : state.calendarDate.hour;
    const minute = isNaN(state.calendarDate.minute) ? 0 : state.calendarDate.minute;
    const second = isNaN(state.calendarDate.second) ? 0 : state.calendarDate.second;
    return (calendarDateToTime({year, day, hour, minute, second}, timeSettings, yearOffset, dayOffset));
}

export function timesFromDynamicDateFieldState(state: DynamicDateFieldState, timeSettings: TimeSettings, yearOffset: number = 0, dayOffset: number = 0) : number[] {
    const years = state.years.map(y => y === "" ? 0 : parseFloat(y) - yearOffset);
    const days  = state.days.map(d => d  === "" ? 0 : parseFloat(d) - dayOffset);
    const hours = state.hours.map(h => h === "" ? 0 : parseFloat(h));
    return years.map((y, idx) => ( (y * timeSettings.daysPerYear + days[idx]) * timeSettings.hoursPerDay + hours[idx] ) * 3600 );
}

function orbitFromElementsAndSystem(system: SolarSystem, orbit: OrbitalElements | IOrbit): Orbit {
    const body = system.bodyFromId(orbit.orbiting);
    const orb = new Orbit(Kepler.orbitFromElements(orbit, body), body, true);
    return orb;
}

export function orbitFromControlsState(system: SolarSystem, state: OrbitControlsState): Orbit {
    return orbitFromElementsAndSystem(system, state.orbit);
}

export function isInvalidOrbitInput(ocState: OrbitControlsState): boolean {
    const orbit = ocState.orbit;

    let invalid = false;
    const a = orbit.semiMajorAxis;
    const e = orbit.eccentricity;

    invalid = isNaN(orbit.orbiting) ? true : invalid;
    invalid = isNaN(a) ? true : invalid;
    invalid = isNaN(e) ? true : invalid;
    invalid = isNaN(orbit.inclination) ? true : invalid;
    invalid = isNaN(orbit.argOfPeriapsis) ? true : invalid;
    invalid = isNaN(orbit.ascNodeLongitude) ? true : invalid;
    invalid = isNaN(orbit.meanAnomalyEpoch) ? true : invalid;
    invalid = isNaN(orbit.epoch) ? true : invalid;

    invalid = e === 1 ? true : invalid;
    invalid = e < 0 ? true : invalid;
    invalid = a > 0 && e > 1 ? true : invalid;
    invalid = a < 0 && e < 1 ? true : invalid;
    return invalid;
}

export function defaultOrbit(system: SolarSystem, id: number = 1, altitude: number | undefined = undefined): Orbit {
    const body = system.bodyFromId(id);

    let alt = altitude;
    if(!alt) {
        alt = 10 ** Math.floor(Math.log10(body.radius + (body.atmosphereHeight || 0))); 
        alt = clamp(alt, (body.atmosphereHeight || 0) + 1, (body.soi || Infinity) - 1)
    }

    const a = alt + body.radius;
    const elements: OrbitalElements = {
        semiMajorAxis:      a,
        eccentricity:       0.0,
        inclination:        0.0,
        ascNodeLongitude:   0.0,
        argOfPeriapsis:     0.0,
        meanAnomalyEpoch:   0.0,
        epoch:              0.0,
        orbiting:           id,
    }
    const data = Kepler.orbitFromElements(elements, body)
    return new Orbit(data, body, false)
}



export function defaultManeuverComponents(date: number = 0): ManeuverComponents {
    return {
        prograde:   0.0,
        normal:     0.0,
        radial:     0.0,
        date,
    }
}

export function useOrbitControls(system: SolarSystem, id: number = 1, a: number = 100000 + system.bodyFromId(id).radius, e: number = 0, i: number = 0, o: number = 0, l: number = 0, m: number = 0, ep: number = 0) {
    const [vesselId, setVesselId] = useState(-1);
    const [orbit, setOrbit] = useState({
        semiMajorAxis:      a,
        eccentricity:       e,
        inclination:        i,
        argOfPeriapsis:     o,
        ascNodeLongitude:   l,
        meanAnomalyEpoch:   m,
        epoch:              ep,
        orbiting:           id,
    });
    const orbitControlsState: OrbitControlsState = {
        orbit,
        setOrbit,
        vesselId,
        setVesselId,
    };
    return orbitControlsState;
}

export function useDateField(year: number = NaN, day: number = NaN, hour: number = NaN, minute: number = NaN, second: number = NaN) {
    const [calendarDate, setCalendarDate] = useState({year, day, hour, minute, second} as CalendarDate);
    const [updateInputs, setUpdateInputs] = useState(false);
    const dateFieldState: DateFieldState = {
        calendarDate, 
        setCalendarDate,
        updateInputs,
        setUpdateInputs,
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
                                   dateControlsState: FlybyDateControlsState, controlsOptionsState: ControlsOptionsState, timeSettings: TimeSettings): MultiFlybySearchInputs {
                                       
    const startOrbit        = orbitFromControlsState(system, startOrbitControlsState);
    const endOrbit          = orbitFromControlsState(system, endOrbitControlsState);

    const defaultFtBounds   = flightTimesBounds(system, startOrbit, endOrbit, flybyIdSequence);
    const inputFlightTimes  = timesFromDynamicDateFieldState(dateControlsState.flightTimes, timeSettings, 0, 0);

    const flightTimesMin: number[] = [];
    const flightTimesMax: number[] = [];
    for(let i=0; i<inputFlightTimes.length; i++) {
        const ft = inputFlightTimes[i];
        if(i % 2 === 0) {
            flightTimesMin.push(ft > 0 ? ft : defaultFtBounds.flightTimesMin[i / 2]);
        } else {
            flightTimesMax.push(ft > 0 ? ft : defaultFtBounds.flightTimesMax[(i-1) / 2]);
        }
    }

    const startDateMin   = dateFieldIsEmpty(dateControlsState.earlyStartDate)  ? 0.0 : timeFromDateFieldState(dateControlsState.earlyStartDate, timeSettings, 1, 1); 
    let startDateMax     = dateFieldIsEmpty(dateControlsState.lateStartDate)   ? startDateMin + 5 * 365 * 24 * 3600 : timeFromDateFieldState(dateControlsState.lateStartDate, timeSettings, 1, 1);
    startDateMax = startDateMax < startDateMin ? startDateMin + 5 * 365 * 24 * 3600 : startDateMax;
   
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
