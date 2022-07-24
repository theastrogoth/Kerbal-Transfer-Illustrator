import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ThreeEvent, useFrame } from '@react-three/fiber';
import Orbit from '../../main/objects/orbit';
import OrbitLine from './OrbitLine';

import SolarSystem from '../../main/objects/system';
import Kepler from '../../main/libs/kepler';
import Trajectories from '../../main/libs/trajectories';
import { div3, hexFromColorString, vec3, add3 } from '../../main/libs/math';

import Color from '../../main/objects/color';
import { Html } from '@react-three/drei';
import { PrimitiveAtom, useAtom } from 'jotai';

const textureLoader = new THREE.TextureLoader();
const maneuverTexture = textureLoader.load("https://raw.githubusercontent.com/theastrogoth/Kerbal-Transfer-Illustrator/assets/icons/maneuver.png");
const escapeTexture = textureLoader.load("https://raw.githubusercontent.com/theastrogoth/Kerbal-Transfer-Illustrator/assets/icons/escape.png");
const encounterTexture = textureLoader.load("https://raw.githubusercontent.com/theastrogoth/Kerbal-Transfer-Illustrator/assets/icons/encounter.png");
const podTexture = textureLoader.load("https://raw.githubusercontent.com/theastrogoth/Kerbal-Transfer-Illustrator/assets/icons/pod.png");
const probeTexture = textureLoader.load("https://raw.githubusercontent.com/theastrogoth/Kerbal-Transfer-Illustrator/assets/icons/probe.png");
const relayTexture = textureLoader.load("https://raw.githubusercontent.com/theastrogoth/Kerbal-Transfer-Illustrator/assets/icons/relay.png");
const planeTexture = textureLoader.load("https://raw.githubusercontent.com/theastrogoth/Kerbal-Transfer-Illustrator/assets/icons/plane.png");
const evaTexture = textureLoader.load("https://raw.githubusercontent.com/theastrogoth/Kerbal-Transfer-Illustrator/assets/icons/eva.png");
const stationTexture = textureLoader.load("https://raw.githubusercontent.com/theastrogoth/Kerbal-Transfer-Illustrator/assets/icons/station.png");
const landerTexture = textureLoader.load("https://raw.githubusercontent.com/theastrogoth/Kerbal-Transfer-Illustrator/assets/icons/lander.png");
const asteroidTexture = textureLoader.load("https://raw.githubusercontent.com/theastrogoth/Kerbal-Transfer-Illustrator/assets/icons/asteroid.png");
const debrisTexture = textureLoader.load("https://raw.githubusercontent.com/theastrogoth/Kerbal-Transfer-Illustrator/assets/icons/debris.png");
const roverTexture = textureLoader.load("https://raw.githubusercontent.com/theastrogoth/Kerbal-Transfer-Illustrator/assets/icons/rover.png");
const baseTexture = textureLoader.load("https://raw.githubusercontent.com/theastrogoth/Kerbal-Transfer-Illustrator/assets/icons/base.png");
// const flagTexture = textureLoader.load("https://raw.githubusercontent.com/theastrogoth/Kerbal-Transfer-Illustrator/assets/icons/flag.png");

const defaultColor: IColor = {r:255, g:255, b:255};

type TrajectoryDisplayProps = {
    index:              number,
    tabValue:           number,
    trajectory:         Trajectory,
    system:             SolarSystem,
    date:               number,
    plotSize:           number,
    flightPlan:         FlightPlan,
    centeredAt?:        Vector3,
    depth?:             number,
    icons?:             TrajectoryIconInfo,
    infoItemAtom:       PrimitiveAtom<InfoItem>,
    setTarget:          React.Dispatch<React.SetStateAction<TargetObject>>,
    displayOptions:     DisplayOptions,
}

function getOrbits(trajectory: Trajectory, flightPlan: FlightPlan, system: SolarSystem, date: number, plotSize: number, centeredAt: Vector3, depth: number, infoItemAtom: PrimitiveAtom<InfoItem>, displayOptions: DisplayOptions) {
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
            infoItemAtom={infoItemAtom}
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

function getCraftSprite(trajectory: Trajectory, flightPlan: FlightPlan, date: number, plotSize: number, centeredAt: Vector3, handleClick: (fpi: FlightPlanInfo) => (e: ThreeEvent<MouseEvent>) => void, handleDoubleClick: (e: ThreeEvent<MouseEvent>) => void, visible: boolean, spriteMap: THREE.Texture, infoItem: InfoItem, setInfoItem: React.Dispatch<React.SetStateAction<InfoItem>>, index: number, tabValue: number) {
    const orbit = Trajectories.currentOrbitForTrajectory(trajectory, date);
    let craftSprite = <></>;
    let nameLabel = <></>;
    const fpi = {...flightPlan, date};
    if(orbit !== null) {
        const pos = div3(add3(Kepler.orbitToPositionAtDate(orbit, date), centeredAt), plotSize);
        const position = new THREE.Vector3(-pos.x, pos.z, pos.y);
        const colorstring = hexFromColorString(new Color(flightPlan.color || defaultColor).toString());
        craftSprite = 
            <sprite 
                scale={[0.05,0.05,0.05]} 
                position={position}
                onClick={visible ? handleClick(fpi) : (() => {})}
                onDoubleClick={visible ? handleDoubleClick : (() => {})}
                visible={visible}
            >
                <spriteMaterial map={spriteMap} sizeAttenuation={false} color={colorstring} depthTest={false} visible={visible}/>
            </sprite>
        nameLabel = 
            <Html 
                position={position} 
                visible={visible}
                style={{fontSize: '1rem', transform: 'translate3d(-50%, -150%, 0)', color: colorstring}}
            >
                <div>{flightPlan.name}</div> 
            </Html>
    }
    if(index === tabValue) {
        if(infoItem !== null) {
            if(infoItem.hasOwnProperty('trajectories') && infoItem.name === flightPlan.name) {
                if((infoItem as FlightPlanInfo).date !== date) {
                        setInfoItem(fpi);
                }
            }
        }
    }
    return {craftSprite, nameLabel};
}

function TrajectoryDisplay({trajectory, flightPlan, system, date, plotSize, centeredAt=vec3(0,0,0), depth=0, icons = {maneuver: [], soi: []}, infoItemAtom, setTarget, displayOptions, index, tabValue}: TrajectoryDisplayProps) {
    const [infoItem, setInfoItem] = useAtom(infoItemAtom);
    const normalizedCenter = div3(centeredAt, plotSize);
    const trajectoryWorldCenter = new THREE.Vector3(-normalizedCenter.x, normalizedCenter.z, normalizedCenter.y);
    const [visible, setVisible] = useState(true);
    const [spriteMap, setSpriteMap] = useState(probeTexture);

    useFrame((state) => {
        setVisible(depth === 0 ? true : state.camera.position.distanceTo(trajectoryWorldCenter) < 10 * (system.bodyFromId(trajectory.orbits[0].orbiting).soi || Infinity) / plotSize);
    })

    const timer = useRef<NodeJS.Timeout | null>(null);
    const handleClick = (fpi: FlightPlanInfo) => (e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        if(timer.current === null) {
            timer.current = setTimeout(() => {
                setInfoItem(fpi);
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
    
    const trajectoryOrbits = getOrbits(trajectory, flightPlan, system, date, plotSize, centeredAt, depth, infoItemAtom, displayOptions);
    const {craftSprite, nameLabel} = getCraftSprite(trajectory, flightPlan, date, plotSize, centeredAt, handleClick, handleDoubleClick, visible, spriteMap, infoItem, setInfoItem, index, tabValue);

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

    useEffect(() => {
        const type = flightPlan.type
        if(type !== undefined) {
            if(type === "Ship") {
                setSpriteMap(podTexture);
            } else if(type === "Probe") {
                setSpriteMap(probeTexture);
            } else if(type === "Relay") {
                setSpriteMap(relayTexture);
            } else if(type === "Station") {
                setSpriteMap(stationTexture);
            } else if(type === "Base") {
                setSpriteMap(baseTexture);
            } else if(type === "Lander") {
                setSpriteMap(landerTexture);
            } else if(type === "Rover") {
                setSpriteMap(roverTexture);
            } else if(type === "Plane") {
                setSpriteMap(planeTexture);
            } else if(type === "Eva") {
                setSpriteMap(evaTexture);
            } else if(type === "Debris") {
                setSpriteMap(debrisTexture);
            } else if(type === "SpaceObject") {
                setSpriteMap(asteroidTexture);
            } else{
                setSpriteMap(podTexture);
            }
        } else {
            setSpriteMap(podTexture);
        }
    }, [flightPlan.type])

    return (
        <>
            {trajectoryOrbits}
            {displayOptions.maneuvers && maneuverSprites}
            {displayOptions.soiChanges && soiSprites}
            {displayOptions.crafts && craftSprite}
            {displayOptions.craftNames && nameLabel}
        </>
    );
}
  
  export default React.memo(TrajectoryDisplay);