import React, { useState, useEffect } from 'react';
import { Suspense } from 'react';
import * as THREE from 'three';
import CentralBodySphere from './CentralBodySphere';
import OrbitingBodySphere from './OrbitingBodySphere';

import SolarSystem from '../../main/objects/system';
import CelestialBody, { OrbitingBody } from '../../main/objects/body';

import Kepler from '../../main/libs/kepler';
import { sub3, normalize3, vec3 } from '../../main/libs/math';

function getSunLight(centralBody: CelestialBody, system: SolarSystem, date: number) {
    if(centralBody.name === system.sun.name) {
        return <pointLight position={[0, 0, 0] } intensity={1.5} />
    } else {
        const pathToSun = system.sequenceToSun(centralBody.id);
        let sunDirection = vec3(0,0,0);
        for(let i=0; i<pathToSun.length-1; i++) {
            const body = system.bodyFromId(pathToSun[i]) as OrbitingBody;
            sunDirection = sub3(sunDirection, Kepler.orbitToPositionAtDate(body.orbit, date));
        }
        sunDirection = normalize3(sunDirection);
        return <directionalLight position={new THREE.Vector3(-sunDirection.x, sunDirection.z, sunDirection.y)} intensity={1.5} />
    }
}

function SystemDisplay({centralBody, system, plotSize, date, isSun = true, setInfoItem}: {centralBody: CelestialBody, system: SolarSystem, plotSize: number, date: number, isSun?: boolean, setInfoItem: React.Dispatch<React.SetStateAction<InfoItem>>}) {
    const [sunLight, setSunLight] = useState(getSunLight(centralBody, system, date));
    useEffect(() => {
        setSunLight(getSunLight(centralBody, system, date));
    }, [centralBody, system, date])
    return (
        <Suspense fallback={null}>
            <mesh>
                <ambientLight intensity={0.1} />
                {sunLight}
            </mesh>
            <CentralBodySphere body={centralBody} date={date} plotSize={plotSize} isSun={isSun} setInfoItem={setInfoItem} />
            {centralBody.orbiters.map((orbiter, index) => 
                <OrbitingBodySphere key={index} body={orbiter} plotSize={plotSize} date={date} setInfoItem={setInfoItem} />    
            )}
        </Suspense>
    )
  }
  
  export default SystemDisplay