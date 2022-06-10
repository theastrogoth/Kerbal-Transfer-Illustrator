import Orbit from './main/objects/orbit';
import { OrbitingBody } from './main/objects/body';
import SolarSystem from './main/objects/system';

import Kepler from './main/libs/kepler';
import FlybyCalcs from './main/libs/flybycalcs';

import { ControlsOptionsState } from './components/ControlsOptions';
import { clamp, calendarDateToTime } from './main/libs/math';

// for re-used components
export function dateFieldIsEmpty(calendarDate: CalendarDate): boolean {
    return ((isNaN(calendarDate.year)) && (isNaN(calendarDate.day)) && (isNaN(calendarDate.hour)))
}

export function timeFromDateFieldState(calendarDate: CalendarDate, timeSettings: TimeSettings, yearOffset: number = 1, dayOffset: number = 1): number {
    const year   = isNaN(calendarDate.year)   ? yearOffset : calendarDate.year;
    const day    = isNaN(calendarDate.day)    ? dayOffset : calendarDate.day;
    const hour   = isNaN(calendarDate.hour)   ? 0 : calendarDate.hour;
    const minute = isNaN(calendarDate.minute) ? 0 : calendarDate.minute;
    const second = isNaN(calendarDate.second) ? 0 : calendarDate.second;
    return (calendarDateToTime({year, day, hour, minute, second}, timeSettings, yearOffset, dayOffset));
}

export function orbitFromElementsAndSystem(system: SolarSystem, orbit: OrbitalElements | IOrbit): Orbit {
    const body = system.bodyFromId(orbit.orbiting);
    const orb = new Orbit(Kepler.orbitFromElements(orbit, body), body, true);
    return orb;
}

export function isInvalidOrbitInput(orbit: OrbitalElements): boolean {
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
        const safeAlt = clamp(alt, (body.atmosphereHeight || 0), (body.soi || Infinity));
        if(alt !== safeAlt) {
            if((body.soi - body.radius) / body.atmosphereHeight > 10) {
                while(alt < body.atmosphereHeight) {
                    alt *= 10;
                }
                while(alt > body.atmosphereHeight) {
                    alt *= 0.1;
                }
            } else {
                alt = safeAlt;
            }
        }
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

export function makeDateFields(year: number = NaN, day: number = NaN, hour: number = NaN, minute: number = NaN, second: number = NaN): CalendarDate {
    const calendarDate = {year, day, hour, minute, second};
    return calendarDate;
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
  
  export function porkchopInputsFromUI(system: SolarSystem, startOrbitElements: OrbitalElements, endOrbitElements: OrbitalElements, earlyStartDate: CalendarDate, lateStartDate: CalendarDate, 
                                       shortFlightTime: CalendarDate, longFlightTime: CalendarDate, controlsOptionsState: ControlsOptionsState, timeSettings: TimeSettings): PorkchopInputs {
    const startOrbit = orbitFromElementsAndSystem(system, startOrbitElements);
    const endOrbit   = orbitFromElementsAndSystem(system, endOrbitElements);
  
    // set start dates and durations
    const startDateMin = timeFromDateFieldState(earlyStartDate, timeSettings, 1, 1)
    const defaultTimes = defaultPorkchopTimes(system, startOrbit, endOrbit, startDateMin)
  
    let startDateMax = defaultTimes[0];
    if(!dateFieldIsEmpty(lateStartDate)) {
        const fieldTime = timeFromDateFieldState(lateStartDate, timeSettings, 1, 1);
        startDateMax = fieldTime > startDateMin ? fieldTime : startDateMax;
    }
    let flightTimeMin = defaultTimes[1]
    if(!dateFieldIsEmpty(shortFlightTime)) {
        const fieldTime = timeFromDateFieldState(shortFlightTime, timeSettings, 0, 0);
        flightTimeMin = fieldTime > 0 ? fieldTime : flightTimeMin;
    }
    let flightTimeMax = defaultTimes[2]
    if(!dateFieldIsEmpty(longFlightTime)) {
        const fieldTime = timeFromDateFieldState(longFlightTime, timeSettings, 0, 0);
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

export function searchInputsFromUI(system: SolarSystem, startOrbitElements: OrbitalElements, endOrbitElements: OrbitalElements, flybyIdSequence: number[],  
                                   earlyStartDate: CalendarDate, lateStartDate: CalendarDate, flightTimes: CalendarDate[], controlsOptionsState: ControlsOptionsState, timeSettings: TimeSettings): MultiFlybySearchInputs {
                                       
    const startOrbit        = orbitFromElementsAndSystem(system, startOrbitElements);
    const endOrbit          = orbitFromElementsAndSystem(system, endOrbitElements);

    const defaultFtBounds   = flightTimesBounds(system, startOrbit, endOrbit, flybyIdSequence);
    const inputFlightTimes  = flightTimes.map(ft => timeFromDateFieldState(ft, timeSettings, 0, 0));

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
    
    const startDateMin   = dateFieldIsEmpty(earlyStartDate)  ? 0.0 : timeFromDateFieldState(earlyStartDate, timeSettings, 1, 1); 
    let startDateMax     = dateFieldIsEmpty(lateStartDate)   ? startDateMin + 5 * 365 * 24 * 3600 : timeFromDateFieldState(lateStartDate, timeSettings, 1, 1);
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
