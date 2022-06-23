import SolarSystem from "../objects/system";
import { OrbitingBody } from "../objects/body";
import parseConfigNodes from "./parseConfigNodes";
import Color from "../objects/color";
import Kepler from "../libs/kepler";
import { degToRad, radToDeg, colorFromRGBA } from "../libs/math";
import loadSystemData from "./loadSystem";

export function fileToSunConfig(configFile: string): SunConfig {
    const configData: any = parseConfigNodes(configFile);
    const topKey = [...Object.keys(configData)][0];
    const sunData = configData[topKey].Body;

    const name = sunData.name;

    const sunConfig: SunConfig = {
        name,
        radius:             sunData.Properties.radius,
        atmosphereHeight:   sunData.Atmosphere ? (sunData.Atmosphere.maxAltitude || sunData.Atmosphere.altitude) : undefined,
        stdGravParam:       sunData.Properties.gravParameter,
        geeASL:             sunData.Properties.geeASL,
        rotationPeriod:     sunData.Properties.rotationPeriod,
        initialRotation:    sunData.Properties.initialRotation,
        templateName:       "Sun",
    }
    return sunConfig;
}

export function fileToBodyConfig(configFile: string): OrbitingBodyConfig {
    const configData: any = parseConfigNodes(configFile);
    const topKey = [...Object.keys(configData)][0];
    const bodyData = configData[topKey].Body;

    const templateName = bodyData.Template ? bodyData.Template.name : "Kerbin";

    const name = bodyData.name;
    // name = configData[topKey].cbNameLater || name;

    const flightGlobalsIndex = bodyData.flightGlobalsIndex;
    
    const radius = bodyData.Properties.radius;
    const stdGravParam = bodyData.Properties.gravParameter;
    const geeASL = bodyData.Properties.geeASL;
    const mass = bodyData.Properties.mass;
    const soi = bodyData.Properties.sphereOfInfluence;

    const rotationPeriod = bodyData.Properties.rotationPeriod;
    const initialRotation = bodyData.Properties.initialRotation;

    const atmosphereHeight = bodyData.Atmosphere ? (bodyData.Atmosphere.maxAltitude || bodyData.Atmosphere.altitude) : undefined;

    const semiMajorAxis = bodyData.Orbit.semiMajorAxis;
    const eccentricity = bodyData.Orbit.eccentricity;
    const inclination = bodyData.Orbit.inclination;
    const argOfPeriapsis = bodyData.Orbit.argumentOfPeriapsis;
    const ascNodeLongitude = bodyData.Orbit.longitudeOfAscendingNode;
    const meanAnomalyEpoch = bodyData.Orbit.meanAnomalyAtEpoch || String(degToRad(Number(bodyData.Orbit.meanAnomalyAtEpochD)));
    const epoch = bodyData.Orbit.epoch;
    const referenceBody = bodyData.Orbit.referenceBody;

    const color = bodyData.Orbit.color;

    const bodyConfig: OrbitingBodyConfig = {
        flightGlobalsIndex,
        name,
        radius,
        atmosphereHeight,
        geeASL,
        mass,
        stdGravParam,
        soi,
        rotationPeriod,
        initialRotation,
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
        rotationPeriod:         sun.rotationPeriod ? String(sun.rotationPeriod) : undefined,
        initialRotation:        sun.initialRotation ? String(sun.initialRotation) : undefined,
        color:                  (new Color(sun.color)).toString(),
        templateName:           sun.name,
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
        rotationPeriod:         body.rotationPeriod ? String(body.rotationPeriod) : undefined,
        initialRotation:        body.initialRotation ? String(body.initialRotation) : undefined,
        semiMajorAxis:          String(body.orbit.semiMajorAxis),
        eccentricity:           String(body.orbit.eccentricity),
        inclination:            String(radToDeg(body.orbit.inclination)),
        argOfPeriapsis:         String(radToDeg(body.orbit.argOfPeriapsis)),
        ascNodeLongitude:       String(radToDeg(body.orbit.ascNodeLongitude)),
        meanAnomalyEpoch:       String(body.orbit.meanAnomalyEpoch),
        epoch:                  String(body.orbit.epoch),
        color:                  (new Color(body.color)).toString(),
        referenceBody:          system.bodyFromId(body.orbiting).name,
        templateName:           body.name,
    }
}

export function bodyConfigsToTree(sunConfig: SunConfig | OrbitingBodyConfig, bodyConfigs: OrbitingBodyConfig[], refSystem: SolarSystem): {tree: TreeNode<SunConfig | OrbitingBodyConfig>, orphans: TreeNode<OrbitingBodyConfig>[]} {
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
        // if none of the unassigned configs get added to the tree, break the loop
        if(unassignedBodyConfigs.length === prevUnassignedLength) {
            break;
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

    return {tree: sunNode, orphans: unassignedBodyConfigs.map(c => {return {data: c}}) as TreeNode<OrbitingBodyConfig>[]};
}

function depthFirstAddChildrenToList(list: (SunConfig | OrbitingBodyConfig)[], node: TreeNode<SunConfig | OrbitingBodyConfig>) {
    list.push(node.data)
    if(node.children) {
        for(let i=0; i<node.children.length; i++) {
            depthFirstAddChildrenToList(list, node.children[i])
        }
    }
}

function flightGlobalsBodiesIndexes(bodiesList: (SunConfig | OrbitingBodyConfig)[], refSystem: SolarSystem) {
    const usedFlightGlobalsIdxs: number[] = [0];
    const originalIdxs: number[] = [0];
    for(let i=1; i<bodiesList.length; i++) {
        if(bodiesList[i].flightGlobalsIndex) {
            usedFlightGlobalsIdxs.push(Number(bodiesList[i].flightGlobalsIndex));
            originalIdxs.push(i);
        } else {
            const bodyName = bodiesList[i].name || bodiesList[i].templateName as string;
            const refBodyName = refSystem.bodies.map(bd => bd.name).find(name => name === bodyName);
            if(refBodyName !== undefined) {
                const refBody = refSystem.bodyFromName(refBodyName as string);
                usedFlightGlobalsIdxs.push(refBody.id);
                originalIdxs.push(i);
            }
        }
    }

    const flightGlobalsIdxs: number[] = [0];
    let nextIdx = 1;
    for(let i=1; i<bodiesList.length; i++) {
        const oidx = originalIdxs.find(idx => idx === i)
        if(oidx !== undefined) {
            flightGlobalsIdxs.push(usedFlightGlobalsIdxs[i])
        } else {
            const indexIsDuplicate = (index: number) => {
                return usedFlightGlobalsIdxs.find(existing => existing === index) !== undefined;
            }
            while(indexIsDuplicate(nextIdx)) {
                nextIdx += 1;
            }
            flightGlobalsIdxs.push(nextIdx);
        }
    }

    const ids = flightGlobalsIdxs.map((fgi, idx) => {return {idx, fgi}})
                                 .sort((a, b) => a.fgi - b.fgi)
                                 .map((fgiidx, idx2) => {return {gi: fgiidx.idx, idx2}})
                                 .sort((a, b) => a.gi - b.gi)
                                 .map(giidx => giidx.idx2);

    return ids;
}

export function configReferenceBodyName(config: OrbitingBodyConfig, refSystem: SolarSystem): string {
    return config.referenceBody || refSystem.bodyFromId((refSystem.bodyFromName(config.templateName as string) as OrbitingBody).orbiting).name;
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
        rotationPeriod:     data.rotationPeriod ? Number(data.rotationPeriod) : template!.rotationPeriod,
        initialRotation:    data.initialRotation ? Number(data.initialRotation) : template!.initialRotation,
        color:              data.color ? colorFromRGBA(data.color) : {r: 254, g: 198, b: 20} as IColor,
    }
    return sun;
}

function bodyConfigToSystemInputs(data: OrbitingBodyConfig, id: number, parentId: number, refSystem: SolarSystem): OrbitingBodyInputs {
    const template = data.templateName ? refSystem.bodyFromName(data.templateName) as OrbitingBody : undefined;
    const allGravityMissing = (data.mass === undefined) && (data.stdGravParam === undefined) && (data.geeASL === undefined);

    // we need to have the stdGravParam ready here
    const radius = data.radius ? Number(data.radius) : template!.radius;
    let stdGravParam: number = 1;
    if(!allGravityMissing && (data.stdGravParam === undefined || data.stdGravParam === null)) {
        if(data.geeASL !== undefined) {
            stdGravParam = Number(data.geeASL) * radius * radius * Kepler.gravitySeaLevelConstant;
        } else {
            stdGravParam = Number(data.mass) * Kepler.newtonGravityConstant;
        }
    }

    const body: OrbitingBodyInputs = {
        id,
        name:               data.name || template!.name,
        radius:             data.radius ? Number(data.radius) : template!.radius,
        atmosphereHeight:   data.atmosphereHeight ? Number(data.atmosphereHeight) : template!.atmosphereHeight,
        mass:               allGravityMissing ? template!.mass : (data.mass ? Number(data.mass) : undefined),
        geeASL:             allGravityMissing ? template!.geeASL : (data.geeASL ? Number(data.geeASL) : undefined),
        stdGravParam:       allGravityMissing ? template!.stdGravParam : (data.stdGravParam ? Number(data.stdGravParam) : stdGravParam),
        soi:                data.soi ? Number(data.soi) : undefined,
        rotationPeriod:     data.rotationPeriod ? Number(data.rotationPeriod) : template!.rotationPeriod,
        initialRotation:    data.initialRotation ? Number(data.initialRotation) : template!.initialRotation,
        color:              data.color ? colorFromRGBA(data.color) : {r: 200, g: 200, b:200} as IColor,
        orbit:              {
                                semiMajorAxis:      data.semiMajorAxis ? Number(data.semiMajorAxis) : template!.orbit.semiMajorAxis,
                                eccentricity:       data.eccentricity ? Number(data.eccentricity) : template!.orbit.eccentricity,
                                inclination:        data.inclination ? Number(data.inclination) : radToDeg(template!.orbit.inclination),
                                argOfPeriapsis:     data.argOfPeriapsis ? Number(data.argOfPeriapsis) : radToDeg(template!.orbit.argOfPeriapsis),
                                ascNodeLongitude:   data.ascNodeLongitude ? Number(data.ascNodeLongitude) : radToDeg(template!.orbit.ascNodeLongitude),
                                meanAnomalyEpoch:   data.meanAnomalyEpoch ? Number(data.meanAnomalyEpoch) : template!.orbit.meanAnomalyEpoch,
                                epoch:              data.epoch ? Number(data.epoch) : template!.orbit.epoch,
                                orbiting:           parentId,
                            }
    }
    return body;
}

export function configsTreeToSystem(tree: TreeNode<SunConfig | OrbitingBodyConfig>, refSystem: SolarSystem, scale=1) {
    const sun = sunConfigToSystemInputs(tree.data, refSystem);

    const bodyConfigsList: (SunConfig | OrbitingBodyConfig)[] = [];
    depthFirstAddChildrenToList(bodyConfigsList, tree);
    const ids = flightGlobalsBodiesIndexes(bodyConfigsList, refSystem);
    
    // console.log(JSON.stringify(bodyConfigsList))

    const parentIds = new Map<string, number>();
    parentIds.set(sun.name, sun.id);
    const orbitingBodies: OrbitingBodyInputs[] = [];
    for(let i=1; i<bodyConfigsList.length; i++) {
        const config = bodyConfigsList[i] as OrbitingBodyConfig;
        parentIds.set(config.name || config.templateName as string, ids[i])

        const parentName = configReferenceBodyName(config, refSystem);
        const parentId = parentIds.get(parentName) as number;
        const inputs = bodyConfigToSystemInputs(config, ids[i], parentId, refSystem);
        orbitingBodies.push(inputs);
    }

    let system = loadSystemData([sun, ...orbitingBodies]);

    let safeScale = Math.max(1e-3, scale);
    safeScale = isNaN(safeScale) ? 1 : safeScale;
    if(safeScale !== 1) {
        system = system.rescale(safeScale);
    }
    return system;
}

export default fileToBodyConfig;