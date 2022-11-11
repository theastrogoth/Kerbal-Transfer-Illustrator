import React from 'react';
import * as THREE from "three";
import CelestialBody, { OrbitingBody } from '../../main/objects/body';
import SolarSystem from '../../main/objects/system';
import Kepler from '../../main/libs/kepler';
import { mult3, sub3, vec3, normalize3 } from '../../main/libs/math';
import BodySphere from './BodySphere';
import { PrimitiveAtom } from 'jotai';

// import { useShadowHelper } from '../../utils';


function getParentPositions(parentBodies: CelestialBody[], date: number) {
    const positions: Vector3[] = [];
    for(let i=0; i<parentBodies.length-1; i++) {
        positions.push(Kepler.orbitToPositionAtDate((parentBodies[i] as OrbitingBody).orbit, date))
    }
    return positions;
}

function getRelativePositions(bodyPosition: Vector3, parentPositions: Vector3[]) {
    const relativePositions = [mult3(bodyPosition, -1)];
    for(let i=0; i<parentPositions.length; i++) {
        relativePositions.push(sub3(relativePositions[i], parentPositions[i]))
    }
    return relativePositions;
}

function ParentBodies({centralBody, system, date, plotSize, infoItemAtom}: {centralBody: CelestialBody, system: SolarSystem, date: number, plotSize: number, infoItemAtom: PrimitiveAtom<InfoItem>}) {
    const parentIdxs = system.sequenceToSun(centralBody.id).slice(1);
    const parentBodies = parentIdxs.map(idx => system.bodyFromId(idx));
    const bodyPosition = centralBody.hasOwnProperty("orbit") ? Kepler.orbitToPositionAtDate((centralBody as OrbitingBody).orbit, date) : vec3(0,0,0);
    const parentPositions = getParentPositions(parentBodies, date);
    const relativePositions = getRelativePositions(bodyPosition, parentPositions);
    const sunPosition = normalize3(relativePositions[relativePositions.length-1]);
    const lightDistance = (parentBodies.length >= 2 ? (centralBody as OrbitingBody).orbit.semiMajorAxis as number : centralBody.furtherstOrbiterDistance || plotSize) * 2 / plotSize;
    const lightPosition = mult3(sunPosition, lightDistance);
    const shadowCamWidth = centralBody.radius * 1.5 / plotSize;

    // const lightRef = useRef()
    // useShadowHelper(lightRef)

    // useEffect(() => {
    //     const newParentIdxs = system.sequenceToSun(centralBody.id).slice(1);
    //     setParentIdxs(newParentIdxs);
    //     setParentBodies(newParentIdxs.map(idx => system.bodyFromId(idx)));
    //     // console.log(centralBody.name)
    // }, [centralBody, system])

    return ( 
    <>
        { parentBodies.map((bd, i) =>
            <BodySphere 
                body={bd} 
                system={system} 
                date={date} 
                plotSize={plotSize}
                depth={-1}
                isSun={i === parentBodies.length-1}
                centeredAt={relativePositions[i]}
                infoItemAtom={infoItemAtom}
                setTarget={(() => {})}
            />
        )}
        { parentBodies.length > 0 ? 
            <directionalLight 
                castShadow={true} 
                position={new THREE.Vector3(- lightPosition.x, lightPosition.z, lightPosition.y)} 
                intensity={1.5} 
                shadow-camera-near={0.1}
                shadow-camera-far={2.1 * lightDistance}
                shadow-camera-right={shadowCamWidth}
                shadow-camera-left={-shadowCamWidth}
                shadow-camera-top={shadowCamWidth}
                shadow-camera-bottom={-shadowCamWidth}
            /> :
            <pointLight 
                position={[0, 0, 0] } 
                intensity={1.5} 
                // castShadow={true}
                // shadow-camera-near={0.01} 
                // shadow-camera-far={2.1} 
            />
        }
    </>
    )
}

export default React.memo(ParentBodies);