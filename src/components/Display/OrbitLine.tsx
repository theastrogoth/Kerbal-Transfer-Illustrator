import React, { useEffect, useState } from 'react';
import * as THREE from 'three';
import Orbit from '../../main/objects/orbit';
import Kepler from '../../main/libs/kepler';
import { TWO_PI, div3, wrapAngle, linspace } from '../../main/libs/math';
import DepartArrive from '../../main/libs/departarrive';
import { BufferAttribute } from 'three';
import Color from '../../main/objects/color';

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
    if(date < minDate || date > maxDate) {
        return new Float32Array(Array(501).fill(gradientColors[150]).flat())
    } 
    const nuAtDate = wrapAngle(Kepler.dateToOrbitTrueAnomaly(date, orbit), nus[0]);
    const shiftIndex = nus.findIndex(nu => nu > nuAtDate);
    const shiftLength = nus.length - shiftIndex + 1;
    const firstHalf: [number, number, number][] = gradientColors.slice(shiftLength);
    let secondHalf: [number, number, number][];
    if(Number.isFinite(maxDate)) {
        secondHalf = Array(shiftLength).fill(gradientColors[50]);
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
        if(!isNaN(min)) {
            max = Math.max(tempMax, min + TWO_PI);
        } else {
            max = tempMax;
        }
        if(!isNaN(max)) {
            min = Math.min(tempMin, max - TWO_PI);
        } else {
            min = tempMin;
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

function OrbitLine({orbit, date, plotSize, minDate = NaN, maxDate = NaN, color = {r: 200, g: 200, b: 200}}: {orbit: Orbit, date: number, plotSize: number, minDate?: number, maxDate?: number, color?: IColor}) {

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
    lineGeometry.setAttribute('color', new BufferAttribute(colors,3))
    return (
        //@ts-ignore
        <line geometry={lineGeometry} >
            <lineBasicMaterial vertexColors={true} attach="material" linewidth={5} />
        </line>
    );
}
  
  export default OrbitLine