import React from 'react';
import * as THREE from 'three';
import Orbit from '../../main/objects/orbit';
import OrbitLine from './OrbitLine';

import SolarSystem from '../../main/objects/system';
import Kepler from '../../main/libs/kepler';
import { div3 } from '../../main/libs/math';

import maneuverIcon from '../../assets/icons/maneuver.png'; 
import soiIcon from '../../assets/icons/soi.png'; 



const maneuverTexture = new THREE.TextureLoader().load(maneuverIcon);
const soiTexture = new THREE.TextureLoader().load(soiIcon);

function TrajectoryDisplay({trajectory, system, date, plotSize, color = {r: 255, g: 255, b: 255}, icons = {maneuver: [], soi: []}}: {trajectory: Trajectory, system: SolarSystem, date: number, plotSize: number, color?: IColor, icons?: {maneuver: number[], soi: number[]}}) {
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
    const maneuverSprites = icons.maneuver.map(intersectIdx => { 
        const orbitIdx = Math.min(trajectory.orbits.length-1, intersectIdx) 
        const orbit = trajectory.orbits[orbitIdx];
        const date = trajectory.intersectTimes[intersectIdx];
        const pos = div3(Kepler.orbitToPositionAtDate(orbit, date), plotSize);
        return <sprite key={intersectIdx} scale={[0.05,0.05,0.05]} position={new THREE.Vector3(-pos.x, pos.z, pos.y)}>
            <spriteMaterial map={maneuverTexture} sizeAttenuation={false}/>
        </sprite>
    });
    const soiSprites = icons.soi.map(intersectIdx => {  
        const orbitIdx = Math.min(trajectory.orbits.length-1, intersectIdx) 
        const orbit = trajectory.orbits[orbitIdx];
        const date = trajectory.intersectTimes[intersectIdx];
        const pos = div3(Kepler.orbitToPositionAtDate(orbit, date), plotSize);
        return <sprite key={intersectIdx} scale={[0.05,0.05,0.05]} position={new THREE.Vector3(-pos.x, pos.z, pos.y)}>
            <spriteMaterial map={soiTexture} sizeAttenuation={false}/>
        </sprite>
    });
    // const activeOrbitIndex = trajectory.intersectTimes.slice(0,-1).findIndex((time, index) => date > time && date < trajectory.intersectTimes[index+1])
    return (
        <>
            {trajectoryOrbits}
            {maneuverSprites}
            {soiSprites}
        </>
    );
}
  
  export default TrajectoryDisplay;