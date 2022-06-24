import React, { useEffect, useState, useRef } from 'react';
import * as THREE from 'three';
import Orbit from '../../main/objects/orbit';
import OrbitLine from './OrbitLine';

import SolarSystem from '../../main/objects/system';
import Kepler from '../../main/libs/kepler';
import { div3, hexFromColorString, vec3 } from '../../main/libs/math';

import maneuverIcon from '../../assets/icons/maneuver.png'; 
import soiIcon from '../../assets/icons/soi.png'; 
import rocketIcon from '../../assets/icons/rocket.png';
import Color from '../../main/objects/color';

const textureLoader = new THREE.TextureLoader();
const maneuverTexture = textureLoader.load(maneuverIcon);
const soiTexture = textureLoader.load(soiIcon);
const rocketTexture = textureLoader.load(rocketIcon);

function getOrbits(trajectory: Trajectory, system: SolarSystem, date: number, plotSize: number, color: IColor) {
    const trajectoryOrbits = trajectory.orbits.map((orbit, index) =>
        <OrbitLine 
            key={index}
            orbit={new Orbit(orbit, system.bodyFromId(orbit.orbiting))} 
            date={date} 
            plotSize={plotSize} 
            color={color}
            minDate={trajectory.intersectTimes[index]}
            maxDate={trajectory.intersectTimes[index+1]}
        />
    );
    return trajectoryOrbits;
}

function getManeuverSprites(trajectory: Trajectory, icons: TrajectoryIconInfo, plotSize: number, color: IColor, setInfoItem: React.Dispatch<React.SetStateAction<InfoItem>>) {
    const maneuverSprites = icons.maneuver.map(maneuverIconInfo => { 
        const maneuverIdx = maneuverIconInfo[0];
        const name = maneuverIconInfo[1];
        const maneuver = trajectory.maneuvers[maneuverIdx];
        const pos = div3(maneuver.postState.pos, plotSize);
        const maneuverInfo: ManeuverInfo = {
            preState:   maneuver.preState,
            postState:  maneuver.postState,
            deltaV:     maneuver.deltaV,
            deltaVMag:  maneuver.deltaVMag,
            color,
            name,
        }
        return <sprite
            key={maneuverIdx} 
            scale={[0.05,0.05,0.05]} 
            position={new THREE.Vector3(-pos.x, pos.z, pos.y)}
            onClick={(e) => {e.stopPropagation(); setInfoItem(maneuverInfo)}}
        >
            <spriteMaterial map={maneuverTexture} sizeAttenuation={false} color={hexFromColorString(new Color(color).toString())} depthTest={false} />
        </sprite>
    });
    return maneuverSprites;
}

function getSoiSprites(trajectory: Trajectory, icons: TrajectoryIconInfo, plotSize: number, color: IColor, setInfoItem: React.Dispatch<React.SetStateAction<InfoItem>>) {
    const soiSprites = icons.soi.map(soiInfo => {  
        const intersectIdx = soiInfo[0];
        const name = soiInfo[1];
        const orbitIdx = Math.min(trajectory.orbits.length-1, intersectIdx) 
        const orbit = trajectory.orbits[orbitIdx];
        const date = trajectory.intersectTimes[intersectIdx];
        const pos = div3(Kepler.orbitToPositionAtDate(orbit, date), plotSize);
        const soiChangeInfo: SoiChangeInfo = {
            name,
            pos,
            date,
            color,
        };
        return <sprite 
            key={intersectIdx} 
            scale={[0.05,0.05,0.05]} 
            position={new THREE.Vector3(-pos.x, pos.z, pos.y)}
            onClick={(e) => {e.stopPropagation(); setInfoItem(soiChangeInfo)}}
        >
            <spriteMaterial map={soiTexture} sizeAttenuation={false} color={hexFromColorString(new Color(color).toString())} depthTest={false} />
        </sprite>
    });
    return soiSprites;
}

function getVesselSprite(trajectory: Trajectory, date: number, plotSize: number, name: string, color: IColor, setInfoItem: React.Dispatch<React.SetStateAction<InfoItem>>) {
    const activeOrbitIndex = trajectory.intersectTimes.slice(0,-1).findIndex((time, index) => date > time && date < trajectory.intersectTimes[index+1])
    if(activeOrbitIndex === -1) {
        return <></>
    }
    const activePosition = activeOrbitIndex === -1 ? vec3(0,0,0) : div3(Kepler.orbitToPositionAtDate(trajectory.orbits[activeOrbitIndex], date), plotSize);
    const vesselSprite = 
        <sprite 
            scale={[0.05,0.05,0.05]} 
            position={new THREE.Vector3(-activePosition.x, activePosition.z, activePosition.y)}
            onClick={(e) => {e.stopPropagation(); setInfoItem({name, color, orbit: trajectory.orbits[activeOrbitIndex], maneuvers: []})}}
        >
            <spriteMaterial map={rocketTexture} sizeAttenuation={false} color={hexFromColorString(new Color(color).toString())} depthTest={false} />
        </sprite>
    return vesselSprite;
}

function TrajectoryDisplay({trajectory, system, date, plotSize, name = "Vessel", color = {r: 255, g: 255, b: 255}, icons = {maneuver: [], soi: []}, setInfoItem}: {trajectory: Trajectory, system: SolarSystem, date: number, plotSize: number, name?: string, color?: IColor, icons?: TrajectoryIconInfo, setInfoItem: React.Dispatch<React.SetStateAction<InfoItem>> }) {
    const [trajectoryOrbits, setTrajectoryOrbits] = useState(getOrbits(trajectory, system, date, plotSize, color));
    const [maneuverSprites, setManeuverSprites] = useState(getManeuverSprites(trajectory, icons, plotSize, color, setInfoItem));
    const [soiSprites, setSoiSprites] = useState(getSoiSprites(trajectory, icons, plotSize, color, setInfoItem));
    const [vesselSprite, setVesselSprite] = useState(getVesselSprite(trajectory, date, plotSize, name, color, setInfoItem));

    const dateRef = useRef(date);

    useEffect(() => {
        setTrajectoryOrbits(getOrbits(trajectory, system, date, plotSize, color));
        setManeuverSprites(getManeuverSprites(trajectory, icons, plotSize, color, setInfoItem));
        setSoiSprites(getSoiSprites(trajectory, icons, plotSize, color, setInfoItem));
        setVesselSprite(getVesselSprite(trajectory, date, plotSize, name, color, setInfoItem));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [trajectory, system, plotSize])

    useEffect(() => {
        if(dateRef.current !== date){
            dateRef.current = date;
            setTrajectoryOrbits(getOrbits(trajectory, system, date, plotSize, color));
            setVesselSprite(getVesselSprite(trajectory, date, plotSize, name, color, setInfoItem));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [date])

    return (
        <>
            {trajectoryOrbits}
            {maneuverSprites}
            {soiSprites}
            {vesselSprite}
        </>
    );
}
  
  export default TrajectoryDisplay;