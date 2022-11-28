import Kepler from "../libs/kepler";
import Vessel from "../objects/vessel";
import parseConfigNodes from "./parseConfigNodes";
import antennas from "./antennas.json";

function dataToCommRange(vesselObject: any): number {
    let bestDistance = 0;
    let sumDistance = 0;
    let sumCombinability = 0;
    if(vesselObject.PART !== undefined) {
        if(Array.isArray(vesselObject.PART)) {
            for(let i=0; i<vesselObject.PART.length; i++) {
                const nameIdx = antennas.names.findIndex(name => name === vesselObject.PART[i].name);
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

function dataToVessel(vesselObject: any, system: ISolarSystem): IVessel {
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
    const body = orbiting === 0 ? system.sun : (system.orbiterIds.get(orbiting) as IOrbitingBody);
    
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
    return {name, type, bodyIndex, latitude, longitude, altitude}
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
                vessels.push(new Vessel(dataToVessel(vesselObjects[i], system), system));
            } else {
                landedVessels.push(dataToLandedVessel(vesselObjects[i]))
            }
        }
    } else {
        if(vesselObjects.landed === "False" && vesselObjects.splashed === "False") {
            vessels.push(new Vessel(dataToVessel(vesselObjects, system), system));
        } else {
            landedVessels.push(dataToLandedVessel(vesselObjects))
        }
    }
    return {vessels, landedVessels};
}

function saveFileToVessels(saveFile: string, system: ISolarSystem): {vessels: Vessel[], landedVessels: LandedVessel[]} {
    const saveData = parseConfigNodes(saveFile);
    const {vessels, landedVessels} = saveDataToVessels(saveData, system);
    console.log(landedVessels)
    return {vessels, landedVessels};
}

export default saveFileToVessels