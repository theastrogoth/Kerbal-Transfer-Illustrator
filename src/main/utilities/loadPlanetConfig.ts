import SolarSystem from "../objects/system";
import { OrbitingBody } from "../objects/body";
import parseConfigNodes from "./parseConfigNodes";
import Color from "../objects/color";
import Kepler from "../libs/kepler";
import { colorFromString } from "../libs/math";
import loadSystemData from "./loadSystem";

export function fileToSunConfig(configFile: string): SunConfig {
    const configData: any = parseConfigNodes(configFile);
    const topKey = [...configData.keys()][0];

    const name = configData[topKey].Body.name;
    // name = configData[topKey].cbNameLater || name;

    const bodyData: SunConfig = {
        name,
        radius:             configData[topKey].Body.Properties.radius,
        atmosphereHeight:   configData[topKey].Body.Atmosphere.altitude,
        stdGravParam:       configData[topKey].Body.Properties.stdGravParam,
        geeASL:             configData[topKey].Body.Properties.geeASL,
        templateName:       configData[topKey].Body.Template.name,
    }
    return bodyData;
}

export function fileToBodyConfig(configFile: string): OrbitingBodyConfig {
    const configData: any = parseConfigNodes(configFile);
    const topKey = [...configData.keys()][0];

    const templateName = configData[topKey].Body.Template.name;

    let  name = configData[topKey].Body.name;
    name = configData[topKey].cbNameLater || name;

    const flightGlobalsIndex = configData[topKey].Body.flightGlobalsIndex;
    const radius = configData[topKey].Body.Properties.radius;
    const stdGravParam = configData[topKey].Body.Properties.gravParameter;
    const geeASL = configData[topKey].Body.Properties.geeASL;
    const mass = configData[topKey].Body.Properties.mass;
    const soi = configData[topKey].Body.Properties.soi;
    const atmosphereHeight = configData[topKey].Body.Atmosphere.altitude;

    const semiMajorAxis = configData[topKey].Body.Orbit.semiMajorAxis;
    const eccentricity = configData[topKey].Body.Orbit.eccentricity;
    const inclination = configData[topKey].Body.Orbit.inclination;
    const argOfPeriapsis = configData[topKey].Body.Orbit.inclination;
    const ascNodeLongitude = configData[topKey].Body.Orbit.inclination;
    const meanAnomalyEpoch = configData[topKey].Body.Orbit.inclination;
    const epoch = configData[topKey].Body.Orbit.inclination;
    const referenceBody = configData[topKey].Body.Orbit.referenceBody;

    const color = configData[topKey].Body.Orbit.color;

    const bodyConfig: OrbitingBodyConfig = {
        flightGlobalsIndex,
        name,
        radius,
        atmosphereHeight,
        geeASL,
        mass,
        stdGravParam,
        soi,
        semiMajorAxis,
        eccentricity,
        inclination,
        argOfPeriapsis,
        ascNodeLongitude,
        meanAnomalyEpoch,
        epoch,
        color,
        referenceBody,
        templateName,
    }
    return bodyConfig;
}

export function sunToConfig(sun: ICelestialBody): SunConfig {
    return {
        flightGlobalsIndex:     String(sun.id),
        name:                   String(sun.name),
        radius:                 String(sun.radius),
        atmosphereHeight:       sun.atmosphereHeight ? String(sun.atmosphereHeight) : undefined,
        geeASL:                 sun.geeASL ? String(sun.geeASL) : undefined,
        mass:                   sun.mass ? String(sun.mass) : undefined,
        stdGravParam:           String(sun.stdGravParam),
        templateName:           String(sun.name),
    }
}

export function bodyToConfig(body: IOrbitingBody, system: SolarSystem): OrbitingBodyConfig {
    return {
        flightGlobalsIndex:     String(body.id),
        name:                   body.name,
        radius:                 String(body.radius),
        maxTerrainHeight:       body.maxTerrainHeight ? String(body.maxTerrainHeight) : undefined,
        atmosphereHeight:       body.atmosphereHeight ? String(body.atmosphereHeight) : undefined,
        geeASL:                 body.geeASL ? String(body.geeASL) : undefined,
        mass:                   body.mass ? String(body.mass) : undefined,
        stdGravParam:           String(body.stdGravParam),
        soi:                    String(body.soi),
        semiMajorAxis:          String(body.orbit.semiMajorAxis),
        eccentricity:           String(body.orbit.eccentricity),
        inclination:            String(body.orbit.inclination),
        argOfPeriapsis:         String(body.orbit.argOfPeriapsis),
        ascNodeLongitude:       String(body.orbit.ascNodeLongitude),
        meanAnomalyEpoch:       String(body.orbit.meanAnomalyEpoch),
        epoch:                  String(body.orbit.epoch),
        color:                  (new Color(body.color)).toString(),
        referenceBody:          system.bodyFromId(body.orbiting).name,
        templateName:           body.name,
    }
}

export function bodyConfigsToTree(sunConfig: SunConfig, bodyConfigs: OrbitingBodyConfig[], refSystem: SolarSystem): TreeNode<SunConfig | OrbitingBodyConfig> {
    const sunNode: TreeNode<SunConfig | OrbitingBodyConfig> = {
        data:       sunConfig,
        children:   [] as TreeNode<OrbitingBodyConfig>[],
    }

    const unassignedBodyConfigs = [...bodyConfigs];
    const nodeslist = [sunNode];
    const assignedNodes = new Map<string, TreeNode<SunConfig | OrbitingBodyConfig> | TreeNode<OrbitingBodyConfig>>()
    assignedNodes.set((sunNode.data.name || sunNode.data.templateName) as string, sunNode);

    // add all configs to the tree
    let prevUnassignedLength: number;
    while(unassignedBodyConfigs.length > 0) {
        prevUnassignedLength = unassignedBodyConfigs.length;
        for(let i=0; i<unassignedBodyConfigs.length; i++) {
            const config = unassignedBodyConfigs[i];
            const parentName = config.referenceBody || refSystem.bodyFromId((refSystem.bodyFromName(config.templateName as string) as OrbitingBody).orbiting).name
            if(assignedNodes.has(parentName)) {
                const configName = (config.name || config.templateName) as string;
                const newNode: TreeNode<OrbitingBodyConfig> = {data: config,}
                nodeslist.push(newNode)
                assignedNodes.set(configName, newNode);
                const parentNode = assignedNodes.get(parentName) as TreeNode<SunConfig | OrbitingBodyConfig>;
                const newChildren = parentNode.children || [] as TreeNode<OrbitingBodyConfig>[];
                newChildren.push(newNode);
                parentNode.children = newChildren;
                unassignedBodyConfigs.splice(i, 1);
                i -= 1;
            }
        }
        // if none of the unassigned configs get added to the tree, throw an error
        if(unassignedBodyConfigs.length === prevUnassignedLength) {
            throw(Error("The remaining configs do not have valid reference bodies."))
        }
    }

    // sort each config's children according to distance
    for(let i=0; i<nodeslist.length; i++) {
        if(nodeslist[i].children) {
            (nodeslist[i].children as TreeNode<OrbitingBodyConfig>[]).sort((a,b) => {
                let aSMA = a.data.semiMajorAxis ? Number(a.data.semiMajorAxis) : (refSystem.bodyFromName(a.data.templateName as string) as OrbitingBody).orbit.semiMajorAxis;
                let bSMA = b.data.semiMajorAxis ? Number(b.data.semiMajorAxis) : (refSystem.bodyFromName(b.data.templateName as string) as OrbitingBody).orbit.semiMajorAxis;
                // use name as a tiebreaker
                if (aSMA === bSMA) {
                    const aName = a.data.name || a.data.templateName as string;
                    const bName = b.data.name || b.data.templateName as string;
                    if(aName < bName) {
                        aSMA -= 1;
                    } else {
                        aSMA += 1;
                    }
                }

                return aSMA - bSMA;
            })
        }
    }

    return sunNode;
}

function depthFirstAddChildrenToList(list: (SunConfig | OrbitingBodyConfig)[], node: TreeNode<SunConfig | OrbitingBodyConfig>) {
    list.push(node.data)
    if(node.children) {
        for(let i=0; i<node.children.length; i++) {
            depthFirstAddChildrenToList(list, node.children[i])
        }
    }
}

function flightGlobalsBodiesIndexes(bodiesList: (SunConfig | OrbitingBodyConfig)[]) {
    const usedFlightGlobalsIdxs: number[] = [];
    const originalIdxs: number[] = [];
    for(let i=1; i<bodiesList.length; i++) {
        if(bodiesList[i].flightGlobalsIndex) {
            usedFlightGlobalsIdxs.push(Number(bodiesList[i].flightGlobalsIndex));
            originalIdxs.push(i);
        }
    }

    const flightGlobalsIdxs: number[] = [0];
    let nextIdx = 1;
    for(let i=1; i<bodiesList.length; i++) {
        if(i in originalIdxs) {
            flightGlobalsIdxs.push(usedFlightGlobalsIdxs[i])
        } else {
            while(nextIdx in usedFlightGlobalsIdxs) {
                nextIdx += 1;
            }
            flightGlobalsIdxs.push(nextIdx);
        }
    }

    const ids = flightGlobalsIdxs.map((fgi, idx) => {return {idx, fgi}})
                                 .sort((a, b) => a.fgi - b.fgi)
                                 .map((fgiidx) => fgiidx.idx);

    return ids;
}

function sunConfigToSystemInputs(data: SunConfig, refSystem: SolarSystem): ICelestialBody {
    const template = data.templateName ? refSystem.bodyFromName(data.templateName) : undefined;
    const allGravityMissing = (data.mass === undefined) && (data.stdGravParam === undefined) && (data.geeASL === undefined);
    
    // we need to have the stdGravParam ready here
    const radius = data.radius ? Number(data.radius) : template!.radius;
    let stdGravParam: number = 1;
    if(!allGravityMissing && (data.stdGravParam === undefined)) {
        if(data.geeASL !== undefined) {
            stdGravParam = Number(data.geeASL) * radius * radius * Kepler.gravitySeaLevelConstant;
        } else {
            stdGravParam = Number(data.mass) * Kepler.newtonGravityConstant;
        }
    }

    
    const sun: ICelestialBody = {
        id:                 0,
        name:               data.name || template!.name,
        radius,             
        atmosphereHeight:   data.atmosphereHeight ? Number(data.atmosphereHeight) : template!.atmosphereHeight,
        mass:               allGravityMissing ? template!.mass : (data.mass ? Number(data.mass) : undefined),
        geeASL:             allGravityMissing ? template!.geeASL : (data.geeASL ? Number(data.geeASL) : undefined),
        stdGravParam:       allGravityMissing ? template!.stdGravParam : (data.stdGravParam ? Number(data.stdGravParam) : stdGravParam),
        soi:                Infinity,
        color:              {
                                r: 254, 
                                g: 198,
                                b: 20,
                            },
    }
    return sun;
}

function bodyConfigToSystemInputs(data: OrbitingBodyConfig, id: number, parentId: number, refSystem: SolarSystem): OrbitingBodyInputs {
    const template = data.templateName ? refSystem.bodyFromName(data.templateName) as OrbitingBody : undefined;
    const body: OrbitingBodyInputs = {
        id,
        name:               data.name || template!.name,
        radius:             data.radius ? Number(data.radius) : template!.radius,
        atmosphereHeight:   data.atmosphereHeight ? Number(data.atmosphereHeight) : template!.atmosphereHeight,
        mass:               data.mass ? Number(data.mass) : template!.mass,
        geeASL:             data.geeASL ? Number(data.geeASL) : template!.geeASL,
        stdGravParam:       data.stdGravParam ? Number(data.stdGravParam) : template!.stdGravParam,
        soi:                data.soi ? Number(data.soi) : template!.soi,
        color:              data.color ? colorFromString(data.color) : {r: 255, g: 255, b:255} as IColor,
        orbit:              {
                                semiMajorAxis:      data.semiMajorAxis ? Number(data.semiMajorAxis) : template!.orbit.semiMajorAxis,
                                eccentricity:       data.eccentricity ? Number(data.eccentricity) : template!.orbit.eccentricity,
                                inclination:        data.inclination ? Number(data.inclination) : template!.orbit.inclination,
                                argOfPeriapsis:     data.argOfPeriapsis ? Number(data.argOfPeriapsis) : template!.orbit.argOfPeriapsis,
                                ascNodeLongitude:   data.ascNodeLongitude ? Number(data.ascNodeLongitude) : template!.orbit.ascNodeLongitude,
                                meanAnomalyEpoch:   data.meanAnomalyEpoch ? Number(data.meanAnomalyEpoch) : template!.orbit.meanAnomalyEpoch,
                                epoch:              data.epoch ? Number(data.epoch) : template!.orbit.epoch,
                                orbiting:           parentId,
                            }
    }
    return body;
}

export function configsTreeToSystem(tree: TreeNode<SunConfig | OrbitingBodyConfig>, refSystem: SolarSystem) {
    const sun = sunConfigToSystemInputs(tree.data, refSystem);

    const bodyConfigsList: (SunConfig | OrbitingBodyConfig)[] = [];
    depthFirstAddChildrenToList(bodyConfigsList, tree);
    const ids = flightGlobalsBodiesIndexes(bodyConfigsList);
    
    const parentIds = new Map<string, number>();
    parentIds.set(sun.name, sun.id);
    const orbitingBodies: OrbitingBodyInputs[] = [];
    for(let i=0; i<bodyConfigsList.length; i++) {
        const config = bodyConfigsList[i] as OrbitingBodyConfig;
        parentIds.set(config.name || config.templateName as string, ids[i])

        const parentName = config.referenceBody || refSystem.bodyFromId((refSystem.bodyFromName(config.templateName as string) as OrbitingBody).orbiting).name;
        const parentId = parentIds.get(parentName) as number;
        const inputs = bodyConfigToSystemInputs(config, ids[i], parentId, refSystem);
        orbitingBodies.push(inputs);
    }

    const system = loadSystemData([sun, ...orbitingBodies]);
    return system;
}

export default fileToBodyConfig;