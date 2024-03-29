import { TWO_PI, HALF_PI, X_DIR, Z_DIR, copysign, acosClamped, wrapAngle, vec3, magSq3, mag3, sub3, div3, mult3, dot3, cross3, zxz, normalize3, add3, colorsAreEqual } from "./math"
import { newtonRootSolve } from "./optim"
import SolarSystemUtils from "./systemutils";

namespace Kepler {
    export const gravitySeaLevelConstant = 9.80665;
    export const newtonGravityConstant = 6.7430e-11;

    export function orbitFromElements(elements: KeplerElements, attractor: ICelestialBody): IOrbit {
        const p = elements.semiMajorAxis * (1 - elements.eccentricity * elements.eccentricity);
        const T = siderealPeriod(elements.semiMajorAxis, attractor.stdGravParam);
        return {
            orbiting:           attractor.id,
            semiMajorAxis:      elements.semiMajorAxis,
            eccentricity:       elements.eccentricity,
            inclination:        elements.inclination,
            argOfPeriapsis:     elements.argOfPeriapsis,
            ascNodeLongitude:   elements.ascNodeLongitude,
            meanAnomalyEpoch:   elements.meanAnomalyEpoch,
            epoch:              elements.epoch,
            semiLatusRectum:    p,
            siderealPeriod:     T,
        }
    }

    export function orbitalElementsAreInvalid(els: OrbitalElements) {
        return  isNaN(els.semiMajorAxis) || 
                isNaN(els.eccentricity) || 
                isNaN(els.inclination) || 
                isNaN(els.argOfPeriapsis) || 
                isNaN(els.ascNodeLongitude) || 
                isNaN(els.meanAnomalyEpoch) || 
                isNaN(els.epoch) || 
                isNaN(els.orbiting);
    }

    export function keplerElementsAreEqual(els1: KeplerElements, els2: KeplerElements) {
        return  els1.semiMajorAxis === els2.semiMajorAxis &&
                els1.eccentricity === els2.eccentricity &&
                els1.inclination === els2.inclination &&
                els1.argOfPeriapsis === els2.argOfPeriapsis &&
                els1.ascNodeLongitude === els2.ascNodeLongitude &&
                els1.meanAnomalyEpoch === els2.meanAnomalyEpoch &&
                els1.epoch === els2.epoch;
    }

    export function orbitalElementsAreEqual(els1: OrbitalElements, els2: OrbitalElements) {
        return  els1.semiMajorAxis === els2.semiMajorAxis &&
                els1.eccentricity === els2.eccentricity &&
                els1.inclination === els2.inclination &&
                els1.argOfPeriapsis === els2.argOfPeriapsis &&
                els1.ascNodeLongitude === els2.ascNodeLongitude &&
                els1.meanAnomalyEpoch === els2.meanAnomalyEpoch &&
                els1.epoch === els2.epoch &&
                els1.orbiting === els2.orbiting;
    }

    export function orbitsAreEqual(orb1: IOrbit, orb2: IOrbit) {
        return  orb1.semiMajorAxis === orb2.semiMajorAxis &&
                orb1.eccentricity === orb2.eccentricity &&
                orb1.inclination === orb2.inclination &&
                orb1.argOfPeriapsis === orb2.argOfPeriapsis &&
                orb1.ascNodeLongitude === orb2.ascNodeLongitude &&
                orb1.meanAnomalyEpoch === orb2.meanAnomalyEpoch &&
                orb1.epoch === orb2.epoch &&
                orb1.orbiting === orb2.orbiting &&
                orb1.siderealPeriod  === orb2.siderealPeriod &&
                orb1.semiLatusRectum === orb2.semiLatusRectum;
    }

    export function maneuverComponentsAreEqual(man1: ManeuverComponents, man2: ManeuverComponents) {
        return  man1.prograde === man2.prograde &&
                man1.normal === man2.normal &&
                man1.radial === man2.radial &&
                man1.date === man2.date;
    }

    export function vesselsAreEqual(ves1: IVessel, ves2: IVessel) {
        let equal = orbitalElementsAreEqual(ves1.orbit, ves2.orbit);
        if(!equal) { return false; }
        equal = equal && ves1.maneuvers.length === ves2.maneuvers.length;
        equal = equal && ves1.name === ves2.name;
        equal = equal && ves1.type === ves2.type;
        equal = equal && ves1.commRange === ves2.commRange;
        if(!equal) { return false; }
        if(ves1.color !== ves2.color) {
            if(ves1.color !== undefined && ves2.color !== undefined) {
                equal = equal && colorsAreEqual(ves1.color, ves2.color);
            } else {
                return false;
            }
        }
        if(equal) {
            for(let i=0; i<ves1.maneuvers.length; i++) {
                equal = equal && maneuverComponentsAreEqual(ves1.maneuvers[i], ves2.maneuvers[i]);
                if(!equal) { break; }
            }
        }
        return equal;
    }

    export function vesselListsAreEqual(vessels1: IVessel[], vessels2: IVessel[]) {
        let equal = vessels1.length === vessels2.length;
        if(equal) {
            for(let i=0; i<vessels1.length; i++) {
                equal = equal && vesselsAreEqual(vessels1[i], vessels2[i]);
                if(!equal) { break; }
            }
        }
        return equal;
    }

    export function maneuverFromOrbitalStates(preState: OrbitalState, postState: OrbitalState): Maneuver {
        const deltaV = sub3(postState.vel, preState.vel);
        const deltaVMag = mag3(deltaV);
        return {
            preState:   preState,
            postState:  postState,
            deltaV:     deltaV,
            deltaVMag:  deltaVMag,
        }
    }

    export function maneuverToComponents(maneuver: Maneuver) {
        const progradeDir = normalize3(maneuver.preState.vel);
        const normalDir   = normalize3(cross3(maneuver.preState.pos, progradeDir));
        const radialDir   = cross3(progradeDir, normalDir);

        return {
            prograde: dot3(maneuver.deltaV, progradeDir),
            normal:   dot3(maneuver.deltaV, normalDir),
            radial:   dot3(maneuver.deltaV, radialDir),
            date:     maneuver.preState.date,
        }
    }

    export function maneuverComponentsToManeuver(components: ManeuverComponents, preState: OrbitalState): Maneuver {
        const progradeDir = normalize3(preState.vel);
        const normalDir   = normalize3(cross3(preState.pos, progradeDir));
        const radialDir   = cross3(progradeDir, normalDir);

        const deltaV = add3(mult3(progradeDir, components.prograde), add3(mult3(normalDir, components.normal), mult3(radialDir, components.radial)));

        const postState: OrbitalState = {
            date:   preState.date,
            pos:    preState.pos,
            vel:    add3(preState.vel, deltaV),
        }

        const maneuver: Maneuver = {
            preState,
            postState,
            deltaV,
            deltaVMag: mag3(deltaV),
        }

        return maneuver;
    }

    export function rotateToInertialFromPerifocal(x: Vector3, orbit: KeplerElements): Vector3 {
        const lan = orbit.ascNodeLongitude;
        const i = orbit.inclination;
        const arg = orbit.argOfPeriapsis;
        return zxz(x, lan, i, arg)
    }

    export function rotateToPerifocalFromInertial(x: Vector3, orbit: KeplerElements): Vector3 {
        const lan = orbit.ascNodeLongitude;
        const i = orbit.inclination;
        const arg = orbit.argOfPeriapsis;
        return zxz(x, -arg, -i, -lan)
    }

    export function siderealPeriod(a: number, mu: number) {
        return TWO_PI * Math.sqrt(Math.abs(a*a*a) / mu)
    }

    export function flightPathAngleAtTrueAnomaly(nu: number, e: number) {
        return Math.atan(e*Math.sin(nu) / (1 + e*Math.cos(nu)))
    }

    export function motionAngleAtTrueAnomaly(nu: number, e: number): number {
        return nu + HALF_PI - flightPathAngleAtTrueAnomaly(nu, e);
    }

    export function motionDirectionAtTrueAnomaly(nu: number, e: number): Vector3 {
        const angle = motionAngleAtTrueAnomaly(nu, e);
        return vec3(Math.cos(angle), Math.sin(angle), 0);
    }

    export function distanceAtTrueAnomaly(nu: number, e: number, p: number) {
        return p / (1 + e*Math.cos(nu))
    }

    export function distanceAtOrbitTrueAnomaly(nu: number, orbit: IOrbit) {
        return distanceAtTrueAnomaly(nu, orbit.eccentricity, orbit.semiLatusRectum)
    }

    export function trueAnomalyAtDistance(r: number, e:number, p: number) {
        return acosClamped((p/r - 1) / e)
    }

    export function dateToMeanAnomaly(date: number, T: number, M0: number, epoch: number) {
        return M0 + TWO_PI * (date - epoch) / T;
    }

    export function meanAnomalyToDate(M: number, T: number, M0: number, epoch: number, tMin: number | undefined = undefined) {
        let t = epoch + (M - M0) * T / TWO_PI;
        if(tMin) {
            const nPeriods = Math.ceil((tMin - t)/T);
            t += T * nPeriods;
        }
        return t        
    }

    export function trueToMeanAnomaly(nu: number, e: number) {
        // The parabolic case (e = 1) is note implemented
        if(e < 1) {
            const E = 2 * Math.atan2(Math.sin(nu/2)*Math.sqrt(1-e), Math.cos(nu/2)*Math.sqrt(1+e));
            return E - e * Math.sin(E);
        } else {
            // const H = Math.acosh( (e + Math.cos(nu)) / (1 + e * Math.cos(nu)));
            const H = 2 * Math.atanh(Math.tan(nu / 2) * Math.sqrt((e - 1) / (e + 1)));
            return e * Math.sinh(H) - H;
        }
    }

    export function meanToTrueAnomaly(M: number, e: number){
        // Solving Kepler's equation for eccentric anomaly with Newton's method.
        if(e < 1) {
            const E = newtonRootSolve(
                E => E - e * Math.sin(E) - M,
                E => 1 - e * Math.cos(E),
                M,
                1e-12
            );
            return 2 * Math.atan(Math.sqrt((1 + e)/(1 - e)) * Math.tan(E * 0.5));
        } else {
            const H0 = Math.abs(M) > 4*Math.PI ? Math.sign(M) * 4*Math.PI : M;
            const H = newtonRootSolve(
                H => e * Math.sinh(H) - H - M,
                H => e * Math.cosh(H) - 1,
                H0,
                1e-12
            );
            return 2 * Math.atan(Math.sqrt((e + 1)/(e - 1)) * Math.tanh(H * 0.5));
        }
    }

    export function dateToTrueAnomaly(date: number, e: number, T: number, M0: number, epoch: number) {
        const M = dateToMeanAnomaly(date, T, M0, epoch);
        return meanToTrueAnomaly(M, e)
    }

    export function trueAnomalyToDate(nu: number, e: number, T: number, M0: number, epoch: number, tMin: number = 0) {
        const M = trueToMeanAnomaly(nu, e)
        return meanAnomalyToDate(M, T, M0, epoch, tMin)
    }

    export function dateToOrbitTrueAnomaly(date: number, orbit: IOrbit) {
        return dateToTrueAnomaly(date, orbit.eccentricity, orbit.siderealPeriod, orbit.meanAnomalyEpoch, orbit.epoch)
    }

    export function trueAnomalyToOrbitDate(nu: number, orbit: IOrbit, tMin: number = orbit.epoch) {
        return trueAnomalyToDate(nu, orbit.eccentricity, orbit.siderealPeriod, orbit.meanAnomalyEpoch, orbit.epoch, tMin)
    }

    export function angleInPlane(pos: Vector3, lan: number, i: number, arg: number) {
        const perifocalPos = zxz(pos, -arg, -i, -lan);
        return Math.atan2(perifocalPos.y, perifocalPos.x);
    }

    export function angleInOrbitPlane(pos: Vector3, orbit: KeplerElements) {
        return angleInPlane(pos, orbit.ascNodeLongitude, orbit.inclination, orbit.argOfPeriapsis)
    }

    export function positionAtTrueAnomaly(orbit: IOrbit, nu: number): Vector3 {
        const e = orbit.eccentricity;
        const i = orbit.inclination;
        const lan = orbit.ascNodeLongitude;
        const arg = orbit.argOfPeriapsis;
        const p = orbit.semiLatusRectum;

        const r = distanceAtTrueAnomaly(nu, e, p);
        const perifocalPos = vec3(r*Math.cos(nu), r*Math.sin(nu), 0);
        const pos = zxz(perifocalPos, lan, i, arg);
        return pos
    }

    export function velocityAtTrueAnomaly(orbit: IOrbit, mu: number, nu: number): Vector3 {
        const a = orbit.semiMajorAxis;
        const e = orbit.eccentricity;
        const i = orbit.inclination;
        const lan = orbit.ascNodeLongitude;
        const arg = orbit.argOfPeriapsis;
        const p = orbit.semiLatusRectum;

        const r = distanceAtTrueAnomaly(nu, e, p);
        const v = Math.sqrt(mu * (2/r - 1/a));

        const perifocalVel = mult3(motionDirectionAtTrueAnomaly(nu, e), v);
        const vel = zxz(perifocalVel, lan, i, arg);
        return vel
    }

    export function orbitToPositionAtDate(orbit: IOrbit, date: number): Vector3 {
        const e = orbit.eccentricity;
        const M0 = orbit.meanAnomalyEpoch;
        const epoch = orbit.epoch;
        const T = orbit.siderealPeriod;

        const nu = dateToTrueAnomaly(date, e, T, M0, epoch);
        return positionAtTrueAnomaly(orbit, nu)
    }

    export function orbitToVelocityAtDate(orbit: IOrbit, attractor: ICelestialBody, date: number): Vector3 {
        const e = orbit.eccentricity;
        const M0 = orbit.meanAnomalyEpoch;
        const epoch = orbit.epoch;
        const T = orbit.siderealPeriod;

        const mu = attractor.stdGravParam;

        const nu = dateToTrueAnomaly(date, e, T, M0, epoch);
        return velocityAtTrueAnomaly(orbit, mu, nu)
    }

    export function orbitToStateAtDate(orbit: IOrbit, attractor: ICelestialBody, date: number): OrbitalState {
        const e = orbit.eccentricity;
        const M0 = orbit.meanAnomalyEpoch;
        const epoch = orbit.epoch;
        const T = orbit.siderealPeriod;
        
        const mu = attractor.stdGravParam;

        const nu = dateToTrueAnomaly(date, e, T, M0, epoch);
        const pos = positionAtTrueAnomaly(orbit, nu);
        const vel = velocityAtTrueAnomaly(orbit, mu, nu);

        return {date, pos, vel}
    }

    export function stateToOrbit(state: OrbitalState, attractor: ICelestialBody) : IOrbit {
        const nullEps = 1e-12;
        
        const mu = attractor.stdGravParam;
        
        const pos = state.pos;
        const vel = state.vel;
        const r = mag3(pos);
        const v2 = magSq3(vel);

        const t = state.date

        // Semi-major Axis
        const a = 1 / (2/r - v2/mu);

        // Momentum
        const h = cross3(pos, vel);
        
        // Inclination
        const i = acosClamped(h.z / mag3(h));

        // Eccentricity vector (points toward periapsis)
        const eVec = sub3(div3(cross3(vel, h), mu), div3(pos, r));
        let e = mag3(eVec);
        let eHat = div3(eVec, e);
        if(e <=nullEps) {
            eHat = X_DIR;
            e = 0;
        }

        // Vector pointing to the ascending node
        const nVec = cross3(Z_DIR, h);
        let n = mag3(nVec);
        let nHat = div3(nVec, n);
        if(n <= nullEps) {
            nHat = eHat;
            n = 0;
        }

        // Longitude of the ascending node
        const lan = wrapAngle(copysign(acosClamped(nHat.x), nHat.y), 0)
        
        // Argument of the periapsis
        const arg = wrapAngle(copysign(acosClamped(dot3(nHat, eHat)), eHat.z), 0)

        // True anomaly
        const nu = wrapAngle(angleInPlane(pos, lan, i, arg), 0);

        // Mean anomaly
        const M = trueToMeanAnomaly(nu, e);

        // Semi-latus rectum
        const p = a * (1 - e*e);

        // Orbital period
        const T = siderealPeriod(a, mu)

        return {
            orbiting:               attractor.id,
            semiMajorAxis:          a,
            eccentricity:           e,
            inclination:            i,
            ascNodeLongitude:       lan,
            argOfPeriapsis:         arg,
            meanAnomalyEpoch:       M,
            epoch:                  t,
            semiLatusRectum:        p,
            siderealPeriod:         T,
        }
    }

    export function orbitPositionFromCentralBody(orbit: IOrbit, system: ISolarSystem, centralBody: ICelestialBody, date: number) {
        const commonParentId = SolarSystemUtils.commonAttractorId(system,orbit.orbiting, centralBody.id);
        if(commonParentId !== centralBody.id) {
            return vec3(0,0,0);
        }
        let pos = orbitToPositionAtDate(orbit, date);
        let bd = SolarSystemUtils.bodyFromId(system, orbit.orbiting);
        while(bd.id !== centralBody.id) {
            if(bd.hasOwnProperty("orbiting")) {
                pos = add3(pos, orbitToPositionAtDate((bd as IOrbitingBody).orbit, date));
                bd = SolarSystemUtils.bodyFromId(system, (bd as IOrbitingBody).orbiting);
            } else {
                return vec3(0,0,0);
            }
        } 
        return pos;
    }

    export function vectorDistanceForOrbits(orb1: IOrbit, orb2: IOrbit, date: number, system: ISolarSystem): Vector3 {
        const commonParent = SolarSystemUtils.bodyFromId(system, SolarSystemUtils.commonAttractorId(system, orb1.orbiting, orb2.orbiting));
        const pos1 = orbitPositionFromCentralBody(orb1, system, commonParent, date);
        const pos2 = orbitPositionFromCentralBody(orb2, system, commonParent, date);
        return sub3(pos2, pos1);
    }

    export function distanceForOrbits(orb1: IOrbit, orb2: IOrbit, date: number, system: ISolarSystem): number {
        return mag3(vectorDistanceForOrbits(orb1, orb2, date, system));   
    }

    export function inputsToOrbitingBody(inputs: OrbitingBodyInputs, attractor: ICelestialBody): IOrbitingBody {
        if(!inputs.mass && !inputs.stdGravParam && !inputs.geeASL) {
            throw(Error("A mass, 'sea level' gravity, or standard gravitational parameter is needed."))
        }
        const orbit = orbitFromElements(inputs.orbit, attractor);
        const maxTerrainHeight = inputs.maxTerrainHeight ? inputs.maxTerrainHeight : 0;
        const atmosphereHeight = inputs.atmosphereHeight ? inputs.atmosphereHeight : 0;

        const rotationPeriod = inputs.tidallyLocked === true ? orbit.siderealPeriod : inputs.rotationPeriod;

        let stdGravParam = inputs.stdGravParam;
        let mass = inputs.mass;
        let geeASL = inputs.geeASL;
        if(!stdGravParam && !mass) {
            stdGravParam = geeASL as number * inputs.radius * inputs.radius * gravitySeaLevelConstant;
            mass = stdGravParam / newtonGravityConstant
        } else {
            stdGravParam = stdGravParam ? stdGravParam as number : mass as number * newtonGravityConstant;
            mass = mass ? mass as number : stdGravParam as number / newtonGravityConstant;  
            geeASL = geeASL ? geeASL as number : stdGravParam / (inputs.radius * inputs.radius * gravitySeaLevelConstant);
        }

        const soi = inputs.soi ? inputs.soi : inputs.orbit.semiMajorAxis * (stdGravParam / attractor.stdGravParam)**(2/5);
        const color = inputs.color ? inputs.color : {r: 255, g: 255, b: 255};

        return {
            id:     inputs.id,
            name:   inputs.name,
            radius: inputs.radius,
            maxTerrainHeight,
            atmosphereHeight,
            mass,
            geeASL,
            stdGravParam,
            soi,
            tidallyLocked: inputs.tidallyLocked || false,
            rotationPeriod,
            initialRotation: inputs.initialRotation,
            color,
            orbit,
            orbiting: orbit.orbiting,
        }

    }
}

export default Kepler