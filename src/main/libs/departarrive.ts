import FlybyCalcs from "./flybycalcs";
import Kepler from "./kepler";
import { TWO_PI, X_DIR, Y_DIR, Z_DIR, copysign, acosClamped, wrapAngle, vec3, magSq3, mag3, normalize3, add3, sub3, div3, mult3, dot3, cross3, roderigues, counterClockwiseAngleInPlane, alignVectorsAngleAxis, clamp } from "./math"
import { brentRootFind, brentMinimize } from "./optim"

// const blankOrbit: IOrbit = {
//     orbiting:   -1,
//     semiMajorAxis: 0,
//     eccentricity: 0,
//     inclination: 0,
//     argOfPeriapsis: 0,
//     ascNodeLongitude: 0,
//     meanAnomalyEpoch: 0,
//     epoch: 0,
//     siderealPeriod: 0,
//     semiLatusRectum: 0,
// }

namespace DepartArrive {
    // "Direct" ejection/insertion
    export function fastDeparture(parkOrbit: IOrbit, parkBody: IOrbitingBody, relativeVel: Vector3, soiDate: number, matchParkMo: boolean = true): Trajectory {
        return fastDepartureArrival(parkOrbit, parkBody, relativeVel, soiDate, true, matchParkMo)
    }

    export function fastArrival(parkOrbit: IOrbit, parkBody: IOrbitingBody, relativeVel: Vector3, soiDate: number, matchParkMo: boolean = true): Trajectory {
        return fastDepartureArrival(parkOrbit, parkBody, relativeVel, soiDate, false, matchParkMo)
    }

    export function fastDepartureArrival(parkOrbit: IOrbit, parkBody: IOrbitingBody, relativeVel: Vector3, soiDate: number, ejection: boolean, matchParkMo: boolean = true): Trajectory {     
        const c = ejection ? 1 : -1;
        const mu = parkBody.stdGravParam;
        const soi = parkBody.soi;
        const soiSpeedSq = magSq3(relativeVel);

        const a = 1 / (2 / soi - soiSpeedSq / mu);
        const etol = 1e-8;

        // Rotate the relative velocity to the perifocal frame of the parking orbit
        const relativeVelPlane = Kepler.rotateToPerifocalFromInertial(relativeVel, parkOrbit);

        // If the orbit is circular, there is no need to search for a periapsis height
        let periapsis = parkOrbit.semiMajorAxis;

        // use Brent's method to find when the difference between the departure/arrival hyperbola and parking orbit radius is 0
        if(parkOrbit.eccentricity > etol) {
            const periapsisErr = (periapsis: number) => {
                const res = fastDepartureArrivalForPeriapsis(periapsis, parkOrbit, mu, soi, relativeVelPlane, soiSpeedSq, a, c);
                return res.err
            }
            const min = parkOrbit.semiMajorAxis * (1 - parkOrbit.eccentricity);
            const max = parkOrbit.eccentricity > 1 ? soi : parkOrbit.semiMajorAxis * (1 + parkOrbit.eccentricity);
            periapsis = brentRootFind(periapsisErr, min, max);
        }
        const {parkNu, e, soiNu, pPos, pVel} = fastDepartureArrivalForPeriapsis(periapsis, parkOrbit, mu, soi, relativeVelPlane, soiSpeedSq, a, c);

        const deltaT = Kepler.trueAnomalyToDate(soiNu, e, Kepler.siderealPeriod(a, mu), 0, 0);

        const periapsisDate = matchParkMo ? Kepler.trueAnomalyToOrbitDate(parkNu, parkOrbit, soiDate - deltaT - parkOrbit.siderealPeriod / 2) 
                                          : soiDate - deltaT;
        const periapsisState = {
            date:   periapsisDate,
            pos:    pPos,
            vel:    pVel,
        };
        
        const parkState = {
            date:   periapsisDate,
            pos:    pPos,
            vel:    Kepler.velocityAtTrueAnomaly(parkOrbit, mu, parkNu),
        };
        const orbit = Kepler.stateToOrbit(periapsisState, parkBody);

        if(c === 1) {
            const maneuver = Kepler.maneuverFromOrbitalStates(parkState, periapsisState);
            return {
                orbits:             [orbit], 
                intersectTimes:     [orbit.epoch, orbit.epoch + deltaT],
                maneuvers:          [maneuver],
            }
        } else {
            const maneuver = Kepler.maneuverFromOrbitalStates(periapsisState, parkState);
            return {
                orbits:             [orbit], 
                intersectTimes:     [orbit.epoch + deltaT, orbit.epoch],
                maneuvers:          [maneuver],
            }
        }
    }

    function fastDepartureArrivalForPeriapsis(periapsis: number, parkOrbit: IOrbit, mu: number, soi: number, relativeVelPlane: Vector3, soiSpeedSq: number, a: number, c: 1 | -1) {

        const pSpeedSq = soiSpeedSq + 2 * mu * (1 / periapsis - 1 / soi);
        const pSpeed = Math.sqrt(pSpeedSq);

        const e = Math.sqrt(1 + 2 * (0.5 * pSpeedSq - mu / periapsis) * periapsis * periapsis * pSpeedSq / mu  / mu);
        const p = a * (1 - e*e);

        // Start in perifocal coordinates of the ejection/insertion orbit
        // The assumption is made that the periapsis of the ejection/insertion orbit intersects with the parking orbit (which is not necessarily optimal, but is good for near-circular cases)
        const soiNu = c * Kepler.trueAnomalyAtDistance(soi, e, p);
        let soiVel = mult3(Kepler.motionDirectionAtTrueAnomaly(soiNu, e), Math.sqrt(soiSpeedSq));
        let pPos = mult3(X_DIR, periapsis);
        let pVel = mult3(Y_DIR, pSpeed);

        // Rotate about the x-axis to match the inclination of the relative velocity (in the plane of the parking orbit)
        const rotAngle1 = Math.atan2(relativeVelPlane.z, Math.sqrt(Math.abs(soiVel.y*soiVel.y - relativeVelPlane.z*relativeVelPlane.z)));
        soiVel = roderigues(soiVel, X_DIR, rotAngle1);
        pPos = roderigues(pPos, X_DIR, rotAngle1);
        pVel = roderigues(pVel, X_DIR, rotAngle1);

        // Rotate about the z-axs to match the direction of the relative velocity (in the plane of the parking orbit)
        const rotAngle2 = Math.atan2(relativeVelPlane.y, relativeVelPlane.x) - Math.atan2(soiVel.y, soiVel.x);
        soiVel = roderigues(soiVel, Z_DIR, rotAngle2);
        pPos = roderigues(pPos, Z_DIR, rotAngle2);
        pVel = roderigues(pVel, Z_DIR, rotAngle2);

        // Rotate back into the reference plane
        soiVel = Kepler.rotateToInertialFromPerifocal(soiVel, parkOrbit);
        pPos = Kepler.rotateToInertialFromPerifocal(pPos, parkOrbit);
        pVel = Kepler.rotateToInertialFromPerifocal(pVel, parkOrbit);

        // check error in periapsis height against parking orbit
        const parkNu = Kepler.angleInOrbitPlane(pPos, parkOrbit);
        const parkRadius = Kepler.distanceAtOrbitTrueAnomaly(parkNu, parkOrbit);
        const err = periapsis - parkRadius;
        return {err,  parkNu, e, soiNu, pPos, pVel}
    }

    // "Oberth" ejection/insertion
    export function fastOberthDeparture(parkOrbit: IOrbit, parkBody: IOrbitingBody, relativeVel: Vector3, soiDate: number, matchParkMo: boolean = true, soiPatchPosition: Vector3 = vec3(0,0,0)): Trajectory {
        return fastOberthDepartureArrival(parkOrbit, parkBody, relativeVel, soiDate, true, matchParkMo, soiPatchPosition);
    }

    export function fastOberthArrival(parkOrbit: IOrbit, parkBody: IOrbitingBody, relativeVel: Vector3, soiDate: number, matchParkMo: boolean = true, soiPatchPosition: Vector3 = vec3(0,0,0)): Trajectory {
        return fastOberthDepartureArrival(parkOrbit, parkBody, relativeVel, soiDate, false, matchParkMo, soiPatchPosition);
    }
    
    function fastOberthDepartureArrival(parkOrbit: IOrbit, parkBody: IOrbitingBody, relativeVel: Vector3, soiDate: number, ejection: boolean, matchParkMo: boolean = true, soiPatchPosition: Vector3 = vec3(0,0,0)): Trajectory {
        const c = ejection ? 1 : -1;
        const mu = parkBody.stdGravParam;
        const soi = parkBody.soi;
        const soiSpeedSq = magSq3(relativeVel);

        // set the slingshot radius
        const periapsis = FlybyCalcs.minFlybyRadius(parkBody);

        // incoming/outgoing orbit details (should be completely defined)
        const hypSMA = 1 / (2 / soi - soiSpeedSq / mu);
        const hypEcc    = 1 - periapsis / hypSMA;
        const hypSLR    = hypSMA  * (1 - hypEcc  * hypEcc); 
        const hypNu     = c * Kepler.trueAnomalyAtDistance(soi, hypEcc,  hypSLR);   // true anomaly at SoI
        const obrNu     = -c * Math.PI

        const hypDelta  = Kepler.motionAngleAtTrueAnomaly(hypNu, hypEcc);           // angle of motion direction at SoI

        const delta     = c * (hypDelta - obrNu);

        // Find the true anomaly for the parking orbit that makes the Oberth orbit a half-ellipse
        let parkNu = wrapAngle(Kepler.angleInOrbitPlane(relativeVel, parkOrbit) - c * delta);

        const parkNuObj = (parkNu: number) => {
            const parkPos = Kepler.positionAtTrueAnomaly(parkOrbit, parkNu);
            const startPos = add3(parkPos, soiPatchPosition);
            let nDir = normalize3(cross3(startPos, relativeVel));    // direction normal to the trajectory plane
            if(nDir.z < 0) {
                nDir = mult3(nDir, -1);
            }
            const deltaForNu = c === 1 ? counterClockwiseAngleInPlane(startPos, relativeVel, nDir) : // angle between incoming and outgoing velocity vectors (flyby angle)
                                         counterClockwiseAngleInPlane(relativeVel, startPos, nDir) 
            return Math.abs(deltaForNu - delta);
        }
        parkNu = parkOrbit.eccentricity < 1 ? brentMinimize(parkNuObj, parkNu - Math.PI, parkNu + Math.PI) 
                                            : brentMinimize(parkNuObj, insertionTrueAnomaly(parkOrbit, parkBody), ejectionTrueAnomaly(parkOrbit, parkBody));

        // set positions and speeds
        const parkPos  = Kepler.positionAtTrueAnomaly(parkOrbit, parkNu);
        const startPos = add3(parkPos, soiPatchPosition);
        let nDir = normalize3(cross3(startPos, relativeVel));    // direction normal to the trajectory plane
        if(nDir.z < 0) {
            nDir = mult3(nDir, -1);
        }

        const apoapsis  = mag3(startPos);

        const soiVelSq = magSq3(relativeVel);
        const hypEnergy  = soiVelSq  / 2 - mu / soi;

        const obrEcc    = (apoapsis - periapsis) / (periapsis + apoapsis);
        const obrSMA    = periapsis / (1 - obrEcc);
        const obrEnergy = -mu  / (2 * obrSMA) ;

        const obrPeriapsisSpeed = Math.sqrt((obrEnergy + mu / periapsis) * 2); 
        const hypPeriapsisSpeed = Math.sqrt((hypEnergy + mu / periapsis) * 2); 


        // align the perifocal fram with the inertial frame
        const rotInc = alignVectorsAngleAxis(Z_DIR, nDir);
        const perifocalSoiDir = vec3(Math.cos(hypDelta), Math.sin(hypDelta), 0);
        const tiltSoiDir = roderigues(perifocalSoiDir, rotInc.axis, rotInc.angle)
        const rotArg = alignVectorsAngleAxis(tiltSoiDir, normalize3(relativeVel));

        // results
        const periapsisPos = roderigues(roderigues(mult3(X_DIR,periapsis), rotInc.axis, rotInc.angle), rotArg.axis, rotArg.angle);
        const periapsisVelDir = roderigues(roderigues(Y_DIR, rotInc.axis, rotInc.angle), rotArg.axis, rotArg.angle);
        const hypPeriapsisVel = mult3(periapsisVelDir, hypPeriapsisSpeed);
        const obrPeriapsisVel = mult3(periapsisVelDir, obrPeriapsisSpeed);
        const hypDuration = Math.abs(Kepler.trueAnomalyToDate(hypNu, hypEcc, Kepler.siderealPeriod(hypSMA, mu), 0, 0));     
        const obrDuration = Math.abs(Kepler.trueAnomalyToDate(obrNu, obrEcc, Kepler.siderealPeriod(obrSMA, mu), 0, 0));

        const periapsisDate = soiDate - c * hypDuration;
        const obrDate = periapsisDate - c * obrDuration;

        const hypPreState:  OrbitalState = {date: periapsisDate, pos: periapsisPos, vel: obrPeriapsisVel};
        const hypPostState: OrbitalState = {date: periapsisDate, pos: periapsisPos, vel: hypPeriapsisVel};

        const obrEpoch = matchParkMo ? Kepler.trueAnomalyToOrbitDate(parkNu, parkOrbit, obrDate - parkOrbit.siderealPeriod/2) : obrDate;
        const adjustedSoiDate = soiDate + obrEpoch - obrDate;
        hypPreState.date  = hypPreState.date + obrEpoch - obrDate;
        hypPostState.date = hypPreState.date;

        // orbits
        const obrOrbit = Kepler.stateToOrbit(hypPreState, parkBody);
        obrOrbit.meanAnomalyEpoch = Kepler.dateToMeanAnomaly(obrEpoch, obrOrbit.siderealPeriod, obrOrbit.meanAnomalyEpoch, obrOrbit.epoch);
        obrOrbit.epoch = obrEpoch;
        const hypOrbit = Kepler.stateToOrbit(hypPostState, parkBody);

        // oberth maneuver states
        const parkVel   = Kepler.velocityAtTrueAnomaly(parkOrbit, parkBody.stdGravParam, parkNu);
        const obrVel    = Kepler.velocityAtTrueAnomaly(obrOrbit, parkBody.stdGravParam, obrNu);
        const obrPreState: OrbitalState = {
            date: obrDate,
            pos:  startPos,
            vel:  parkVel,
        };
        const obrPostState: OrbitalState = {
            date: obrDate,
            pos:  startPos,
            vel:  obrVel,
        }

        // trajectory
        if(c === 1) {
            const obrManeuver = Kepler.maneuverFromOrbitalStates(obrPreState, obrPostState);
            const hypManeuver = Kepler.maneuverFromOrbitalStates(hypPreState, hypPostState);
            return {
                orbits:             [obrOrbit, hypOrbit],
                intersectTimes:     [obrOrbit.epoch, hypOrbit.epoch, adjustedSoiDate],
                maneuvers:          [obrManeuver, hypManeuver],
            }
        } else {
            const obrManeuver = Kepler.maneuverFromOrbitalStates(obrPostState, obrPreState);
            const hypManeuver = Kepler.maneuverFromOrbitalStates(hypPostState, hypPreState);
            return {
                orbits:             [hypOrbit, obrOrbit],
                intersectTimes:     [adjustedSoiDate, hypOrbit.epoch, obrOrbit.epoch],
                maneuvers:          [hypManeuver, obrManeuver],
            }
        }
    }

    // Optimal ejection/insertion orbits similar to KSPTOT
    // An important difference is that vSoI, velocity at SOI encounter/exit, is used instead of vInf

    export function optimalDeparture(parkOrbit: IOrbit, parkBody: IOrbitingBody, relativeVel: Vector3, soiDate: number, 
                                     matchParkMo: boolean = true, type: "direct" | "oberth" = "direct", soiPatchPosition: Vector3 = vec3(0,0,0)): Trajectory {
        return optimalDepartureArrival(parkOrbit, parkBody, relativeVel, soiDate, true, matchParkMo, type ,soiPatchPosition);
    }

    export function optimalArrival(parkOrbit: IOrbit, parkBody: IOrbitingBody, relativeVel: Vector3, soiDate: number,  
                                   matchParkMo: boolean = true, type: "direct" | "oberth" = "direct", soiPatchPosition: Vector3 = vec3(0,0,0)): Trajectory {
        return optimalDepartureArrival(parkOrbit, parkBody, relativeVel, soiDate, false, matchParkMo, type, soiPatchPosition);
    }

    export function optimalDepartureArrival(parkOrbit: IOrbit, parkBody: IOrbitingBody, relativeVel: Vector3, soiDate: number, ejection: boolean,
                                            matchParkMo: boolean = true, type: "direct" | "oberth" = "direct", soiPatchPosition: Vector3 = vec3(0, 0, 0)): Trajectory {
        const c = ejection ? 1 : -1;
        
        // optimize the true anomaly of the parking orbit at the maneuver
        // bounds for elliptical starting orbit
        let minNu = -TWO_PI;
        let maxNu = TWO_PI - Number.EPSILON;
        if(type === "direct") {
            const mu = parkBody.stdGravParam;
            const soi = parkBody.soi;
            const soiSpeedSq = magSq3(relativeVel);
    
            const a = 1 / (2 / soi - soiSpeedSq / mu);
            const periapsis = parkOrbit.semiMajorAxis;
            const relativeVelPlane = Kepler.rotateToPerifocalFromInertial(relativeVel, parkOrbit);

            const {parkNu} = fastDepartureArrivalForPeriapsis(periapsis, parkOrbit, mu, soi, relativeVelPlane, soiSpeedSq, a, c);
            minNu = parkNu - Math.PI;
            maxNu = parkNu + Math.PI;
        }else if(type === "oberth") {
            const mu = parkBody.stdGravParam;
            const soi = parkBody.soi;
    
            const periapsis = FlybyCalcs.minFlybyRadius(parkBody);
    
            const soiVelSq = magSq3(relativeVel);
            const hypEnergy  = soiVelSq  / 2 - mu / soi;
            const hypSMA = -mu / (2 * hypEnergy);  
            const hypEcc    = 1 - periapsis / hypSMA;
            const hypSLR    = hypSMA  * (1 - hypEcc  * hypEcc); 
            const hypNu     = Kepler.trueAnomalyAtDistance(soi, hypEcc,  hypSLR);       // true anomaly at SoI
            const hypDelta  = Kepler.motionAngleAtTrueAnomaly(hypNu, hypEcc);           // angle of motion direction at SoI
            const delta     = hypDelta + Math.PI;

            const parkNu = wrapAngle(Kepler.angleInOrbitPlane(relativeVel, parkOrbit) - c * delta);
            minNu = parkNu - Math.PI;
            maxNu = parkNu + Math.PI;
        }
        // bounds for hyperbolic starting orbit
        if(parkOrbit.eccentricity > 1) {
            maxNu = ejectionTrueAnomaly(parkOrbit, parkBody) - 2 * Number.EPSILON;
            minNu = -maxNu;
        }

        // console.log(minNu, maxNu)

        const nuFun = type === "direct" ? directDepartArriveForTrueAnomaly : 
                      type === "oberth" ? oberthDepartArriveForTrueAnomaly :
                      directDepartArriveForTrueAnomaly;

        // objective export function for true anomaly optimization
        function nuObjFun(nu: number) {
            if(isNaN(nu) || nu === Infinity) {
                console.log(nu)
                throw Error("nu cannot be NaN")
            }
            const {deltaV, err} = nuFun(nu, parkOrbit, parkBody, relativeVel, soiDate, c, matchParkMo, soiPatchPosition, false);
            const obj = (deltaV * Math.exp(Math.min(100 * err, 10)))  // minimize delta v, and penalize direction mismatch from the intended excess velocity vector
            return obj;
        }

        const nu = brentMinimize(nuObjFun, minNu, maxNu, 1e-4);
        const res = nuFun(nu, parkOrbit, parkBody, relativeVel, soiDate, c, matchParkMo, soiPatchPosition, true);
        
        return res.trajectoryInfo
    }

    function directDepartArriveForTrueAnomaly(nu: number, parkOrbit: IOrbit, parkBody: IOrbitingBody, relativeVel: Vector3, soiDate: number, c: 1 | -1, 
                                              matchParkMo: boolean = true, soiPatchPosition: Vector3 = vec3(0,0,0), fullResult: boolean = true) {
        const parkPos = add3(Kepler.positionAtTrueAnomaly(parkOrbit, nu), soiPatchPosition);
        if(isNaN(parkPos.x)) {
            throw Error("nu cannot be NaN")
        }
        const {err, orbit} =  departArriveForPosition(parkPos, parkBody, relativeVel, soiDate, c, fullResult);

        const epoch = matchParkMo ? Kepler.trueAnomalyToOrbitDate(nu, parkOrbit, orbit.epoch - parkOrbit.siderealPeriod/2) : orbit.epoch;
        const adjustedSoiDate = soiDate + epoch - orbit.epoch;
        orbit.epoch = epoch;

        const preState = {
            date: orbit.epoch,
            pos:  Kepler.positionAtTrueAnomaly(parkOrbit, nu),
            vel:  Kepler.velocityAtTrueAnomaly(parkOrbit, parkBody.stdGravParam, nu),
        }
        const postState = Kepler.orbitToStateAtDate(orbit, parkBody, orbit.epoch);

        // console.log(mag3(sub3(preState.pos, postState.pos)))

        let trajectoryInfo: Trajectory;
        if(c === 1) {
            const maneuver = Kepler.maneuverFromOrbitalStates(preState, postState);
            trajectoryInfo = {
                orbits:         [orbit],
                intersectTimes: [orbit.epoch, adjustedSoiDate], 
                maneuvers:      [maneuver],
            }
        } else {
            const maneuver = Kepler.maneuverFromOrbitalStates(postState, preState);
            trajectoryInfo = {
                orbits:         [orbit],
                intersectTimes: [adjustedSoiDate, orbit.epoch],
                maneuvers:      [maneuver],
            }
        }
        const deltaV = trajectoryInfo.maneuvers[0].deltaVMag;

        
        return {deltaV, err, trajectoryInfo}
    }

    export function departArriveForPosition(parkPos: Vector3, parkBody: IOrbitingBody, relativeVel: Vector3, soiDate: number, c: 1 | -1, fullResult: boolean = true) {
        // from a known position and a known velocity (at another position), we can calculate a, i, and lan
        const mu = parkBody.stdGravParam;
        const mr = mag3(parkPos);
        const soi = parkBody.soi;

        const hHat = normalize3(cross3(parkPos, relativeVel));
        const n = cross3(Z_DIR, hHat);
        const nMag = mag3(n);
        const nHat = (nMag === 0) ? X_DIR : div3(n, nMag);

        const a = 1 / (2 / soi - magSq3(relativeVel) / mu);
        const i = acosClamped(hHat.z);
        const lan = wrapAngle(copysign(1, nHat.y) * acosClamped(nHat.x));

        // set bounds for eccentricity
        // elliptical case
        let eMax = 1 - 2 * Number.EPSILON;
        let eMin = clamp(soi / a - 1 + Number.EPSILON, 0, eMax);
        // hyperbolic case
        if(a < 0) {
            eMin = 1 + 2 * Number.EPSILON;
            eMax = Math.max(1 - mr / a, mr / a - 1);
            eMax = eMax === 1 ? 1 + 4 * Number.EPSILON : eMax;
        }

        // objective export function for eccentricity optimization
        function eObjFun(e: number) {
            if(isNaN(e)) {
                return 2;
            }
            const {err} =  departArriveForEccentricity(e, a, lan, i, parkPos, mr, soi, mu, relativeVel, parkBody.id, c);
            return err;
        }

        // Determine eccentricity (and argument of the periapsis, which depends on eccentricity) that ensure the correct excess velocity
        const e = brentMinimize(eObjFun, eMin, eMax, 1e-6);
        let {err, orbit} = departArriveForEccentricity(e, a, lan, i, parkPos, mr, soi, mu, relativeVel, parkBody.id, c);

        if(fullResult) {
            // Calculate the maneuver time, and consider it the orbit's epoch
            const p = orbit.semiLatusRectum;
            const mNu = c * Kepler.trueAnomalyAtDistance(mr, e, p);
            const soiNu = c * Kepler.trueAnomalyAtDistance(soi, e, p);
            const T = Kepler.siderealPeriod(a, mu);
            const mM = Kepler.trueToMeanAnomaly(mNu, e);
            const deltat = Kepler.trueAnomalyToDate(soiNu, e, T, mM, 0);
            const mt = soiDate - deltat;

            // Construct orbital objects and state vectors
            orbit.meanAnomalyEpoch = mM;
            orbit.epoch = mt;
        }
        return {err, orbit}
    }

    function departArriveForEccentricity(e: number, a: number, lan: number, i: number, parkPos: Vector3, mr: number, soi: number, mu: number, relativeVel: Vector3, orbiting: number, c: 1 | -1) {
        const p = a * (1 - e * e);
        const mNu = c * Kepler.trueAnomalyAtDistance(mr, e, p);
        const soiNu = c * Kepler.trueAnomalyAtDistance(soi, e, p);

        // determine arg that ensures that the optimized orbit intersects with the parking orbit at the provided point, parkPos 
        const arg = wrapAngle(Kepler.angleInPlane(parkPos, lan, i, 0.) - mNu);

        const orbit: IOrbit = {
            orbiting:           orbiting,
            semiMajorAxis:      a,
            eccentricity:       e,
            inclination:        i,
            ascNodeLongitude:   lan,
            argOfPeriapsis:     arg,
            meanAnomalyEpoch:   0.,     // does not affect the error or deltaV, and can be filled in later
            epoch:              0.,     // does not affect the error or deltaV, and can be filled in later
            semiLatusRectum:    p,
            siderealPeriod:     Kepler.siderealPeriod(a, mu),
        };

        const soiVel = Kepler.velocityAtTrueAnomaly(orbit, mu, soiNu);

        // calculate direction mismatch between the optimized orbit and the intended excess velocity
        let err = 1 - dot3(normalize3(relativeVel), normalize3(soiVel))
        if(isNaN(err)) {
            err = 2;
        }
        console.log()
        return {err, orbit}
    }


    // Oberth ejection/insertion (slingshot style)
    export function oberthDepartArriveForTrueAnomaly(nu: number, parkOrbit: IOrbit, parkBody: IOrbitingBody, relativeVel: Vector3, soiDate: number, c: -1 | 1,
                                                     matchParkMo: boolean = true, soiPatchPosition: Vector3 = vec3(0,0,0), fullResult: boolean = true) {
        const parkPos = add3(Kepler.positionAtTrueAnomaly(parkOrbit, nu), soiPatchPosition);
        const parkVel = Kepler.velocityAtTrueAnomaly(parkOrbit, parkBody.stdGravParam, nu);
        
        const {deltaV, obrPreState, obrPostState, hypPreState, hypPostState} = oberthDepartArriveForPosition(parkPos, parkVel, parkBody, relativeVel, soiDate, c, fullResult);

        let trajectoryInfo: Trajectory = {orbits: [], intersectTimes: [], maneuvers: []};
        if(fullResult) {
            const obrEpoch = matchParkMo ? Kepler.trueAnomalyToOrbitDate(nu, parkOrbit, obrPreState.date - parkOrbit.siderealPeriod/2) : obrPreState.date;
            const adjustedSoiDate = soiDate + obrEpoch - obrPreState.date;
            hypPreState.date  = hypPreState.date + obrEpoch - obrPreState.date;
            hypPostState.date = hypPreState.date;
            obrPreState.date  = obrEpoch;
            obrPostState.date = obrEpoch;

            const obrOrbit = Kepler.stateToOrbit(hypPreState,  parkBody);
            obrOrbit.meanAnomalyEpoch = Kepler.dateToMeanAnomaly(obrEpoch, obrOrbit.siderealPeriod, obrOrbit.meanAnomalyEpoch, obrOrbit.epoch);
            obrOrbit.epoch = obrEpoch;
            // const obrOrbit = Kepler.stateToOrbit(obrPostState, parkBody);
            const hypOrbit = Kepler.stateToOrbit(hypPostState, parkBody);

            if(c === 1) {
                const obrManeuver = Kepler.maneuverFromOrbitalStates(obrPreState, obrPostState);
                const hypManeuver = Kepler.maneuverFromOrbitalStates(hypPreState, hypPostState);
                trajectoryInfo = {
                    orbits:             [obrOrbit, hypOrbit],
                    intersectTimes:     [obrOrbit.epoch, hypOrbit.epoch, adjustedSoiDate],
                    maneuvers:          [obrManeuver, hypManeuver],
                }
            } else {
                const obrManeuver = Kepler.maneuverFromOrbitalStates(obrPostState, obrPreState);
                const hypManeuver = Kepler.maneuverFromOrbitalStates(hypPostState, hypPreState);
                trajectoryInfo = {
                    orbits:             [hypOrbit, obrOrbit],
                    intersectTimes:     [adjustedSoiDate, hypOrbit.epoch, obrOrbit.epoch],
                    maneuvers:          [hypManeuver, obrManeuver],
                }
            }
        }

        return {deltaV, err: 0, trajectoryInfo}
    }


    export function oberthDepartArriveForPosition(parkPos: Vector3, parkVel: Vector3, parkBody: IOrbitingBody, relativeVel: Vector3, soiDate: number, c: 1 | -1, fullResult: boolean = true) {
        const mu = parkBody.stdGravParam;
        const soi = parkBody.soi;

        const mr = mag3(parkPos);
        const parkPosDir = div3(parkPos, mr);

        const soiVelSq = magSq3(relativeVel);
        const soiDir = div3(relativeVel, Math.sqrt(soiVelSq));
        const hypEnergy  = soiVelSq  / 2 - mu / soi;
        const hypSMA = -mu / (2 * hypEnergy);  

        let nDir = normalize3(cross3(parkPosDir, soiDir));                              // direction normal to the trajectory plane
        if(nDir.z < 0) {
            nDir = mult3(nDir, -1);
        }
        const delta = c === 1 ? counterClockwiseAngleInPlane(parkPosDir, soiDir, nDir) : // angle between incoming and outgoing velocity vectors (flyby angle)
                                counterClockwiseAngleInPlane(soiDir, parkPosDir, nDir)  
        
        if(isNaN(delta)) {
            console.log(parkPosDir, soiDir, nDir)
        }

        const denominator = (periapsis: number) => {
            const hypEcc    = 1 - periapsis / hypSMA;
            const hypSLR    = hypSMA  * (1 - hypEcc  * hypEcc); 
            const hypNu     = c * Kepler.trueAnomalyAtDistance(soi, hypEcc,  hypSLR);   // true anomaly at SoI
            const hypDelta  = Kepler.motionAngleAtTrueAnomaly(hypNu, hypEcc);           // angle of motion direction at SoI
            const obrNu     = wrapAngle(hypDelta - c * delta, -Math.PI * (c + 1));      // true anomaly at Oberth maneuver start
            const denom    = (periapsis - mr * Math.cos(obrNu));
            return denom;
        }

        // define the search space by eliminating periapses that result in negative eccentricity
        let minPeriapsis = FlybyCalcs.minFlybyRadius(parkBody);
        const minDenomPeriapsis = brentMinimize(denominator, minPeriapsis, mr);
        const minDenom = denominator(minDenomPeriapsis)
        if(minDenom < 0) {
            minPeriapsis = brentRootFind(denominator, minDenomPeriapsis, mr) + 1;
        }

        // require that the incoming and outgoing orbits intersect at their periapses.
        // find the periapsis height that gives the correct flyby angle at the lowest deltaV
        const objective = (periapsis: number, fullResult: boolean = false) => {
            const hypEcc    = 1 - periapsis / hypSMA;
            const hypSLR    = hypSMA  * (1 - hypEcc  * hypEcc); 
            const hypNu     = c * Kepler.trueAnomalyAtDistance(soi, hypEcc,  hypSLR);   // true anomaly at SoI
            const hypDelta  = Kepler.motionAngleAtTrueAnomaly(hypNu, hypEcc);           // angle of motion direction at SoI
            const obrNu     = wrapAngle(hypDelta - c * delta, -Math.PI * (c + 1));      // true anomaly at Oberth maneuver start
            const obrEcc    = (mr - periapsis) / (periapsis - mr * Math.cos(obrNu));
            const obrSMA    = periapsis / (1 - obrEcc);
            const obrEnergy = -mu  / (2 * obrSMA) ;

            const obrPeriapsisSpeed = Math.sqrt((obrEnergy + mu / periapsis) * 2); 
            const hypPeriapsisSpeed = Math.sqrt((hypEnergy + mu / periapsis) * 2); 


            // align the perifocal fram with the inertial frame
            const rotInc = alignVectorsAngleAxis(Z_DIR, nDir);
            const perifocalSoiDir = vec3(Math.cos(hypDelta), Math.sin(hypDelta), 0);
            const tiltSoiDir = roderigues(perifocalSoiDir, rotInc.axis, rotInc.angle)
            const rotArg = alignVectorsAngleAxis(tiltSoiDir, soiDir);

            // const diff = dot3(roderigues(perifocalParkDir, axis, angle), parkPosDir);
            // if(diff < 0.95) {
            //     console.log(axis, angle)
            // }

            // velocity of the Oberth maneuver at the intersect with the parking orbit
            const obrSpeed = Math.sqrt((obrEnergy + mu / mr) * 2);
            const perifocalObrDir = Kepler.motionDirectionAtTrueAnomaly(obrNu, obrEcc);
            const obrDir = roderigues(roderigues(perifocalObrDir, rotInc.axis, rotInc.angle), rotArg.axis, rotInc.angle);
            const obrVel = mult3(obrDir, obrSpeed);

            // results
            const deltaV = Math.abs(obrPeriapsisSpeed - hypPeriapsisSpeed) + mag3(sub3(obrVel, parkVel));
            let periapsisPos:    Vector3 = vec3(0,0,0);     // store useless values during optimization
            let hypPeriapsisVel: Vector3 = vec3(0,0,0);     
            let obrPeriapsisVel: Vector3 = vec3(0,0,0);
            let hypDuration: number = 0;
            let obrDuration: number = 0;
            if(fullResult) {    // only prepare the full info outisde of the optimization loop, since only deltaV is optimized
                periapsisPos = roderigues(roderigues(mult3(vec3(1,0,0),periapsis), rotInc.axis, rotInc.angle), rotArg.axis, rotArg.angle);
                const periapsisVelDir = roderigues(roderigues(vec3(0,1,0), rotInc.axis, rotInc.angle), rotArg.axis, rotArg.angle);
                hypPeriapsisVel = mult3(periapsisVelDir, hypPeriapsisSpeed);
                obrPeriapsisVel = mult3(periapsisVelDir, obrPeriapsisSpeed);
                hypDuration = Math.abs(Kepler.trueAnomalyToDate(hypNu, hypEcc, Kepler.siderealPeriod(hypSMA, mu), 0, 0));     
                obrDuration = Math.abs(Kepler.trueAnomalyToDate(obrNu, obrEcc, Kepler.siderealPeriod(obrSMA, mu), 0, 0));
            }

            if(isNaN(deltaV)) {
                console.log(parkBody.name, mr, minPeriapsis, denominator(mr), denominator(minPeriapsis));
                console.log(periapsis, (mr - periapsis), (periapsis - mr * Math.cos(obrNu)), delta, hypDelta);
                // console.log(mu, mr, periapsis, obrNu, obrEcc, obrSMA, obrEnergy, obrPeriapsisSpeed, obrSpeed);
            }

            return {
                deltaV,
                obrVel,
                periapsisPos,
                hypPeriapsisVel,
                obrPeriapsisVel,
                hypDuration,
                obrDuration,
            };
        }
        const periapsis = brentMinimize((p: number) => objective(p).deltaV, minPeriapsis, mr, 1e-8)
        const {deltaV, obrVel, periapsisPos, hypPeriapsisVel, obrPeriapsisVel, hypDuration, obrDuration} = objective(periapsis, fullResult);

        const periapsisDate = soiDate - c * hypDuration;
        const obrDate = periapsisDate - c * obrDuration;

        const obrPreState:  OrbitalState = {date: obrDate,       pos: parkPos,      vel: parkVel};
        const obrPostState: OrbitalState = {date: obrDate,       pos: parkPos,      vel: obrVel};
        const hypPreState:  OrbitalState = {date: periapsisDate, pos: periapsisPos, vel: obrPeriapsisVel};
        const hypPostState: OrbitalState = {date: periapsisDate, pos: periapsisPos, vel: hypPeriapsisVel};

        return {deltaV, obrPreState, obrPostState, hypPreState, hypPostState};
    }


    // At the SoI boundary...

    function patchTrueAnomaly(orb: IOrbit, attractor: IOrbitingBody, c: 1 | -1) {
        return c * Kepler.trueAnomalyAtDistance(attractor.soi, orb.eccentricity, orb.semiLatusRectum)
    }

    export function ejectionTrueAnomaly(orb: IOrbit, attractor: IOrbitingBody) {
        return patchTrueAnomaly(orb, attractor, 1)
    }

    export function insertionTrueAnomaly(orb: IOrbit, attractor: IOrbitingBody) {
        return patchTrueAnomaly(orb, attractor, -1)
    }


    function patchDate(orb: IOrbit, attractor: IOrbitingBody, c: 1 | -1) {
        let tMin: number | undefined = undefined;
        // take care to get correct time for elliptical (periodic) orbits
        if(orb.eccentricity < 1) {
            tMin = c === 1 ? orb.epoch : orb.epoch - orb.siderealPeriod;
        }
        return Kepler.trueAnomalyToDate(patchTrueAnomaly(orb, attractor, c), orb.eccentricity, orb.siderealPeriod, orb.meanAnomalyEpoch, orb.epoch, tMin)
    }

    export function ejectionDate(orb: IOrbit, attractor: IOrbitingBody) {
        return patchDate(orb, attractor, 1)
    }

    export function insertionDate(orb: IOrbit, attractor: IOrbitingBody) {
        return patchDate(orb, attractor, -1)
    }


    function patchPosition(orb: IOrbit, attractor: IOrbitingBody, c: 1 | -1) {
        return Kepler.positionAtTrueAnomaly(orb, patchTrueAnomaly(orb, attractor, c))
    }

    export function ejectionPosition(orb: IOrbit, attractor: IOrbitingBody) {
        return patchPosition(orb, attractor, 1)
    }

    export function insertionPosition(orb: IOrbit, attractor: IOrbitingBody) {
        return patchPosition(orb, attractor, -1)
    }


    function patchVelocity(orb: IOrbit, attractor: IOrbitingBody, c: 1 | -1) {
        return Kepler.velocityAtTrueAnomaly(orb, attractor.stdGravParam, patchTrueAnomaly(orb, attractor, c))
    }

    export function ejectionVelocity(orb: IOrbit, attractor: IOrbitingBody) {
        return patchVelocity(orb, attractor, 1)
    }

    export function insertionVelocity(orb: IOrbit, attractor: IOrbitingBody) {
        return patchPosition(orb, attractor, -1)
    }
}

export default DepartArrive