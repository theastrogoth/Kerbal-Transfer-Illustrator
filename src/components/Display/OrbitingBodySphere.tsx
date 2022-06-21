import React from 'react';
import * as THREE from 'three';
import { OrbitingBody } from '../../main/objects/body';
import { div3, hexFromColorString } from '../../main/libs/math';
import Kepler from '../../main/libs/kepler';
import OrbitLine from './OrbitLine';

function OrbitingBodySphere({body, plotSize, date}: {body: OrbitingBody, plotSize: number, date: number}) {
    const pos = div3(Kepler.orbitToPositionAtDate(body.orbit, date), plotSize);
    const position = new THREE.Vector3(pos.x, pos.z, pos.y);
    const color = hexFromColorString(body.color.toString());
    return (
        <>
        <mesh position={position}>
            <sphereGeometry args={[body.radius / plotSize, 32, 32]} />
            <meshStandardMaterial color={color} />
        </mesh>
        <OrbitLine orbit={body.orbit} plotSize={plotSize} color={color} />
        </>
    )
  }
  
  export default OrbitingBodySphere