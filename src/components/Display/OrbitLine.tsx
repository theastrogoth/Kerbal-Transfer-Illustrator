import React, { useRef } from 'react';
import * as THREE from 'three';
import Orbit from '../../main/objects/orbit';
import Kepler from '../../main/libs/kepler';
import { TWO_PI, div3, /*hexFromColorString,*/ linspace } from '../../main/libs/math';
import DepartArrive from '../../main/libs/departarrive';


function getPoints(orbit: Orbit, plotSize: number) {
    let nuMin: number = 0;
    let nuMax: number = TWO_PI;
    if(orbit.eccentricity > 1 || (orbit.apoapsis > (orbit.attractorSoi || Infinity))) {
        nuMin = DepartArrive.insertionTrueAnomaly(orbit, orbit.attractorSoi as number);
        nuMax = DepartArrive.ejectionTrueAnomaly(orbit, orbit.attractorSoi as number);
    }
    const nus = linspace(nuMin, nuMax, 200);
    
    let points: THREE.Vector3[] = [];
    for(let i=0; i<nus.length; i++) {
        const pt = div3(Kepler.positionAtTrueAnomaly(orbit, nus[i]), plotSize);
        points.push(new THREE.Vector3(pt.x, pt.z, pt.y));
    }
    return points;
}

function OrbitLine({orbit, plotSize, color}: {orbit: Orbit, plotSize: number, color: string}) {
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(getPoints(orbit, plotSize));
    return (
        //@ts-ignore
        <line geometry={lineGeometry}>
           <lineBasicMaterial attach="material" color={color} linewidth={10} />
        </line>
    );
}
  
  export default OrbitLine