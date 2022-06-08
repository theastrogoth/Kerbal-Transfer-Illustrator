import SolarSystem from "../objects/system";
import parseConfigNodes from "./parseConfigNodes";

function fileToSunConfig(configFile: string): SunConfig {
    const configData: any = parseConfigNodes(configFile);
    const topKey = [...configData.keys()][0];

    let name = configData[topKey].Body.name;
    name = configData[topKey].cbNameLater || name;

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

function configToSun(config: OrbitingBodyConfig, templateSystem: SolarSystem) {
    
}

function configToOrbitingBodyInputs(config: OrbitingBodyConfig, templateSystem: SolarSystem) {

}

export default fileToBodyConfig;