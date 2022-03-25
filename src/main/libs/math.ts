/* Miscellaneous useful functions */
export const X_DIR = vec3(1, 0, 0);
export const Y_DIR = vec3(0, 1, 0);
export const Z_DIR = vec3(0, 0, 1);

export const TWO_PI = 2 * Math.PI;
export const HALF_PI = 0.5 * Math.PI;

export function linspace(start: number, stop: number, n: number): number[] {
    n = Math.floor(n);

    if(n === 1) {
        return [stop]
    }

    const interval = (stop - start) / (n - 1);
    const vals: number[] = new Array<number>(n);
    vals[0] = start;
    for(let i = 1; i < n; i++) {
        vals[i] = vals[i-1] + interval;
    }
    return vals;
}

export function clamp(x: number, min: number, max: number) {
    return x > max ? max : x < min ? min : x;
}

export function degToRad(deg: number) {
    return deg * Math.PI / 180.0;
}

export function radToDeg(rad: number) {
    return rad * 180.0 / Math.PI;
}

export function wrapAngle(angle: number, min: number = 0) {
    const max = min + TWO_PI;
    if(min <= angle && angle < max) {
        return angle;
    }
    const circles = Math.floor((angle - min) / TWO_PI);
    return angle - TWO_PI * circles;
}

export function acosClamped(x: number) {
    return Math.acos(clamp(x, -1, 1));
}

export function isnegative(x: number) {
    return x < 0
}

export function copysign(x: number, y: number) {
    return isnegative(y) ? -x : x;
}

export function randomSign(): -1 | 1 {
    // @ts-ignore
    return (Math.round(Math.random()) * 2 - 1);
}

export function randint(a: number, b: number){
    return Math.floor(a + Math.random() * (b - a + 1));
}

export function lerp(x: number, y: number, t: number) {
    return x + t * (y - x);
}


/* Functions for manipulating 3D vectors */

export function vec3(x: number, y: number, z: number) : Vector3 {
    return {x: x, y: y, z: z};
}

export function clone3(v: Vector3): Vector3 {
    return {x: v.x, y: v.y, z: v.z};
}

export function mult3(v: Vector3, f: number) : Vector3 {
    return {
        x: v.x * f,
        y: v.y * f,
        z: v.z * f
    };
}

export function div3(v: Vector3, f: number) : Vector3 {
    return {
        x: v.x / f,
        y: v.y / f,
        z: v.z / f
    };
}

export function add3(u: Vector3, v: Vector3) : Vector3 {
    return {
        x: u.x + v.x,
        y: u.y + v.y,
        z: u.z + v.z
    };
}

export function sub3(u: Vector3, v: Vector3) : Vector3 {
    return {
        x: u.x - v.x,
        y: u.y - v.y,
        z: u.z - v.z
    };
}

export function dot3(u: Vector3, v: Vector3) {
    return u.x*v.x + u.y*v.y + u.z*v.z;
}

export function cross3(u: Vector3, v:Vector3) : Vector3 {
    return {
        x: u.y * v.z - u.z * v.y,
        y: u.z * v.x - u.x * v.z,
        z: u.x * v.y - u.y * v.x,
    };
}

export function magSq3(v: Vector3) {
    return dot3(v, v);
}

export function mag3(v: Vector3) {
    return Math.sqrt(magSq3(v))
}

export function normalize3(v: Vector3) : Vector3 {
    const len = mag3(v);
    return div3(v, len);
}

/* https://en.wikipedia.org/wiki/Rodrigues%27_rotation_formula */
export function roderigues(v: Vector3, axis: Vector3, angle: number) : Vector3 {
    const c = Math.cos(angle);
    const s = Math.sin(angle);

    const v1 = mult3(v, c);
    const v2 = mult3(cross3(axis, v), s);
    const v3 = mult3(axis, dot3(axis, v) * (1 - c));

    return add3(add3(v1, v2), v3)
}

export function alignVectorsAngleAxis(x: Vector3, y: Vector3) {
    const xHat = normalize3(x);
    const yHat = normalize3(y);
    const axis  = normalize3(cross3(x,y));
    const angle = acosClamped(dot3(xHat, yHat));
    return {axis, angle}
}

export function counterClockwiseAngleInPlane(x: Vector3, y: Vector3, normalDirection: Vector3) {
    let {axis, angle} = alignVectorsAngleAxis(normalDirection, vec3(0, 0, 1));
    if(isNaN(axis.x)) {
        axis = X_DIR;
    }
    const xPlane = roderigues(x, axis, angle);
    const yPlane = roderigues(y, axis, angle);
    const xAngle = Math.atan2(xPlane.y, xPlane.x);
    const yAngle = Math.atan2(yPlane.y, yPlane.x);
    // if(Math.abs(xPlane.z) > 1e-8 || Math.abs(yPlane.z) > 1e-8) {
    //     console.log(x, y, normalDirection)
    // }
    return wrapAngle(yAngle - xAngle);
}

/* https://en.wikipedia.org/wiki/Euler_angles#Rotation_matrix */
export function zxz(v: Vector3, a1: number, a2: number, a3: number) : Vector3 {
    const c1 = Math.cos(a1);
    const c2 = Math.cos(a2);
    const c3 = Math.cos(a3);

    const s1 = Math.sin(a1);
    const s2 = Math.sin(a2);
    const s3 = Math.sin(a3);

    const x = (c1*c3 - s1*c2*s3)*v.x + (-c1*s3 - s1*c2*c3)*v.y + (s1*s2)*v.z;
    const y = (s1*c3 + c1*c2*s3)*v.x + (c1*c2*c3 - s1*s3)*v.y + (-c1*s2)*v.z;
    const z = (s2*s3)*v.x + (s2*c3)*v.y + c2*v.z;

    return {
        x: x,
        y: y,
        z: z,
    };
}

/* Coordinate Systems */

export function cartesianToSpherical(p: Vector3): Spherical {
    const r = mag3(p);
    const theta = Math.atan2(Math.sqrt(p.x * p.x + p.y * p.y), p.z);
    const phi = Math.atan2(p.y, p.x);
    return {r, theta, phi};
}

export function sphericalToCartesian(p: Spherical) {
    const x = p.r * Math.cos(p.phi) * Math.sin(p.theta);
    const y = p.r * Math.sin(p.phi) * Math.sin(p.theta);
    const z = p.r * Math.cos(p.theta);
    return {x, y, z};
}

/* Dates & Times */

export function timeToCalendarDate(time: number, timeSettings: TimeSettings, yearOffset: number = 1, dayOffset: number = 1): CalendarDate {  
    const m = 60;
    const h = 3600;
    const d = timeSettings.hoursPerDay * h;
    const y = timeSettings.daysPerYear * d;

    let secondsRemaining = time;
    const year = Math.floor(secondsRemaining / y) + yearOffset;
    secondsRemaining = secondsRemaining - y * (year - yearOffset);
    const day = Math.floor(secondsRemaining / d ) + dayOffset;    
    secondsRemaining = secondsRemaining - d * (day - dayOffset);
    const hour = Math.floor(secondsRemaining / h);
    secondsRemaining = secondsRemaining - h * hour;
    const minute = Math.floor(secondsRemaining / m);
    secondsRemaining = secondsRemaining - m * minute;
    const second = Math.round(secondsRemaining);
    return {
        year,
        day, 
        hour,
        minute,
        second
    }
}

export function calendarDateToTime(calendarDate: CalendarDate, timeSettings: TimeSettings, yearOffset: number = 0, dayOffset: number = 0): number {
    const years   = calendarDate.year - yearOffset;
    const days    = calendarDate.day  - dayOffset;
    const hours   = calendarDate.hour;
    return ( (timeSettings.daysPerYear * years + days) * timeSettings.hoursPerDay + hours ) * 3600;
}

export function calendarDateToString(cd: CalendarDate): String {
    return "Year ".concat(String(cd.year), ", Day ", String(cd.day), ", ", ('0'+String(cd.hour)).slice(-2), ":", ('0'+String(cd.minute)).slice(-2), ":", ('0'+String(cd.second)).slice(-2));
}

export function calendarDateToDurationString(cd: CalendarDate): String {
    return String(cd.year).concat(cd.year === 1 ? " Year, " : " Years, ", 
           String(cd.day), cd.day === 1 ? " Day, " : " Days, ", 
           String(cd.hour), cd.hour === 1 ? " hour, " : " hours, ", 
           String(cd.minute), cd.minute === 1 ? " minute, and " : " minutes, and ", 
           String(cd.second), cd.second === 1 ? " second" : " seconds");
}