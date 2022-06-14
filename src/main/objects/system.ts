import { OrbitingBody, CelestialBody, isOrbitingBody } from "./body";

export class SolarSystem implements ISolarSystem {
    readonly sun!:              CelestialBody;
    readonly orbiters!:         OrbitingBody[];
    readonly orbiterIds!:       Map<number, OrbitingBody>;

    constructor(sun: ICelestialBody, bodies: IOrbitingBody[], anglesToRad: boolean = false) {
        this.orbiters = [];
        this.orbiterIds = new Map();
        this.sun = new CelestialBody(sun);
        
        for(let i=0; i<bodies.length; i++){
            const bodydata = bodies[i];
            const attractor = bodydata.orbiting === 0 ? this.sun : (this.orbiterIds!.get(bodydata.orbiting) as OrbitingBody);
            const body = new OrbitingBody(bodydata, attractor, anglesToRad);
            
            this.orbiterIds!.set(body.id, body);
            attractor.orbiters.push(body);
            this.orbiters.push(body);
        }
    }

    public get orbiting() {
        return [...this.orbiterIds!.values()];
    }

    public get bodies(){
        return [this.sun, ...this.orbiters];
    }

    public get data(): ISolarSystem {
        const sun = this.sun.data;
        const orbiters = this.orbiters.map(orb => orb.data);
        const orbiterIds = new Map<number, IOrbitingBody>();
        for(let i=0; i<orbiters.length; i++) {
            orbiterIds.set(orbiters[i].id, orbiters[i]);
        }
        const data = {sun, orbiters, orbiterIds};
        return data;
    }

    public get size() {
        return (1 + this.orbiterIds.size)
    }

    public bodyFromName(name: string) {
        for(const body of [this.sun, ...this.orbiters]) {
            if(body.name === name)
                return body;
        }
        throw new Error(`No body with name ${name}`);
    }

    public bodyFromId(id: number) {
        if(id === 0) {
            return this.sun;
        } else {
            const body = this.orbiterIds.get(id);
            if(!body)
                throw new Error(`No body with id ${id}`);
            return body;
        }
    }

    public sequenceToSun(id: number) {
        let bd = this.bodyFromId(id);
        let seq: number[] = [bd.id];
        while(isOrbitingBody(bd)) {
            bd = this.bodyFromId(bd.orbiting);
            seq.push(bd.id);
        }
        return seq
    }

    public commonAttractorId(id1: number, id2: number) {
        const sunSeq1 = this.sequenceToSun(id1);
        const sunSeq2 = this.sequenceToSun(id2);
        for(let i=0; i<sunSeq1.length; i++) {
            if(sunSeq2.includes(sunSeq1[i])) {
                return sunSeq1[i]
            }
        }
        throw new Error('Bodies do not share a common attractor (error in defining this SolarSystem)')
    }

    public rescale(scale: number) {
        const newSun = this.sun.rescale(scale);
        const oldBodies = [...this.orbiters];
        const newBodies: OrbitingBody[] = [];
        const newBodyIds = new Map<number, CelestialBody | OrbitingBody>()
        newBodyIds.set(newSun.id, newSun);

        while(oldBodies.length > 0) {
            for(let i=0; i<oldBodies.length; i++) {
                const oldBody = oldBodies[i];
                const parent = newBodyIds.get(oldBody.orbiting);
                if(parent !== undefined) {
                    const newBody = oldBody.rescaleOrbiting(scale, parent);
                    newBodies.push(newBody);
                    newBodyIds.set(newBody.id, newBody);
                    oldBodies.splice(i, 1);
                    i--;
                }
            }
        }
        return new SolarSystem(newSun, newBodies, false);
    }
}

export default SolarSystem;