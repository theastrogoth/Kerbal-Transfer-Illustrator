const GOLDEN_RATIO = (1 + Math.sqrt(5)) / 2;

// https://en.wikipedia.org/wiki/Golden-section_search
export function goldenSectionSearch(func: Function, min: number, max: number, tol: number = 1e-5) {
    const GR = GOLDEN_RATIO - 1;
    const GRsq = 2 - GOLDEN_RATIO;
    let a = min, b = max;
    let h = b - a;
    if(h < tol) {
        return (b + a) / 2;
    }
    let c = a + GRsq * h;
    let d = a + GR * h;
    let fc = func(c);
    let fd = func(d);

    while(h > tol) {
        if(fc < fd) {
            b = d;
            d = c;
            fd = fc;
            h = GR * h;
            c = a + GRsq * h;
            fc = func(c);
        } else {
            a = c;
            c = d;
            fc = fd;
            h = GR * h;
            d = a + GR * h;
            fd = func(d);
        }
    }

    if(fc < fd) {
        return (a + d) / 2;
    } else {
        return (c + b) / 2;
    }
}

// https://en.wikipedia.org/wiki/Brent%27s_method
export function brentRootFind(func: Function, min: number, max: number, tol: number = 1e-12, maxIters: number = 100, warntol: number = 1.0) {
    const errtol = 2*Number.EPSILON;

    let a = min, b = max;
    let fa = func(a);
    let fb = func(b);

    // Make sure the bounds bracket a root
    if(Math.sign(fa) === Math.sign(fb)) {
        throw new Error("The provided bounds do not bracket a root.")
    }

    // Swap a and b to ensure that func(b) is closer to 0 than func(a) 
    if(Math.abs(fa) < Math.abs(fb)) {
        const temp_a = a;
        a = b;
        b = temp_a;

        const temp_fa = fa;
        fa = fb;
        fb = temp_fa;
    }

    let c = a;
    let fc = fa;

    let d = c;
    let bisected = true;

    let s = 0.0;
    let fs = 1.0;

    let itsRemaining = maxIters;
    while (itsRemaining) {
        itsRemaining--;

        if(Math.abs(b - a) < tol) {
            return b
        }
        if(Math.abs(fb) < errtol) {
            return b
        }

        s = 0.0;

        // Inverse quadratice interpolation
        if((Math.abs(fa - fc) > errtol) && (Math.abs(fb - fc) > errtol)) {
            s = ((a * fb * fc) / ((fa - fb) * (fa - fc))) + 
                ((b * fa * fc) / ((fb - fa) * (fb - fc))) +
                ((c * fa * fb) / ((fc - fa) * (fc - fb)));
        // Otherwise, use the secant method
        } else {
            s = b - (fc * ((b - a) / (fb - fa)))
        }
        const delta = Math.abs(errtol * b);
        const currentStep = Math.abs(s - b);
        const previousStep = Math.abs(b - c);
        const secondStep = Math.abs(c - d);

        // bisection conditions
        if(
            // s is not between (((3 * a) + b) / 4)) and b
            ((s - (((3 * a) + b) / 4)) * (s - b) >= 0) ||
            // the interpolation step is very small
            (bisected && (currentStep >= previousStep / 2)) ||
            (!bisected && (currentStep >= secondStep / 2)) ||
            // the prvious steps were close to b
            (bisected && previousStep < delta) ||
            (!bisected && secondStep < delta)
        ) {
            s = (a + b) / 2;
            bisected = true;
        } else {
            bisected = false;
        }

        // return s if func(s) is sufficiently close to 0
        fs = func(s);
        if(Math.abs(fs) < errtol) {
            return s;
        }

        // reset positions and bracket
        d = c;
        c = b;

        if(Math.sign(fa) !== Math.sign(fs)) {
            b = s;
            fb = fs;
        } else {
            a = s;
            fa = fs;
        }

        // Swap a and b to ensure that func(b) is closer to 0 than func(a) 
        if(Math.abs(fa) < Math.abs(fb)) {
            const temp_a = a;
            a = b;
            b = temp_a;

            const temp_fa = fa;
            fa = fb;
            fb = temp_fa;
        }
    }

    // no root found, throw error
    if (Math.abs(fs) > warntol) {
        console.log("Brent's method failed to find a root. Function value of %f at %f", fs, s)
    }
    return s;
}

// https://courses.seas.harvard.edu/courses/am205/g_act/am205_workshop_optimization.pdf
export function brentMinimize(func: Function, min: number, max: number, tol: number = 1e-8, maxIters: number = 50) {
    // const GR = GOLDEN_RATIO - 1;
    const GRsq = 2 - GOLDEN_RATIO;
    const etol = tol; // 1e-3;
    
    let a = min, b = max;
    let h = (b - a);
    let x = a + GRsq * h;
    let w = x;
    let v = w;

    let fv = func(v);
    let fw = func(w);
    let fx = func(x);

    let u = 0.0;
    let fu = 0.0;

    let m = (a + b) / 2

    let p = 0.0;
    let q = 0.0;
    let delta = 0.0;
    let d = 0.0;
    let e = 0.0;

    let itsRemaining = maxIters;

    while(itsRemaining) {
        itsRemaining--;

        if (h < tol) {
            return m;
        }

        p = (w - x) * (w - x) * (fx - fv) + (v - x) * (v - x) * (fw - fx);
        q = (w - x) * (fx -fv) + (v - x) * (fw - fx);

        delta = 0.5 * p / q;

        // If SPI is not well behaved, perform a Golden Section search
        if(
            // q is zero
            (q === 0) ||
            // u is not in between a and b
            (a > u || u > b) ||
            // p/q is not shrinking fast enough
            (Math.abs(p/q) > 0.5 * Math.abs(e))  ||
            // e is too small
            (Math.abs(e) < etol) 
        ) {
            e = (x < m) ? b-x : a-x;
            d = GRsq * e;
        // Otherwise, carry on with SPI
        } else {
            e = d;
            d = delta;
        }

        u = x + d;

        // newest function evaluation
        fu = func(u);

        // update bracket and previous guesses
        // u is the best guess so far
        if(fu <= fx) {
            a = (u < x) ? a : x;
            b = (u < x) ? x : b;
            v = w;
            w = x;
            x = u;
            fv = fw;
            fw = fx;
            fx = fu;
        // fu is worse than fx
        } else {
            a = (u < x) ? u : a;
            b = (u < x) ? b : u;
            // fu is the second-best guess
            if((fu <= fw) || (w === x)) {
                v = w;
                w = u;
                fv = fw;
                fw = fu;
            // fu is the third-best guess
            } else if((fu <= fv) || (v === x) || (v === w)) {
                v = u;
                fv = fu;
            // fu is the worst guess
            } else {
                // Don't keep u, only the bracket is updated
            }
        }

        // update interval size and midpoint
        h = b - a;
        m = (a + b) / 2;
    }
    // if(h > tol) {
    //     console.log("Brent's minimization method failed to converge. Interval size: ", h)
    // }
    return m
}

export function newtonRootSolve(
    f: (x: number) => number,
    df: (x: number) => number,
    x0: number,
    eps: number,
    maxIters: number = 1000
){
    let n = 0;
    let prevX: number;
    let x = x0;
    let err = eps + 1;
    let errp = err + 1;
    while(err > eps && n < maxIters){
        prevX = x;
        x -= f(x) / df(x);
        errp = err;
        err = Math.abs(x - prevX);
        if(errp < err) {            // Modification to Newton's method, using bisection in case the error gets worse with an iteration
            x = (x + prevX) / 2;    // This helps in case of poor initializations that lead to large overshoot, where the algorithm would not otherwise converge
        }
        n++;
    }
    if (n >= maxIters) {
        console.log("Newton's method failed to find a root. Error of %f. ", err)
    }
    return x;
}

interface NMpoint
{
    x:       number[],
    objx:    number,
}

function sortNMpoints(p1: NMpoint, p2: NMpoint) : number {
    return p1.objx - p2.objx;
}


// https://en.wikipedia.org/wiki/Nelder%E2%80%93Mead_method#One_possible_variation_of_the_NM_algorithm
export function nelderMeadMinimize(
    initialPoints:  number[][],
    objective:      (x: number[]) => number,
    tol:            number = 1.0,   // Non-standard approach to termination, since my objective functions have an assumed minimum (0.0)
    maxIt:          number = initialPoints[0].length * 250,
    alpha:          number = 1.0,
    gamma:          number = 2.0,
    rho:            number = 0.5,
    sigma:          number = 0.5,
    
): number[] {

    const n: number = initialPoints[0].length;
    const simplex: NMpoint[]    = [];
    const centroid: number[]    = initialPoints[0].slice()
    const reflect: number[]     = centroid.slice();
    const contract: number[]    = centroid.slice();
    const expand: number[]      = centroid.slice();

    // create simplex from initial points
    for(let i = 0; i <= n; i++) {
        simplex.push({x: initialPoints[i], objx: objective(initialPoints[i])})
    }

    // iterate until termination
    let err = tol + 1;
    for(let it = 0; it < maxIt; it++) {
        // sort the simplex by objective function value
        simplex.sort(sortNMpoints);
        err = simplex[0].objx;
        if(err < tol) {
            break
        }

        // TODO: add convergence test for general case

        // calculate the centroid of the simplex
        for(let i = 0; i <= n; i++) {
            centroid[i] = 0.0;
            for(let j = 0; j < n; j++) {
                centroid[i] = centroid[i] + simplex[j].x[i];
            }
            centroid[i] = centroid[i] / n;
        }

        // reflect worst point across the centroid
        for(let i = 0; i < n; i++) {
            reflect[i] = centroid[i] + alpha * (centroid[i] - simplex[n].x[i]);
        }
        const objReflect = objective(reflect);

        // if the point is better than second worse, but not the best,
        // replace the worst point with the reflected point and iterate
            if(objReflect < simplex[n - 1].objx && objReflect >= simplex[0].objx) {
                simplex[n].x = reflect.slice();
                simplex[n].objx = objReflect;
                continue
            }

        // if the relfected point is the best so far, expand the reflected point
        if(objReflect < simplex[0].objx) {
            for(let i = 0; i < n; i++) {
                expand[i] = centroid[i] + gamma * (reflect[i] - centroid[i]);
            }
            const objExpand = objective(expand);

            // use the better of the expanded and reflected points to replace the worst point
            // then, iterate
            if(objExpand < objReflect) {
                simplex[n].x = expand.slice();
                simplex[n].objx = objExpand;
            } else {
                simplex[n].x = reflect.slice();
                simplex[n].objx = objReflect;
            }
            continue
        }

        // Here, the reflected point is at least as bad as the second worst point
        // If it is the worst point, compute the contracted point on the inside
        if(objReflect > simplex[n].objx) {
            for(let i = 0; i < n; i++) {
                contract[i] = centroid[i] + rho * (simplex[n].x[i] - centroid[i]);
            }        
            const objContract = objective(contract);
            // replace worst point if this one is any better, then iterate
            if(objContract < simplex[n].objx) {
                simplex[n].x = contract.slice();
                simplex[n].objx = objContract;
                continue
            }
        // otherwise, compute the contracted point on the outside
        } else {
            for(let i = 0; i < n; i++) {
                contract[i] = centroid[i] + rho * (reflect[i] - centroid[i]);
            }    
            const objContract = objective(contract);
            // replace worst point if this one is an improvement on the reflection, then iterate
            if(objContract < objReflect) {
                simplex[n].x = contract.slice();
                simplex[n].objx = objContract;
                continue
            }
        }

        // At this step, all points will be shrunk toward the best point
        for(let i = 1; i <= n; i++) {
            for(let j = 1; j < n; j++) {
                simplex[i].x[j] = simplex[0].x[j] + sigma * (simplex[i].x[j] - simplex[0].x[j]);
            }
            simplex[i].objx = objective(simplex[i].x);
        }
    }
    return simplex[0].x
}

