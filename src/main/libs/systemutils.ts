namespace SolarSystemUtils {
    export function bodyFromName(system: ISolarSystem, name: string) {
        for(const body of [system.sun, ...system.orbiters]) {
            if(body.name === name)
                return body;
        }
        throw new Error(`No body with name ${name}`);
    }

    export function bodyFromId(system: ISolarSystem, id: number) {
        if(id === 0) {
            return system.sun;
        } else {
            const body = system.orbiterIds.get(id);
            if(!body)
                throw new Error(`No body with id ${id}`);
            return body;
        }
    }

    export function sequenceToSun(system: ISolarSystem, id: number) {
        let bd = bodyFromId(system, id);
        let seq: number[] = [bd.id];
        while(bd.hasOwnProperty("orbiting")) {
            bd = bodyFromId(system, (bd as IOrbitingBody).orbiting);
            seq.push(bd.id);
        }
        return seq
    }

    export function commonAttractorId(system: ISolarSystem, id1: number, id2: number) {
        const sunSeq1 = sequenceToSun(system, id1);
        const sunSeq2 = sequenceToSun(system, id2);
        for(let i=0; i<sunSeq1.length; i++) {
            if(sunSeq2.includes(sunSeq1[i])) {
                return sunSeq1[i]
            }
        }
        throw new Error('Bodies do not share a common attractor (error in defining this SolarSystem)')
    }
}

export default SolarSystemUtils;