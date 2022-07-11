import Orbit from "./orbit"
import Color from "./color";

export class CelestialBody implements ICelestialBody {
    readonly id!:               number;
    readonly name!:             string;
    readonly radius!:           number;
    readonly maxTerrainHeight:  number;
    readonly atmosphereHeight!: number;
    readonly mass!:             number;
    readonly geeASL:            number;
    readonly stdGravParam!:     number;
    readonly soi?:              number;
    readonly rotationPeriod:    number;
    readonly initialRotation:   number;
    readonly color!:            Color;
    readonly orbiters:          OrbitingBody[] = [];

    constructor(data: ICelestialBody) {
        this.id                 = data.id;
        this.name               = data.name;
        this.radius             = data.radius;
        this.maxTerrainHeight   = data.maxTerrainHeight ? data.maxTerrainHeight : 0.0;
        this.atmosphereHeight   = data.atmosphereHeight ? data.atmosphereHeight : 0.0;
        this.mass               = data.mass ? data.mass : data.stdGravParam / 6.7430e-11;
        this.geeASL             = data.geeASL ? data.geeASL : data.stdGravParam / (data.radius * data.radius * 9.80665);
        this.stdGravParam       = data.stdGravParam;
        this.soi                = data.soi;
        this.rotationPeriod     = data.rotationPeriod ? data.rotationPeriod : Infinity;
        this.initialRotation    = data.initialRotation ? data.initialRotation : 0.0;
        this.color              = new Color(data.color);
    }

    public get data() : ICelestialBody {
        return {
            id:                 this.id,
            name:               this.name,
            radius:             this.radius,
            maxTerrainHeight:   this.maxTerrainHeight,
            atmosphereHeight:   this.atmosphereHeight,
            mass:               this.mass,
            geeASL:             this.geeASL,
            stdGravParam:       this.stdGravParam,
            soi:                this.soi,
            rotationPeriod:     this.rotationPeriod,
            initialRotation:    this.initialRotation,
            color:              this.color
        }
    }

    public get orbiterIds() : number[] {
        let orbIds: number[] = [];
        for(let i=0; i<this.orbiters.length; i++) {
            orbIds.push(this.orbiters[i].id)
        }
        return orbIds
    }

    public get furtherstOrbiterDistance() : number {
        let maxDist = 0.0;
        for(let i=0; i<this.orbiters.length; i++) {
            const orb = this.orbiters[i].orbit;
            const orbDist = orb.semiMajorAxis * (1 + orb.eccentricity);
            maxDist = Math.max(orbDist, maxDist)
        }
        return maxDist;
    }

    public rescale(scale: number) : CelestialBody {
        const newGravParam = this.geeASL * this.radius * this.radius * scale * scale * 9.80665;
        const newMass = newGravParam / 6.7430e-11;
        const newData: ICelestialBody = {
            id:                 this.id,
            name:               this.name,
            radius:             this.radius * scale,
            maxTerrainHeight:   this.maxTerrainHeight * scale,
            atmosphereHeight:   this.atmosphereHeight * scale,
            mass:               newMass,
            geeASL:             this.geeASL,
            stdGravParam:       newGravParam,
            soi:                this.soi,
            rotationPeriod:     this.rotationPeriod,
            initialRotation:    this.initialRotation,
            color:              this.color
        }
        return new CelestialBody(newData);
    }
}

export class OrbitingBody extends CelestialBody implements IOrbitingBody {
    readonly orbit!:            Orbit;
    readonly orbiting!:         number;
    readonly tidallyLocked!:    boolean;
    //@ts-ignore
    readonly soi!:              number;

    constructor(data: IOrbitingBody, public readonly attractor: CelestialBody, anglesToRad: boolean = false) {
        super(data);
        
        this.orbit          = new Orbit(data.orbit, this.attractor, anglesToRad);
        this.orbiting       = data.orbiting;
        this.soi            = data.soi;
        this.tidallyLocked  = data.tidallyLocked || false;
    }

    public get data(): IOrbitingBody {
        return {
            ...super.data,
            orbit:          this.orbit.data,
            orbiting:       this.orbiting,
            soi:            this.soi,
        };
    }

    public rescaleOrbiting(scale: number, scaledAttractor: CelestialBody) : OrbitingBody {
        const newOrbit = this.orbit.rescale(scale, scaledAttractor);
        const newGravParam = this.geeASL * this.radius * this.radius * scale * scale * 9.80665;
        const newSoi = this.soi * scale; // newOrbit.semiMajorAxis * (newGravParam / scaledAttractor.stdGravParam)**(2/5);
        const newMass = this.mass * scale * scale; // newGravParam / 6.7430e-11;
        const newData: IOrbitingBody = {
            id:                 this.id,
            name:               this.name,
            radius:             this.radius * scale,
            maxTerrainHeight:   this.maxTerrainHeight * scale,
            atmosphereHeight:   this.atmosphereHeight * scale,
            mass:               newMass,
            geeASL:             this.geeASL,
            stdGravParam:       newGravParam,
            soi:                newSoi,
            rotationPeriod:     this.tidallyLocked ? newOrbit.siderealPeriod : this.rotationPeriod,
            initialRotation:    this.initialRotation,
            color:              this.color,
            orbit:              newOrbit.data,
            orbiting:           newOrbit.orbiting,
        }
        return new OrbitingBody(newData, scaledAttractor);
    }
}

export function isOrbitingBody(body: ICelestialBody): body is OrbitingBody {
    return (body as OrbitingBody).orbiting !== undefined;
}

export default CelestialBody;