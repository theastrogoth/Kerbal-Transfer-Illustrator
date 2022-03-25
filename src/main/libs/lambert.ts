// Includes a direct port to TypeScript of ESA's Lambert problem solver
// from : https://github.com/esa/pykep/blob/master/src/lambert_problem.cpp
// extended from original port by krafpy to cover multiple revolutions
// from : 

/*****************************************************************************
 *   Copyright (C) 2004-2018 The pykep development team,                     *
 *   Advanced Concepts Team (ACT), European Space Agency (ESA)               *
 *                                                                           *
 *   https://gitter.im/esa/pykep                                             *
 *   https://github.com/esa/pykep                                            *
 *                                                                           *
 *   act@esa.int                                                             *
 *                                                                           *
 *   This program is free software; you can redistribute it and/or modify    *
 *   it under the terms of the GNU General Public License as published by    *
 *   the Free Software Foundation; either version 2 of the License, or       *
 *   (at your option) any later version.                                     *
 *                                                                           *
 *   This program is distributed in the hope that it will be useful,         *
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of          *
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the           *
 *   GNU General Public License for more details.                            *
 *                                                                           *
 *   You should have received a copy of the GNU General Public License       *
 *   along with this program; if not, write to the                           *
 *   Free Software Foundation, Inc.,                                         *
 *   59 Temple Place - Suite 330, Boston, MA  02111-1307, USA.               *
 *****************************************************************************/

import { TWO_PI, mag3, normalize3, add3, sub3, div3, mult3, cross3, dot3, wrapAngle} from "./math"

namespace Lambert
{
    /**
     * Solves the Lambert's problem considering 0 revolutions and prograde direction only.
     * @param r1vec The start position in space
     * @param r2vec The end position in space
     * @param tof The time of flight between the two positions
     * @param attractor The attractor body
     * @param retro Designates the orbit as retrograde if true.
     * @param left Uses the left branch for the multiple revolutions problem if true
     * @returns The velocities at each point
     */
    export function solve(r1vec: Vector3, r2vec: Vector3, tof: number, attractor: ICelestialBody, revs: number = 0, retro: boolean = false, left: boolean = false) {
        const mu = attractor.stdGravParam;

        // Calculating lambda and T
        const r1 = mag3(r1vec);
        const r2 = mag3(r2vec);
        const c = mag3(sub3(r2vec, r1vec));

        const s = 0.5 * (r1 + r2 + c);

        const ir1 = div3(r1vec, r1);
        const ir2 = div3(r2vec, r2);

        const ih = normalize3(cross3(ir1, ir2));

        const lambda2 = 1 - c / s;
        let lambda = Math.sqrt(lambda2);
         let it1: Vector3, it2: Vector3;

        if(ih.z < 0) { // transfer angle is larger than 180° (viewed from upper y axis)
            lambda = -lambda;
            it1 = cross3(ir1, ih);
            it2 = cross3(ir2, ih);
        } else {
            it1 = cross3(ih, ir1);
            it2 = cross3(ih, ir2);
        }
        it1 = normalize3(it1);
        it2 = normalize3(it2);

        if(retro) {
            lambda = -lambda;
            it1 = mult3(it1, -1);
            it2 = mult3(it2, -1);
        }

        const lambda3 = lambda * lambda2;
        const T = Math.sqrt(2 * mu / (s*s*s)) * tof;
 
        // Detect maximum number of revolutions for which there exists a solution
        let nRevs = T / Math.PI;
        const T00 = Math.acos(lambda) + lambda * Math.sqrt(1.0 - lambda2);
        const T0 = (T00 + nRevs * Math.PI);
        const T1 = 2 / 3 * (1 - lambda3);
        let DT = 0.0, DDT = 0.0, DDDT = 0.0;
        let DTs = {DT, DDT, DDDT};
        if(nRevs > 0) {
            if(T > T0) { // Use Halley iterations
                let it = 0;
                let err = 1.0;
                let Tmin = T0;
                let xOld = 0.0, xNew = 0.0;
                while(1) {
                    DTs = dTdx(DT, DDT, DDDT, xOld, Tmin, lambda);
                    DT = DTs.DT;
                    DDT = DTs.DDT;
                    DDDT = DTs.DDDT;
                    if(DT !== 0) {
                        xNew = xOld - DT * DDT / (DDT * DDT - DT * DDDT / 2.0);
                    }
                    err = Math.abs(xOld - xNew);
                    if ((err < 1e-13) || (it > 12)) {
                        break;
                    }
                    Tmin = x2tof(Tmin, xNew, nRevs);
                    xOld = xNew;
                    it++;
                }
                if(Tmin > T) {
                    nRevs -= 1;
                }
            }
        }

        // Crop maximum revolutions to the input value, revs
        nRevs = revs < nRevs ? revs : nRevs;

        //  // Initialize arrays to store output
        //  const solslen = 2 * nRevs + 1;
        //  const x: number[] = new Array<number>(solslen);
        //  const v1: Vector3[] = new Array<Vector3>(solslen);
        //  const v2: Vector3[] = new Array<Vector3>(solslen);
        
        let x: number;

        // Single revolution case
        if(nRevs === 0) {
            // Initial guess
            let x0: number;
            if(T >= T00) {
                x0 = -(T - T00) / (T - T00 + 4);
            } else if(T <= T1) {
                x0 = T1 * (T1 - T) / (2 / 5 * (1 - lambda2 * lambda3) * T) + 1;
            } else {
                x0 = Math.pow(T / T00, 0.69314718055994529 / Math.log(T1 / T00)) - 1;
            } 
            // Householder iterations for 0 rev case
            x = householderIterations(T, x0, 0, 1e-15, lambda, 15);

        // Multi-rev case
        } else {
            let tmp = 0.0;
            if(left) {  // left Household iterations
                tmp = Math.pow((nRevs * Math.PI + Math.PI) / (8 * T), 2 / 3);
            } else {    // right Householder iterations 
                tmp = Math.pow((8 * T) / (nRevs * Math.PI), 2 / 3);
            }
            x = (tmp - 1) / (tmp + 1);
            x = householderIterations(T, x, nRevs, 1e-8, lambda, 15);
        }

        // Reconstruct the terminal velocities from x
        const gamma = Math.sqrt(mu * s / 2.0);
        const rho = (r1 - r2) / c;
        const sigma = Math.sqrt(1 - rho * rho);
        const y = Math.sqrt(1.0 - lambda2 + lambda2 * x * x);
        const vr1 = gamma * ((lambda * y - x) - rho * (lambda * y + x)) / r1;
        const vr2 = -gamma * ((lambda * y - x) + rho * (lambda * y + x)) / r2;
        const vt = gamma * sigma * (y + lambda * x);
        const vt1 = vt / r1;
        const vt2 = vt / r2;

        const v1 = add3(mult3(ir1, vr1), mult3(it1, vt1));
        const v2 = add3(mult3(ir2, vr2), mult3(it2, vt2));
        return {v1, v2};
    }
 
    function householderIterations(T: number, x0: number, N: number, eps: number, lambda: number, maxIters: number) {
        let xnew = 0;
        let tof = 0;
        let delta = 0;
        let DT = 0, DDT = 0, DDDT = 0;
        
        for(let it = 0; it < maxIters; it++) {
            tof = x2tof(x0, lambda, N);
            const DTs = dTdx(DT, DDT, DDDT, x0, tof, lambda);
            DT = DTs.DT;
            DDT = DTs.DDT;
            DDDT = DTs.DDDT;

            delta = tof - T;
            const DT2 = DT * DT;
            xnew = x0 - delta * (DT2 - delta * DDT / 2) / (DT * (DT2 - delta * DDT) + DDDT * delta * delta / 6);
            x0 = xnew;
            if(Math.abs(x0 - xnew) < eps) {
                break
            }
        }
 
        return x0;
    }
 
    function dTdx(DT: number, DDT: number, DDDT: number, x: number, T: number, lambda: number) {
        const l2 = lambda * lambda;
        const  l3 = l2 * lambda;
        const  umx2 = 1.0 - x * x;
        const  y = Math.sqrt(1.0 - l2 * umx2);
        const y2 = y * y;
        const y3 = y2 * y;
        DT = 1.0 / umx2 * (3.0 * T * x - 2.0 + 2.0 * l3 * x / y);
        DDT = 1.0 / umx2 * (3.0 * T + 5.0 * x * DT + 2.0 * (1.0 - l2) * l3 / y3);
        DDDT = 1.0 / umx2 * (7.0 * x * DDT + 8.0 * DT - 6.0 * (1.0 - l2) * l2 * l3 * x / y3 / y2);
        return {DT, DDT, DDDT};
    }
 
    function x2tof2(x: number, lambda: number, N: number)
    {
        const a = 1.0 / (1.0 - x * x);
        if (a > 0) // ellipse
        {
            let alfa = 2.0 * Math.acos(x);
            let beta = 2.0 * Math.asin(Math.sqrt(lambda * lambda / a));
            if (lambda < 0.0) beta = -beta;
            return ((a * Math.sqrt(a) * ((alfa - Math.sin(alfa)) - (beta - Math.sin(beta) * TWO_PI * N))) / 2.0);
        } else {
            let alfa = 2.0 * Math.acosh(x);
            let beta = 2.0 * Math.asinh(Math.sqrt(-lambda * lambda / a));
            if (lambda < 0.0) beta = -beta;
            return (-a * Math.sqrt(-a) * ((beta - Math.sinh(beta)) - (alfa - Math.sinh(alfa))) / 2.0);
        }
    }
 
    function x2tof(x: number, lambda: number, N: number)
    {
        const battin = 0.01;
        const lagrange = 0.2;
        const dist = Math.abs(x - 1);
        if (dist < lagrange && dist > battin) { // We use Lagrange tof expression
            return x2tof2(x, lambda, N);
        }
        const K = lambda * lambda;
        const E = x * x - 1.0;
        const rho = Math.abs(E);
        const z = Math.sqrt(1 + K * E);
        if (dist < battin) { // We use Battin series tof expression
            const eta = z - lambda * x;
            const S1 = 0.5 * (1.0 - lambda - x * eta);
            let Q = hypergeometricF(S1, 1e-11);
            Q = 4.0 / 3.0 * Q;
            return (eta * eta * eta * Q + 4.0 * lambda * eta) / 2.0 + Math.PI * N / (rho**1.5);
        } else { // We use Lancaster tof expresion
            const y = Math.sqrt(rho);
            const g = x * z - lambda * E;
            let d = 0.0;
            if (E < 0) {
                const l = Math.acos(g);
                d = Math.PI * N + l;
            } else {
                const f = y * (z - lambda * x);
                d = Math.log(f + g);
            }
            return (x - lambda * z - d / y) / E;
        }
    }
 
    function hypergeometricF(z: number, tol: number)
    {
        let Sj = 1.0;
        let Cj = 1.0;
        let err = 1.0;
        let Cj1 = 0.0;
        let Sj1 = 0.0;
        let j = 0;
        while (err > tol) {
            Cj1 = Cj * (3.0 + j) * (1.0 + j) / (2.5 + j) * z / (j + 1);
            Sj1 = Sj + Cj1;
            err = Math.abs(Cj1);
            Sj = Sj1;
            Cj = Cj1;
            j++;
        }
        return Sj;
    }
 
    // p-iteration
    export function psolve(r1vec: Vector3, r2vec: Vector3, tof: number, attractor: ICelestialBody, revs: number = 0, retro: boolean = false) {
        const mu = attractor.stdGravParam;

        const r1 = mag3(r1vec);
        const r2 = mag3(r2vec);

        let dTheta = Math.atan2(mag3(cross3(r1vec, r2vec)), dot3(r1vec, r2vec))
        dTheta = retro ? -dTheta : dTheta;
        const ih = normalize3(cross3(r1vec, r2vec));
        if (ih.z < 0) { // transfer angle is larger than 180° (viewed from upper y axis)
            dTheta = TWO_PI - dTheta;
        }

        // p-iteration constants
        const k = r1 * r2 * (1 - Math.cos(dTheta));
        const L = r1 + r2;
        const m = r1 * r2 * (1 + Math.cos(dTheta));

        // bounds
        const pj  = k / (L + Math.sqrt(2 * m));
        const pjj = k / (L - Math.sqrt(2 * m));
        let pmin: number;
        let pmax: number;
        if (dTheta > Math.PI) {
            pmin = 0.0;
            pmax = pjj;
        } else {
            pmin = pj;
            pmax = Infinity;
        }

        // Newton p-iteration
        const tol = 1e-12;
        const warntol = tol*1000;
        const maxit = 200;
        let it = 0;
        let err = tol + 1;
        let p = (pj + pjj) / 2;
        let pNext = p;
        let a = 0.0;
        let f = 0.0;
        let g = 0.0;
        let df = 0.0;
        while (err > tol && it < maxit) {
            it++;
            p = pNext;
            a = m * k * p / ((2*m - L * L) * (p * p) + 2 * k * L * p - k * k);
            a = a === 0 ? 1e-100 : a;    // Guarantee that parabolic case does not occur
            f = 1 - r2 / p * (1 - Math.cos(dTheta));
            g = r1 * r2 * Math.sin(dTheta) / Math.sqrt(mu * p);

            let t: number;
            let dtdp: number;
            df = Math.sqrt(mu / p) * Math.tan(dTheta / 2) * ((1 - Math.cos(dTheta)) / p - 1 / r1 - 1 / r2);
            if (a>0) { // elliptical case
                const sinDeltaE = -r1 * r2 * df / Math.sqrt(mu * a);
                const cosDeltaE = 1 - r1 / a * (1 - f);
                const deltaE = wrapAngle(Math.atan2(sinDeltaE, cosDeltaE));
                const angularspeed = Math.sqrt(a * a * a / mu);
                t = g + angularspeed * (deltaE - sinDeltaE);
                dtdp = -g / 2 / p - 1.5 * a * (t - g) * (k * k + (2 * m - L * L) * p * p) / (m * k * p * p) + angularspeed * (2 * k * sinDeltaE) / (p * (k - L * p));
            } else { // hyperbolic case
                const dF = Math.acosh(1 - r1 / a * (1 - f));
                const angularspeed = Math.sqrt(-a * a * a / mu);
                t = g + angularspeed * (Math.sinh(dF) - dF);
                dtdp = -g / 2 / p - 1.5 * a * (t - g) * (k * k + (2 * m - L * L) * p * p) / (m * k * p * p) - angularspeed * (2 * k * Math.sinh(dF)) / (p * (k - L * p));
            }
            err = Math.abs(tof - t) / tof;
            pNext = p + (tof - t) / dtdp;

            // if the next guess is outside the allowed bounds, use bisection
            if (pNext < pmin) {
                pNext = (p + pmin) / 2;
            } else if (pNext > pmax) {
                pNext = (p + pmax) / 2;
            }
        }

        if (err > warntol) {
            console.log('Lambert p-iteration failed to converge. error: %f', err);
        }

        const v1 = div3(sub3(r2vec, mult3(r1vec,f)), g);
        const v2 = add3(mult3(r1vec, df), mult3(v1, g));
        return {v1, v2}
    }

 }
 
 export default Lambert