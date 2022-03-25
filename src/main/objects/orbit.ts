import Kepler from "../libs/kepler";
import { degToRad } from "../libs/math";

export class Orbit implements IOrbit {
    readonly semiMajorAxis!:         number;
    readonly apoapsis!:              number;
    readonly periapsis!:             number;
    readonly eccentricity!:          number;
    readonly inclination!:           number;
    readonly argOfPeriapsis!:        number;
    readonly ascNodeLongitude!:      number;
    readonly meanAnomalyEpoch!:      number;
    readonly epoch!:                 number; 
    readonly semiLatusRectum!:       number;
    readonly siderealPeriod!:        number;
    readonly orbiting!:              number;
    readonly attractorSoi!:          number;
    readonly attractorStdGravParam!: number


    constructor (data: IOrbit, attractor: ICelestialBody, anglesToRad: boolean = false) {
        this.semiMajorAxis = data.semiMajorAxis;
        this.eccentricity  = data.eccentricity;
        this.meanAnomalyEpoch = data.meanAnomalyEpoch;
        this.epoch = data.epoch;

        if (anglesToRad) {
            this.inclination = degToRad(data.inclination);
            this.argOfPeriapsis = degToRad(data.argOfPeriapsis);
            this.ascNodeLongitude = degToRad(data.ascNodeLongitude);
        } else {
            this.inclination = data.inclination;
            this.argOfPeriapsis = data.argOfPeriapsis;
            this.ascNodeLongitude = data.ascNodeLongitude;
        }

        if(this.eccentricity < 1){
            this.periapsis = this.semiMajorAxis * (1 - this.eccentricity);
            this.apoapsis =  this.semiMajorAxis * (1 + this.eccentricity);
        }
        else {
            this.periapsis = this.semiMajorAxis * (this.eccentricity - 1);
        }

        if(data.semiLatusRectum) {
            this.semiLatusRectum = data.semiLatusRectum;
        } else {
            this.semiLatusRectum = this.semiMajorAxis * (1 - this.eccentricity * this.eccentricity);
        }

        if(data.siderealPeriod) {
            this.siderealPeriod = data.siderealPeriod;
        } else {
            this.siderealPeriod = Kepler.siderealPeriod(data.semiMajorAxis, attractor.stdGravParam);
        }

        if("orbiting" in data) {
            this.orbiting = data.orbiting;
        } else {
            this.orbiting = attractor.id;
        }

        this.attractorSoi = attractor.soi;
        this.attractorStdGravParam = attractor.stdGravParam;
    }

    public get data(): IOrbit {
        return {
            orbiting:         this.orbiting,
            semiMajorAxis:    this.semiMajorAxis,
            apoapsis:         this.apoapsis,
            periapsis:        this.periapsis,
            eccentricity:     this.eccentricity,
            inclination:      this.inclination,
            argOfPeriapsis:   this.argOfPeriapsis,
            ascNodeLongitude: this.ascNodeLongitude,
            meanAnomalyEpoch: this.meanAnomalyEpoch,
            epoch:            this.epoch,
            semiLatusRectum:  this.semiLatusRectum,
            siderealPeriod:   this.siderealPeriod,
        };
    }

    public static fromOrbitalElements(elements: OrbitalElements, attractor: ICelestialBody){
        const data = Kepler.orbitFromElements(elements, attractor);
        return new Orbit(data, attractor);
    }
}

export default Orbit