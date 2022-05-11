import Kepler from "../libs/kepler";
import Vessel from "../objects/vessel";
import { degToRad } from "../libs/math";

export function parseSaveFile(fileData: string) {
    // preprocessing
    fileData = fileData.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');   // removes all double slash '//' comments
    fileData = fileData.replace(/=/g, ' = ');                      // ensure spaces around each '='
    fileData = fileData.replace(/\t/g, '');                        // remove all tabs
    fileData = fileData.replace(/\r/g, '\n')                       // replace all return character '/r' with line break '/n'
    while (fileData.includes('\n\n')) {                 // ensure only single line breaks
        fileData = fileData.replace(/\n\n/g, '\n');
    }
    while (fileData.includes('  ')) {
        fileData = fileData.replace(/ {2,}/g, ' ');     // ensure only single spaces
    }

    // characters that signal key/value start/end
    const trigger = new Set(['\n', '}', '=']);
    const keyIgnore = new Set(['\n', ' ', '{', '}', '=']);

    // object to be returned
    const outObject = {};

    // prepare arrays to store key/value indices
    const keyRead = [0, NaN];
    let valueRead: number = NaN;
    const inNodes: string[] = [];
    let writeList: any[];
    let char: string;

    // iterate through each character
    for(let i=0; i<fileData.length; i++) { //(let i=0; i<fileData.length; i++) 
        char = fileData.charAt(i);
        // check if the current character leads to an action
        if (trigger.has(char)) {
            if (char === '\n') {
                // if the key is empty, continue
                if ((keyRead[0] === i - 1) && keyIgnore.has(fileData[keyRead[0]])) {
                    // pass
                } else {
                    // if the next character is an open bracket, save it to a new node
                    if (fileData[i+1] === '{') {
                        inNodes.push([fileData.slice(keyRead[0], i)].join());
                        writeList = inNodes.slice();
                        writeList.push({})
                    // otherwise it a value in an existing node
                    } else {
                        writeList = inNodes.slice();
                        writeList.push([fileData.slice(keyRead[0], keyRead[1]+1)].join())
                        writeList.push(fileData.slice(valueRead, i))
                    }
                // set value in outObject
                setValue(outObject, writeList)
                }
                keyRead[0] = i+1;
                keyRead[1] = NaN;
            // if the character is a closed bracket, the end of a node has been reached   
            } else if (char === '}') {
                if (inNodes.length > 0) {
                    inNodes.pop()
                }
            // the last case is that the character is an =, and a key has been read
            } else {
                keyRead[1] = i - 2;
                valueRead = i + 2;
            }
        }
    }
    return outObject
}

function setValue(obj: Object, addressList: any[]) {
    let current: any = obj;
    for(let i=0; i<addressList.length - 2; i++) {
        if(Array.isArray(current)) {
            // if current is an array, we're always going to care about the last entry
            current = current[current.length - 1][addressList[i]];
        } else {
            current = current[addressList[i]]
        }
    }
    if(Array.isArray(current)) {
        current = current[current.length - 1];
    }

    const key = addressList[addressList.length - 2];
    const val = addressList[addressList.length - 1];

    if(typeof val === "object") {
        if(current.hasOwnProperty(key)) {
            if(Array.isArray(current[key])) {
                current[key].push(val);
            } else {
                current[key] = [current[key], val];
            }
        } else {
            current[key] = val;
        }
    } else {
        if(Array.isArray(current[key])) {
            current[key].push(val);
        } else {
            current[key] = val;
        }
    }
}

function vesselDataToVessel(vesselObject: any, system: ISolarSystem): IVessel {
    const name  = vesselObject.name;

    console.log(vesselObject)

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
    
    const vessel: IVessel = {name, orbit};
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
    const saveData = parseSaveFile(saveFile);
    const vessels = saveDataToVessels(saveData, system);
    return vessels;
}

export default saveFileToVessels