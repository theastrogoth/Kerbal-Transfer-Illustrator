import Kepler from "../libs/kepler";
import SolarSystem from "../objects/system";
import { bodyConfigsToTree, configsTreeToSystem } from "./loadPlanetConfig";

export function loadSystemData(systemData: (ICelestialBody | OrbitingBodyInputs)[]): SolarSystem {
    const sun = systemData[0] as ICelestialBody;
    const orbitersInputs = systemData.slice(1) as OrbitingBodyInputs[];

    const orbiters: IOrbitingBody[] = [];
    const orbiterIds = new Map<number, IOrbitingBody>();
    for(let i=0; i<orbitersInputs.length; i++) {
        const attractorId = orbitersInputs[i].orbit.orbiting;
        const attractor = attractorId === 0 ? sun : orbiterIds.get(attractorId) as IOrbitingBody;
        const newOrbiter = Kepler.inputsToOrbitingBody(orbitersInputs[i], attractor);
        orbiters.push(newOrbiter);
        orbiterIds.set(orbitersInputs[i].id, newOrbiter);
    }

    return new SolarSystem(sun, orbiters, true);
}

export function loadSystemFromConfigs(configs: (SunConfig | OrbitingBodyConfig)[], refSystem: SolarSystem): SolarSystem {
    const sunConfig = configs[0];
    const bodyConfigs = configs.slice(1) as OrbitingBodyConfig[];
    const configsTree = bodyConfigsToTree(sunConfig, bodyConfigs, refSystem);
    const system = configsTreeToSystem(configsTree.tree, refSystem);
    return system
}

export default loadSystemData;