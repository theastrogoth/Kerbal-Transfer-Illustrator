import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ThreeEvent, useFrame } from '@react-three/fiber';
import Orbit from '../../main/objects/orbit';
import OrbitLine from './OrbitLine';

import SolarSystem from '../../main/objects/system';
import Kepler from '../../main/libs/kepler';
import { div3, hexFromColorString, vec3, add3 } from '../../main/libs/math';

import maneuverIcon from '../../assets/icons/maneuver.png'; 
import escapeIcon from '../../assets/icons/escape.png'; 
import encounterIcon from '../../assets/icons/encounter.png'; 
import podIcon from '../../assets/icons/pod.png';
import Color from '../../main/objects/color';

const textureLoader = new THREE.TextureLoader();
const maneuverTexture = textureLoader.load(maneuverIcon);
const escapeTexture = textureLoader.load(escapeIcon);
const encounterTexture = textureLoader.load(encounterIcon);
const podTexture = textureLoader.load(podIcon);

const defaultColor: IColor = {r:255, g:255, b:255};

type TrajectoryDisplayProps = {
    trajectory:     Trajectory,
    system:         SolarSystem,
    date:           number,
    plotSize:       number,
    flightPlan:     FlightPlan,
    centeredAt?:    Vector3,
    depth?:         number,
    icons?:         TrajectoryIconInfo,
    setInfoItem:    React.Dispatch<React.SetStateAction<InfoItem>>,
    setTarget:      React.Dispatch<React.SetStateAction<TargetObject>>,
    displayOptions: DisplayOptions,
}

function getOrbits(trajectory: Trajectory, system: SolarSystem, date: number, plotSize: number, centeredAt: Vector3, depth: number, flightPlan: FlightPlan, setInfoItem: React.Dispatch<React.SetStateAction<InfoItem>>, displayOptions: DisplayOptions) {
    const trajectoryOrbits = trajectory.orbits.map((orbit, index) =>
        <OrbitLine 
            key={'orbit'+ String(index)}
            orbit={new Orbit(orbit, system.bodyFromId(orbit.orbiting))} 
            date={date} 
            plotSize={plotSize} 
            centeredAt={centeredAt}
            depth={depth}
            color={flightPlan.color || defaultColor}
            minDate={trajectory.intersectTimes[index]}
            maxDate={trajectory.intersectTimes[index+1]}
            name={flightPlan.name}
            setInfoItem={setInfoItem}
            displayOptions={{
                orbits: displayOptions.craftOrbits,
                apses:  displayOptions.craftApses,
                nodes:  displayOptions.craftNodes,
            }}
        />
    );
    return trajectoryOrbits;
}

function getManeuverSprites(trajectory: Trajectory, icons: TrajectoryIconInfo, plotSize: number, centeredAt: Vector3, color: IColor, setInfoItem: React.Dispatch<React.SetStateAction<InfoItem>>, visible: boolean) {
    const maneuverSprites = icons.maneuver.map(maneuverIconInfo => { 
        const maneuverIdx = maneuverIconInfo[0];
        const name = maneuverIconInfo[1];
        const maneuver = trajectory.maneuvers[maneuverIdx];
        const pos = div3(add3(maneuver.postState.pos, centeredAt), plotSize);
        const position = new THREE.Vector3(-pos.x, pos.z, pos.y);
        const maneuverInfo: ManeuverInfo = {
            preState:   maneuver.preState,
            postState:  maneuver.postState,
            deltaV:     maneuver.deltaV,
            deltaVMag:  maneuver.deltaVMag,
            color,
            name,
        }
        return <sprite
            key={'maneuver'+String(maneuverIdx)} 
            scale={[0.05,0.05,0.05]} 
            position={position}
            onClick={(e) => {if(visible) {e.stopPropagation(); setInfoItem(maneuverInfo)}}}
        >
            <spriteMaterial map={maneuverTexture} sizeAttenuation={false} color={hexFromColorString(new Color(color).toString())} depthTest={false} visible={visible} />
        </sprite>
    });
    return maneuverSprites;
}

function getSoiSprites(trajectory: Trajectory, icons: TrajectoryIconInfo, plotSize: number, centeredAt: Vector3, color: IColor, setInfoItem: React.Dispatch<React.SetStateAction<InfoItem>>, visible: boolean) {
    const soiSprites = icons.soi.map(soiInfo => {  
        const intersectIdx = soiInfo[0];
        const name = soiInfo[1];
        const orbitIdx = Math.min(trajectory.orbits.length-1, intersectIdx) 
        const orbit = trajectory.orbits[orbitIdx];
        const date = trajectory.intersectTimes[intersectIdx];
        const pos = div3(add3(Kepler.orbitToPositionAtDate(orbit, date), centeredAt), plotSize);
        const position = new THREE.Vector3(-pos.x, pos.z, pos.y);
        const soiChangeInfo: SoiChangeInfo = {
            name,
            pos,
            date,
            color,
        };
        return <sprite 
            key={'soi'+String(intersectIdx)} 
            scale={[0.06,0.06,0.06]} 
            position={position}
            onClick={(e) => {if(visible) {e.stopPropagation(); setInfoItem(soiChangeInfo)}}}
        >
            <spriteMaterial map={name.includes("Encounter") ? encounterTexture : escapeTexture} sizeAttenuation={false} color={hexFromColorString(new Color(color).toString())} depthTest={false} visible={visible} />
        </sprite>
    });
    return soiSprites;
}

function getCraftSprite(trajectory: Trajectory, date: number, plotSize: number, centeredAt: Vector3, flightPlan: FlightPlan, handleClick: (v: IVessel) => (e: ThreeEvent<MouseEvent>) => void, handleDoubleClick: (e: ThreeEvent<MouseEvent>) => void, visible: boolean) {
    const activeOrbitIndex = trajectory.intersectTimes.slice(0,-1).findIndex((time, index) => date >= time && date < trajectory.intersectTimes[index+1])
    if(activeOrbitIndex === -1) {
        return <></>
    }
    const vessel: IVessel = {name: flightPlan.name, color: flightPlan.color, orbit: trajectory.orbits[activeOrbitIndex], maneuvers: []};
    const pos = activeOrbitIndex === -1 ? vec3(0,0,0) : div3(add3(Kepler.orbitToPositionAtDate(trajectory.orbits[activeOrbitIndex], date), centeredAt), plotSize);
    const position = new THREE.Vector3(-pos.x, pos.z, pos.y);
    const craftSprite = 
        <sprite 
            scale={[0.05,0.05,0.05]} 
            position={position}
            onClick={visible ? handleClick(vessel) : ((e) => {})}
            onDoubleClick={visible ? handleDoubleClick : ((e) => {})}
        >
            <spriteMaterial map={podTexture} sizeAttenuation={false} color={hexFromColorString(new Color(flightPlan.color || defaultColor).toString())} depthTest={false} visible={visible}/>
        </sprite>
    // if(infoItemRef.current !== null) {
    //     if(infoItemRef.current.hasOwnProperty('maneuvers') && infoItemRef.current.name === name) {
    //         if(!Kepler.orbitsAreEqual((infoItemRef.current as IVessel).orbit, vessel.orbit)) {
    //             setInfoItem(vessel);
    //         }
    //     }
    // }
    return craftSprite;
}

function TrajectoryDisplay({trajectory, system, date, plotSize, centeredAt=vec3(0,0,0), depth=0, flightPlan, icons = {maneuver: [], soi: []}, setInfoItem, setTarget, displayOptions}: TrajectoryDisplayProps) {
    const normalizedCenter = div3(centeredAt, plotSize);
    const trajectoryWorldCenter = new THREE.Vector3(-normalizedCenter.x, normalizedCenter.z, normalizedCenter.y);
    const [visible, setVisible] = useState(true);
    useFrame((state) => {
        setVisible(depth === 0 ? true : state.camera.position.distanceTo(trajectoryWorldCenter) < 10 * (system.bodyFromId(trajectory.orbits[0].orbiting).soi || Infinity) / plotSize);
    })

    const timer = useRef<NodeJS.Timeout | null>(null);
    const handleClick = (vessel: IVessel) => (e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        if(timer.current === null) {
            timer.current = setTimeout(() => {
                setInfoItem(vessel);
                timer.current = null;
            }, 300)
        }
    }
    const handleDoubleClick = (e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation(); 
        setTarget(flightPlan);
        clearTimeout(timer.current as NodeJS.Timeout);
        timer.current = null;
    }
    
    const trajectoryOrbits = getOrbits(trajectory, system, date, plotSize, centeredAt, depth, flightPlan, setInfoItem, displayOptions);
    const craftSprite = getCraftSprite(trajectory, date, plotSize, centeredAt, flightPlan, handleClick, handleDoubleClick, visible);

    const maneuverSprites = getManeuverSprites(trajectory, icons, plotSize, centeredAt, flightPlan.color || defaultColor, setInfoItem, visible);
    const soiSprites = getSoiSprites(trajectory, icons, plotSize, centeredAt, flightPlan.color || defaultColor, setInfoItem, visible);

    const trajectoryRef = useRef(trajectory);
    const systemRef = useRef(system);
    const plotSizeRef = useRef(plotSize);

    useEffect(() => {
        if(trajectoryRef.current !== trajectory || systemRef.current !== system || plotSizeRef.current !== plotSize) {
            trajectoryRef.current = trajectory;
            systemRef.current = system;
            plotSizeRef.current = plotSize;
        } 
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [trajectory, system, plotSize])

    return (
        <>
            {trajectoryOrbits}
            {displayOptions.maneuvers && maneuverSprites}
            {displayOptions.soiChanges && soiSprites}
            {displayOptions.crafts && craftSprite}
        </>
    );
}
  
  export default React.memo(TrajectoryDisplay, (p,c) => (p.trajectory === c.trajectory && p.system === c.system && p.date === c.date && p.plotSize === c.plotSize && c.flightPlan === p.flightPlan && p.icons === c.icons && p.displayOptions === c.displayOptions));