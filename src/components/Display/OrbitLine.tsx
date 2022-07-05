import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Line } from '@react-three/drei'

import Orbit from '../../main/objects/orbit';
import Color from '../../main/objects/color';
import DepartArrive from '../../main/libs/departarrive';
import Kepler from '../../main/libs/kepler';
import { TWO_PI, div3, wrapAngle, linspace, vec3, add3 } from '../../main/libs/math';

import periapsisIcon from '../../assets/icons/periapsis.png';
import apoapsisIcon from '../../assets/icons/apoapsis.png';
import ascendingNodeIcon from '../../assets/icons/ascnode.png';
import descendingNodeIcon from '../../assets/icons/descnode.png';

const textureLoader = new THREE.TextureLoader();
const periapsisTexture = textureLoader.load(periapsisIcon);
const apoapsisTexture = textureLoader.load(apoapsisIcon);
const ascendingNodeTexture = textureLoader.load(ascendingNodeIcon);
const descendingNodeTexture = textureLoader.load(descendingNodeIcon);


type OrbitLineProps = {
    orbit:          Orbit,
    date:           number,
    plotSize:       number,
    minDate?:       number,
    maxDate?:       number,
    centeredAt?:    Vector3,
    depth?:         number,
    name?:          string,
    color?:         IColor,
    setInfoItem:    React.Dispatch<React.SetStateAction<InfoItem>>,
    displayOptions: OrbitDisplayOptions,
}

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
    if((Math.abs(nus[nus.length-1] - nus[0] + 1e-6)%TWO_PI) > 1e-3) {
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
    if(isNaN(min) && isNaN(max)) {
        min = 0;
        max = TWO_PI;
    } else if(isNaN(max) && !isNaN(min)) {
        if(orbit.eccentricity > 1 || (orbit.apoapsis > (orbit.attractorSoi || Infinity))) {
            max = DepartArrive.ejectionTrueAnomaly(orbit, orbit.attractorSoi as number);
        } else {
            max = min + TWO_PI;
        }
    } else if(isNaN(min) && !isNaN(max)) {
        if(orbit.eccentricity > 1 || (orbit.apoapsis > (orbit.attractorSoi || Infinity))) {
            min = DepartArrive.insertionTrueAnomaly(orbit, orbit.attractorSoi as number);
        } else {
            min = max - TWO_PI;
        }
    }
    if(min >= max) {
        max += TWO_PI;
    }
    return {min, max}
}

function getPoints(orbit: Orbit, plotSize: number, nus: number[], centeredAt: Vector3) {
    const points: THREE.Vector3[] = [];
    for(let i=0; i<nus.length; i++) {
        const pt = div3(add3(Kepler.positionAtTrueAnomaly(orbit, nus[i]), centeredAt), plotSize);
        points.push(new THREE.Vector3(-pt.x, pt.z, pt.y));
    }
    return points;
}

function getPeriapsisIcon(orbit: Orbit, plotSize: number, nus: number[], centeredAt: Vector3, handleClick: ((e: ThreeEvent<MouseEvent>) => void), color: string = 'white') {
    if((wrapAngle(0, nus[0] - 1e-3) < nus[nus.length-1]) && (orbit.eccentricity !== 0)) {
        const pos = div3(add3(Kepler.positionAtTrueAnomaly(orbit, 0), centeredAt), plotSize);
        const position = new THREE.Vector3(-pos.x, pos.z, pos.y);
        return <sprite
            scale={[0.075,0.075,0.075]} 
            position={position}
            onClick={handleClick}
        >
            <spriteMaterial map={periapsisTexture} sizeAttenuation={false} color={color} depthTest={false} />
        </sprite>
    } else {
        return <></>
    }
}

function getApoapsisIcon(orbit: Orbit, plotSize: number, nus: number[], centeredAt: Vector3, handleClick: ((e: ThreeEvent<MouseEvent>) => void), color: string = 'white') {
    if((wrapAngle(Math.PI, nus[0] - 1e-3) < nus[nus.length-1]) && Number.isFinite(orbit.apoapsis) && (orbit.apoapsis < (orbit.attractorSoi || Infinity)) && (orbit.eccentricity !== 0)) {
        const pos = div3(add3(Kepler.positionAtTrueAnomaly(orbit, Math.PI), centeredAt), plotSize);
        const position = new THREE.Vector3(-pos.x, pos.z, pos.y);
        return <sprite
            scale={[0.075,0.075,0.075]} 
            position={position}
            onClick={handleClick}
        >
            <spriteMaterial map={apoapsisTexture} sizeAttenuation={false} color={color} depthTest={false} />
        </sprite>
    } else {
        return <></>
    }
}

function getAscendingNodeIcon(orbit: Orbit, plotSize: number, nus: number[], centeredAt: Vector3, handleClick: ((e: ThreeEvent<MouseEvent>) => void), color: string = 'white') {
    if((wrapAngle(-orbit.argOfPeriapsis, nus[0] - 1e-3) < nus[nus.length-1]) && (orbit.inclination !== 0) && (orbit.inclination !== Math.PI)) {
        const pos = div3(add3(Kepler.positionAtTrueAnomaly(orbit, -orbit.argOfPeriapsis), centeredAt), plotSize);
        const position = new THREE.Vector3(-pos.x, pos.z, pos.y);
        return <sprite
            scale={[0.075,0.075,0.075]} 
            position={position}
            onClick={handleClick}
        >
            <spriteMaterial map={ascendingNodeTexture} sizeAttenuation={false} color={color} depthTest={false} />
        </sprite>
    } else {
        return <></>
    }
}

function getDescendingNodeIcon(orbit: Orbit, plotSize: number, nus: number[], centeredAt: Vector3, handleClick: ((e: ThreeEvent<MouseEvent>) => void), color: string = 'white') {
    const descendingNodeTrueAnomaly = Math.PI - orbit.argOfPeriapsis;
    if((wrapAngle(descendingNodeTrueAnomaly, nus[0] - 1e-3) < nus[nus.length-1]) && (orbit.inclination !== 0) && (orbit.inclination !== Math.PI)) {
        const pos = div3(add3(Kepler.positionAtTrueAnomaly(orbit, descendingNodeTrueAnomaly), centeredAt), plotSize);
        const position = new THREE.Vector3(-pos.x, pos.z, pos.y);
        return <sprite
            scale={[0.075,0.075,0.075]} 
            position={position}
            onClick={handleClick}
        >
            <spriteMaterial map={descendingNodeTexture} sizeAttenuation={false} color={color} depthTest={false} />
        </sprite>
    } else {
        return <></>
    }
}

function OrbitLine({orbit, date, plotSize, minDate = -Infinity, maxDate = Infinity, centeredAt = vec3(0,0,0), depth=0,  name = "Orbit", color = {r: 200, g: 200, b: 200}, setInfoItem, displayOptions}: OrbitLineProps) {
    const range = useRef(getTrueAnomalyRange(orbit, minDate, maxDate));
    const nus = useRef(linspace(range.current.min, range.current.max, 501));
    const gradientColors = useRef(getGradientColors(color));
    const colorString = useRef(new Color(color).toString());

    const handleClick = (e: ThreeEvent<MouseEvent>) => {
        if(visible) {
            e.stopPropagation();
            setInfoItem({...orbit.data, color, name});
        }
    }

    const points = getPoints(orbit, plotSize, nus.current, centeredAt);
    const colors = getColorsAtDate(date, orbit, gradientColors.current, nus.current, minDate, maxDate);
    const periapsisIcon = getPeriapsisIcon(orbit, plotSize, nus.current, centeredAt, handleClick, colorString.current);
    const apoapsisIcon = getApoapsisIcon(orbit, plotSize, nus.current, centeredAt, handleClick, colorString.current);
    const ascendingNodeIcon = getAscendingNodeIcon(orbit, plotSize, nus.current, centeredAt, handleClick, colorString.current);
    const descendingNodeIcon = getDescendingNodeIcon(orbit, plotSize, nus.current, centeredAt, handleClick, colorString.current);

    const [updateCounter, setUpdateCounter] = useState(0);

    useEffect(() => {
        const newRange = getTrueAnomalyRange(orbit, minDate, maxDate);
        range.current = newRange;
        const newNus = linspace(newRange.min, newRange.max, 501);
        nus.current = newNus;
        setUpdateCounter(updateCounter + 1)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orbit, minDate, maxDate, plotSize])
    useEffect(() => {
        colorString.current = new Color(color).toString();
        gradientColors.current = getGradientColors(color);
        setUpdateCounter(updateCounter + 1)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [color])

    const normalizedCenter = div3(centeredAt, plotSize);
    const orbitWorldCenter = new THREE.Vector3(-normalizedCenter.x, normalizedCenter.z, normalizedCenter.y);
    const [visible, setVisible] = useState(true);
    useFrame((state) => {
        setVisible(depth === 0 ? true : state.camera.position.distanceTo(orbitWorldCenter) < 10 * (orbit.attractorSoi || Infinity) / plotSize);
    })

    return (
        <>
            {displayOptions.orbits &&
                <Line 
                    points={points}
                    color='white'
                    vertexColors={colors}
                    lineWidth={2}
                    onClick={handleClick}
                    visible={visible}
                />
            }
            {(displayOptions.apses && visible) && [
                periapsisIcon,
                apoapsisIcon
            ]}
            {(displayOptions.nodes && visible) && [
                ascendingNodeIcon,
                descendingNodeIcon
            ]}
        </>
    );
}
  
  export default React.memo(OrbitLine);