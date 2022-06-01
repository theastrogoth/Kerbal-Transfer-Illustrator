import Kepler from "../libs/kepler";
import Vessel from "../objects/vessel";
import { degToRad } from "../libs/math";
import parseConfigNodes from "./parseConfigNodes";

function vesselDataToVessel(vesselObject: any, system: ISolarSystem): IVessel {
    const name  = vesselObject.name;

    // orbit
    const sma   = parseFloat(vesselObject.ORBIT.SMA);
    const ecc   = parseFloat(vesselObject.ORBIT.ECC);
    const inc   = degToRad(parseFloat(vesselObject.ORBIT.INC));
    const arg   = degToRad(parseFloat(vesselObject.ORBIT.LPE));
    const lan   = degToRad(parseFloat(vesselObject.ORBIT.LAN));
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

    const vessel: IVessel = {name, orbit, maneuvers};
    return vessel;
}

function saveDataToVessels(saveData: any, system: ISolarSystem): Vessel[] {
    const vesselObjects = saveData.GAME.FLIGHTSTATE.VESSEL;
    if(vesselObjects === undefined) {
        return [];
    }
    const vessels: Vessel[] = [];
    if(Array.isArray(vesselObjects)) {
        for(let i=0; i<vesselObjects.length; i++) {
            if(vesselObjects[i].landed === "False" && vesselObjects[i].splashed === "False") {
                vessels.push(new Vessel(vesselDataToVessel(vesselObjects[i], system), system));
            }
        }
    } else {
        if(vesselObjects.landed === "False" && vesselObjects.splashed === "False") {
            vessels.push(new Vessel(vesselDataToVessel(vesselObjects, system), system));
        }
    }
    return vessels;
}

function saveFileToVessels(saveFile: string, system: ISolarSystem): Vessel[] {
    const saveData = parseConfigNodes(saveFile);
    console.log(saveData)
    const vessels = saveDataToVessels(saveData, system);
    console.log(vessels)
    return vessels;
}

export default saveFileToVessels