import Kepler from "../libs/kepler";
import Vessel from "../objects/vessel";
import parseConfigNodes from "./parseConfigNodes";
import antennas from "../../data/antennas.json";
import SolarSystemUtils from "../libs/systemutils";

import { vec3, cartesianToSpherical, radToDeg, HALF_PI } from "../libs/math";

/// READ KSP1 SAVES (.sfs FILES) ///

function dataToCommRange(vesselObject: any): number {
    let bestDistance = 0;
    let sumDistance = 0;
    let sumCombinability = 0;
    if(vesselObject.PART !== undefined) {
        if(Array.isArray(vesselObject.PART)) {
            for(let i=0; i<vesselObject.PART.length; i++) {
                const nameIdx = antennas.names.findIndex(name => name === (vesselObject.PART[i].name as string).split(".")[0]);
                if(nameIdx !== -1) {
                    const dist = antennas.distances[nameIdx];
                    bestDistance = Math.max(dist, bestDistance);
                    sumDistance += dist;
                    sumCombinability += dist * antennas.combinabilities[nameIdx];
                }
            } 
        } else {
            const nameIdx = antennas.names.findIndex(name => name === (vesselObject.PART.name as string).split(".")[0]);
            if(nameIdx !== -1) {
                const dist = antennas.distances[nameIdx];
                bestDistance = Math.max(dist, bestDistance);
                sumDistance += dist;
                sumCombinability += dist * antennas.combinabilities[nameIdx];
            }
        }
    }
    return bestDistance * ((sumDistance / bestDistance) ** (sumCombinability / sumDistance));
}

function dataToVessel(vesselObject: any, system: ISolarSystem): IVessel | undefined {
    // name
    const name  = vesselObject.name;

    // type (for sprite icon/display toggle)
    const type = vesselObject.type as VesselType;

    // orbit
    const sma   = parseFloat(vesselObject.ORBIT.SMA);
    const ecc   = parseFloat(vesselObject.ORBIT.ECC);
    const inc   = parseFloat(vesselObject.ORBIT.INC);
    const arg   = parseFloat(vesselObject.ORBIT.LPE);
    const lan   = parseFloat(vesselObject.ORBIT.LAN);
    const mo    = parseFloat(vesselObject.ORBIT.MNA);
    const epoch = parseFloat(vesselObject.ORBIT.EPH); 

    const orbiting = parseInt(vesselObject.ORBIT.REF);
    const body = orbiting === 0 ? system.sun : system.orbiterIds.get(orbiting);
    if (!body) {
        return undefined
    }
    
    const elements: OrbitalElements = {
        semiMajorAxis: sma,
        eccentricity: ecc,
        inclination: inc,
        argOfPeriapsis: arg,
        ascNodeLongitude: lan,
        meanAnomalyEpoch: mo,
        epoch: epoch,
        orbiting: orbiting,
    }
    const orbit: IOrbit = Kepler.orbitFromElements(elements, body);

    // maneuvers
    const maneuvers: ManeuverComponents[] = [];
    if(vesselObject.FLIGHTPLAN !== undefined) {
        if(vesselObject.FLIGHTPLAN.MANEUVER !== undefined) {
            if(Array.isArray(vesselObject.FLIGHTPLAN.MANEUVER)) {
                for(let i=0; i<vesselObject.FLIGHTPLAN.MANEUVER.length; i++) {
                    const date = parseFloat(vesselObject.FLIGHTPLAN.MANEUVER[i].UT);
                    const dVstrings = vesselObject.FLIGHTPLAN.MANEUVER[i].dV.split(',');
                    const prograde = parseFloat(dVstrings[2]);
                    const normal = parseFloat(dVstrings[1]);
                    const radial = parseFloat(dVstrings[0]);
                    const maneuver: ManeuverComponents = { date, prograde, normal, radial };
                    maneuvers.push(maneuver)
                }
            } else {
                const date = parseFloat(vesselObject.FLIGHTPLAN.MANEUVER.UT);
                const dVstrings = vesselObject.FLIGHTPLAN.MANEUVER.dV.split(',');
                const prograde = parseFloat(dVstrings[2]);
                const normal = parseFloat(dVstrings[1]);
                const radial = parseFloat(dVstrings[0]);
                const maneuver: ManeuverComponents = { date, prograde, normal, radial };
                maneuvers.push(maneuver)
            }
        }
    }

    // comm distance
    const commRange = dataToCommRange(vesselObject);

    const vessel: IVessel = {name, type, orbit, maneuvers, commRange};
    return vessel;
}

function dataToLandedVessel(vesselObject: any): LandedVessel {
    const name  = vesselObject.name;
    const type = vesselObject.type as VesselType;
    const bodyIndex = parseInt(vesselObject.ORBIT.REF);
    const latitude = parseFloat(vesselObject.lat);
    const longitude = parseFloat(vesselObject.lon);
    const altitude = parseFloat(vesselObject.alt) + parseFloat(vesselObject.hgt);
    const commRange = dataToCommRange(vesselObject);
    return {name, type, bodyIndex, latitude, longitude, altitude, commRange}
}

function saveDataToVessels(saveData: any, system: ISolarSystem): {vessels: Vessel[], landedVessels: LandedVessel[]} {
    const vesselObjects = saveData.GAME.FLIGHTSTATE.VESSEL;
    const vessels: Vessel[] = [];
    const landedVessels: LandedVessel[] = [];
    if(vesselObjects === undefined) {
        return {vessels, landedVessels};
    }
    if(Array.isArray(vesselObjects)) {
        for(let i=0; i<vesselObjects.length; i++) {
            if(vesselObjects[i].landed === "False" && vesselObjects[i].splashed === "False") {
                const newVessel = dataToVessel(vesselObjects[i], system);
                if (newVessel) {
                    vessels.push(new Vessel(newVessel, system));
                }
            } else {
                const newVessel = dataToLandedVessel(vesselObjects[i]);
                if (newVessel) {
                    landedVessels.push(newVessel);
                }
            }
        }
    } else {
        if(vesselObjects.landed === "False" && vesselObjects.splashed === "False") {
            const newVessel = dataToVessel(vesselObjects, system) as IVessel;
            if (newVessel) {
                vessels.push(new Vessel(newVessel, system));
            }
        } else {
            const newVessel = dataToLandedVessel(vesselObjects);
            if (newVessel) {
                landedVessels.push(newVessel);
            }
        }
    }
    return {vessels, landedVessels};
}

/// READ KSP2 SAVES (.json FILES) ///

function dataToCommRange2(vesselObject: any): number {
    // TO DO
    return 0;
}

function dataToVessel2(vesselObject: any, system: ISolarSystem): IVessel {
    // name
    const name  = vesselObject.AssemblyDefinition.assemblyName;

    // type (for sprite icon/display toggle)
    const type = "Ship"; // not sure if/where this is stored now

    // orbit
    const sma   = parseFloat(vesselObject.location.serializedOrbit.semiMajorAxis);
    const ecc   = parseFloat(vesselObject.location.serializedOrbit.eccentricity);
    const inc   = parseFloat(vesselObject.location.serializedOrbit.inclination);
    const arg   = parseFloat(vesselObject.location.serializedOrbit.argumentOfPeriapsis);
    const lan   = parseFloat(vesselObject.location.serializedOrbit.longitudeOfAscendingNode);
    const mo    = parseFloat(vesselObject.location.serializedOrbit.meanAnomalyAtEpoch);
    const epoch = parseFloat(vesselObject.location.serializedOrbit.epoch); 

    const body = SolarSystemUtils.bodyFromName(system, vesselObject.location.serializedOrbit.referenceBodyGuid)
    const orbiting = body.id;

    const elements: OrbitalElements = {
        semiMajorAxis: sma,
        eccentricity: ecc,
        inclination: inc,
        argOfPeriapsis: arg,
        ascNodeLongitude: lan,
        meanAnomalyEpoch: mo,
        epoch: epoch,
        orbiting: orbiting,
    }

    const orbit: IOrbit = Kepler.orbitFromElements(elements, body);

    // maneuvers
    const maneuvers: ManeuverComponents[] = [];
    const saveManeuvers = vesselObject.maneuverPlanState.maneuvers;
    for(let i=0; i<saveManeuvers.length; i++) {
        const date = parseFloat(saveManeuvers[i].Time);
        const prograde = parseFloat(saveManeuvers[i].BurnVector.z);
        const normal = parseFloat(saveManeuvers[i].BurnVector.y);
        const radial = parseFloat(saveManeuvers[i].BurnVector.x);
        const maneuver: ManeuverComponents = { date, prograde, normal, radial };
        maneuvers.push(maneuver)
    }

    // comm distance
    const commRange = dataToCommRange2(vesselObject);

    const vessel: IVessel = {name, type, orbit, maneuvers, commRange};
    return vessel;
}

function dataToLandedVessel2(vesselObject: any, system: ISolarSystem): LandedVessel {
    const name  = vesselObject.AssemblyDefinition.assemblyName;
    const type = "Ship";
    const body = SolarSystemUtils.bodyFromName(system, vesselObject.location.serializedOrbit.referenceBodyGuid);
    const x = parseFloat(vesselObject.location.rigidbodyState.localPosition.x)
    const y = parseFloat(vesselObject.location.rigidbodyState.localPosition.z)
    const z = parseFloat(vesselObject.location.rigidbodyState.localPosition.y)
    const {r, theta, phi} = cartesianToSpherical(vec3(x,y,z)); 
    const commRange = dataToCommRange2(vesselObject);
    return {name, 
            type, 
            bodyIndex: body.id, 
            latitude: radToDeg(theta - HALF_PI), 
            longitude: radToDeg(phi), 
            altitude: r - body.radius, 
            commRange};
}

function saveDataToVessels2(saveData: any, system: ISolarSystem): {vessels: Vessel[], landedVessels: LandedVessel[]} {
    const vesselObjects = saveData.Vessels;
    const vessels: Vessel[] = [];
    const landedVessels: LandedVessel[] = [];
    for(let i=0; i<vesselObjects.length; i++) {
        if(vesselObjects[i].vesselState.Situation !== "Landed" && vesselObjects[i].vesselState.Situation !== "Splashed" && vesselObjects[i].vesselState.Situation !== "PreLaunch") {
            vessels.push(new Vessel(dataToVessel2(vesselObjects[i], system), system));
        } else {
            landedVessels.push(dataToLandedVessel2(vesselObjects[i], system))
        }
    }

    return {vessels, landedVessels};
}

/// EXPORTED FUNCTION FOR READING ANY SAVE FILES ///

function saveFileToVessels(saveFile: string, system: ISolarSystem, filetype: "sfs" | "json"): {vessels: Vessel[], landedVessels: LandedVessel[]} {
    if (filetype === 'sfs') {
        const saveData = parseConfigNodes(saveFile);
        const {vessels, landedVessels} = saveDataToVessels(saveData, system);
        return {vessels, landedVessels};
    } else if (filetype === 'json') {
        const saveData = JSON.parse(saveFile);
        const {vessels, landedVessels} = saveDataToVessels2(saveData, system);
        return {vessels, landedVessels};
    } else {
        return {vessels: [], landedVessels: []}
    }
}

export default saveFileToVessels