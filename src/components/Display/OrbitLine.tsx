import React, { useEffect, useState } from 'react';
import * as THREE from 'three';

import Orbit from '../../main/objects/orbit';
import Color from '../../main/objects/color';
import DepartArrive from '../../main/libs/departarrive';
import Kepler from '../../main/libs/kepler';
import { TWO_PI, div3, wrapAngle, linspace } from '../../main/libs/math';

function getGradientColors(color:IColor) {
    const fullColor = new Color(color);
    const colorScales = linspace(0.05, 0.4, 501);
    const gradientColors: [number, number, number][] = [];
    for(let i=0; i<colorScales.length; i++) {
        const pointColor = fullColor.rescale(colorScales[i])
        gradientColors.push([pointColor.r/255, pointColor.g/255, pointColor.b/255])
    }
    return gradientColors;
}

function getColorsAtDate(date: number, orbit: IOrbit, gradientColors: [number, number, number][], nus: number[], minDate: number =  -Infinity, maxDate: number = Infinity) {
    if(date < minDate) {
        return new Float32Array(Array(gradientColors.length-1).fill(gradientColors[10]).flat());
    } 
    const nuAtDate = wrapAngle(Kepler.dateToOrbitTrueAnomaly(Math.min(date, maxDate), orbit), nus[0]);
    const shiftIndex = nus.findIndex(nu => nu > nuAtDate);
    const shiftLength = nus.length - shiftIndex + 1;
    const firstHalf: [number, number, number][] = gradientColors.slice(shiftLength);
    let secondHalf: [number, number, number][];
    if((Math.abs(nus[nus.length-1] - nus[0])%TWO_PI) > 1e-3) {
        secondHalf = Array(shiftLength).fill(gradientColors[10]);
    } else {
        secondHalf = gradientColors.slice(0, shiftLength);
    }
    const shiftedColors = new Float32Array([...firstHalf.flat(), ...secondHalf.flat()]);
    return shiftedColors;
}

function getTrueAnomalyRange(orbit: Orbit, minDate: number = -Infinity, maxDate: number = Infinity) {
    let min: number = Kepler.dateToOrbitTrueAnomaly(minDate, orbit);
    let max: number = Kepler.dateToOrbitTrueAnomaly(maxDate, orbit);
    if(isNaN(min + max)) {
        let tempMin: number = 0;
        let tempMax: number = TWO_PI;
        if(orbit.eccentricity > 1 || (orbit.apoapsis > (orbit.attractorSoi || Infinity))) {
            tempMin = DepartArrive.insertionTrueAnomaly(orbit, orbit.attractorSoi as number);
            tempMax = DepartArrive.ejectionTrueAnomaly(orbit, orbit.attractorSoi as number);
        }
        if(Number.isFinite(maxDate)) {
            min = wrapAngle(Math.min(tempMin, max - TWO_PI), max - TWO_PI + 1e-4);
        } else {
            min = tempMin;
        }
        if(Number.isFinite(minDate)) {
            max = wrapAngle(Math.max(tempMax, min + TWO_PI), min + 1e-4);
        } else {
            max = tempMax;
        }
    } else {
        max = wrapAngle(max, min)
    }
    return {min, max}
}


function getPoints(orbit: Orbit, plotSize: number, nus: number[]) {
    const points: THREE.Vector3[] = [];
    for(let i=0; i<nus.length; i++) {
        const pt = div3(Kepler.positionAtTrueAnomaly(orbit, nus[i]), plotSize);
        points.push(new THREE.Vector3(-pt.x, pt.z, pt.y));
    }
    return points;
}

function OrbitLine({orbit, date, plotSize, minDate = -Infinity, maxDate = Infinity, color = {r: 200, g: 200, b: 200}}: {orbit: Orbit, date: number, plotSize: number, minDate?: number, maxDate?: number, color?: IColor}) {

    const [range, setRange] = useState(getTrueAnomalyRange(orbit, minDate, maxDate));
    const [nus, setNus] = useState(linspace(range.min, range.max, 501));
    const [points, setPoints] = useState(getPoints(orbit, plotSize, nus));
    const [gradientColors, setGradientColors] = useState(getGradientColors(color))
    const [colors, setColors] = useState(getColorsAtDate(date, orbit, gradientColors, nus, minDate, maxDate));

    useEffect(() => {
        const newRange = getTrueAnomalyRange(orbit, minDate, maxDate);
        setRange(newRange);
        const newNus = linspace(newRange.min, newRange.max, 501);
        setNus(newNus);
        const newPoints = getPoints(orbit, plotSize, newNus)
        setPoints(newPoints);
    }, [orbit, minDate, maxDate, plotSize])
    useEffect(() => {
        setGradientColors(getGradientColors(color));
    }, [color])
    useEffect(() => {
        setColors(getColorsAtDate(date, orbit, gradientColors, nus, minDate, maxDate));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [date, gradientColors])

    const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
    lineGeometry.setAttribute('color', new THREE.BufferAttribute(colors,3))
    return (
        <line 
        //@ts-ignore
            geometry={lineGeometry}
        >
            <lineBasicMaterial vertexColors={true} attach="material" linewidth={5} />
        </line>
    );
}
  
  export default OrbitLine