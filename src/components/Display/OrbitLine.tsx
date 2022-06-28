import React, { useEffect, useState } from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei'

import Orbit from '../../main/objects/orbit';
import Color from '../../main/objects/color';
import DepartArrive from '../../main/libs/departarrive';
import Kepler from '../../main/libs/kepler';
import { TWO_PI, div3, wrapAngle, linspace } from '../../main/libs/math';

import periapsisIcon from '../../assets/icons/periapsis.png';
import apoapsisIcon from '../../assets/icons/apoapsis.png';

const textureLoader = new THREE.TextureLoader();
const periapsisTexture = textureLoader.load(periapsisIcon);
const apoapsisTexture = textureLoader.load(apoapsisIcon);

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

function getColorsAtDate(date: number, orbit: IOrbit, gradientColors: [number, number, number][], nus: number[], minDate: number =  -Infinity, maxDate: number = Infinity): [number, number, number][] {
    if(date < minDate) {
        return Array(gradientColors.length-1).fill(gradientColors[10])
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
    const shiftedColors = [...firstHalf, ...secondHalf];
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

function getPeriapsisIcon(orbit: Orbit, plotSize: number, nus: number[], color: string = 'white') {
    if(wrapAngle(0, nus[0] - 1e-3) < nus[nus.length-1]) {
        const pos = div3(Kepler.positionAtTrueAnomaly(orbit, 0), plotSize);
        const position = new THREE.Vector3(-pos.x, pos.z, pos.y);
        return <sprite
            scale={[0.075,0.075,0.075]} 
            position={position}
        >
            <spriteMaterial map={periapsisTexture} sizeAttenuation={false} color={color} depthTest={false} />
        </sprite>
    } else {
        return <></>
    }
}

function getApoapsisIcon(orbit: Orbit, plotSize: number, nus: number[], color: string = 'white') {
    if((wrapAngle(Math.PI, nus[0] - 1e-3) < nus[nus.length-1]) && Number.isFinite(orbit.apoapsis) && (orbit.apoapsis < (orbit.attractorSoi || Infinity))) {
        const pos = div3(Kepler.positionAtTrueAnomaly(orbit, Math.PI), plotSize);
        const position = new THREE.Vector3(-pos.x, pos.z, pos.y);
        return <sprite
            scale={[0.075,0.075,0.075]} 
            position={position}
        >
            <spriteMaterial map={apoapsisTexture} sizeAttenuation={false} color={color} depthTest={false} />
        </sprite>
    } else {
        return <></>
    }
}

function OrbitLine({orbit, date, plotSize, minDate = -Infinity, maxDate = Infinity, color = {r: 200, g: 200, b: 200}, periapsis=false, apoapsis=false}: {orbit: Orbit, date: number, plotSize: number, minDate?: number, maxDate?: number, color?: IColor, periapsis?: boolean, apoapsis?: boolean}) {

    const [range, setRange] = useState(getTrueAnomalyRange(orbit, minDate, maxDate));
    const [nus, setNus] = useState(linspace(range.min, range.max, 501));
    const [points, setPoints] = useState(getPoints(orbit, plotSize, nus));
    const [gradientColors, setGradientColors] = useState(getGradientColors(color));
    const [colors, setColors] = useState(getColorsAtDate(date, orbit, gradientColors, nus, minDate, maxDate));

    const [colorString, setColorString] = useState(new Color(color).toString());
    const [periapsisIcon, setPeriapsisIcon] = useState(getPeriapsisIcon(orbit, plotSize, nus, colorString));
    const [apoapsisIcon, setApoapsisIcon] = useState(getApoapsisIcon(orbit, plotSize, nus, colorString));


    useEffect(() => {
        const newRange = getTrueAnomalyRange(orbit, minDate, maxDate);
        setRange(newRange);
        const newNus = linspace(newRange.min, newRange.max, 501);
        setNus(newNus);
        const newPoints = getPoints(orbit, plotSize, newNus)
        setPoints(newPoints);
        setPeriapsisIcon(getPeriapsisIcon(orbit, plotSize, newNus, colorString));
        setApoapsisIcon(getApoapsisIcon(orbit, plotSize, newNus, colorString));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orbit, minDate, maxDate, plotSize])
    useEffect(() => {
        setColorString(new Color(color).toString());
        setGradientColors(getGradientColors(color));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [color])
    useEffect(() => {
        setColors(getColorsAtDate(date, orbit, gradientColors, nus, minDate, maxDate));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [date, gradientColors])

    // const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
    // lineGeometry.setAttribute('color', new THREE.BufferAttribute(colors,3))
    return (
        <>
            <Line 
                points={points}
                color='white'
                vertexColors={colors}
                lineWidth={2}
            />
            {periapsis && periapsisIcon}
            {apoapsis && apoapsisIcon}
        </>
    );
}
  
  export default OrbitLine