import React, { useRef } from 'react';
import * as THREE from 'three';
import Orbit from '../../main/objects/orbit';
import Kepler from '../../main/libs/kepler';
import { TWO_PI, div3, /*hexFromColorString,*/ linspace } from '../../main/libs/math';
import DepartArrive from '../../main/libs/departarrive';
import { BufferAttribute } from 'three';
import Color from '../../main/objects/color';


function getPoints(orbit: Orbit, plotSize: number, color: IColor) {
    const fullColor = new Color(color);
    
    let nuMin: number = 0;
    let nuMax: number = TWO_PI;
    if(orbit.eccentricity > 1 || (orbit.apoapsis > (orbit.attractorSoi || Infinity))) {
        nuMin = DepartArrive.insertionTrueAnomaly(orbit, orbit.attractorSoi as number);
        nuMax = DepartArrive.ejectionTrueAnomaly(orbit, orbit.attractorSoi as number);
    }
    const nus = linspace(nuMin, nuMax, 200);
    const colorScales = linspace(0, 1, 200);
    
    const points: THREE.Vector3[] = [];
    const colors: number[] = [];
    for(let i=0; i<nus.length; i++) {
        const pt = div3(Kepler.positionAtTrueAnomaly(orbit, nus[i]), plotSize);
        points.push(new THREE.Vector3(pt.x, pt.z, pt.y));
        const pointColor = fullColor.rescale(colorScales[i])
        colors.push(pointColor.r/255, pointColor.g/255, pointColor.b/255)
    }
    return {points, colors: new Float32Array(colors)};
}

function OrbitLine({orbit, plotSize, color}: {orbit: Orbit, plotSize: number, color: IColor}) {
    const {points, colors} = getPoints(orbit, plotSize, color);
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
    lineGeometry.setAttribute('color', new BufferAttribute(colors,3))
    return (
        //@ts-ignore
        <line geometry={lineGeometry}>
           <lineBasicMaterial vertexColors={true} attach="material" linewidth={10} />
        </line>
    );
}
  
  export default OrbitLine