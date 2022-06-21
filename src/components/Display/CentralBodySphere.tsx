import React, { useRef } from 'react';
import * as THREE from 'three';
import CelestialBody from '../../main/objects/body';
import { hexFromColorString } from '../../main/libs/math';

function CentralBodySphere({body, plotSize}: {body: CelestialBody, plotSize: number}) {
    const position = useRef(new THREE.Vector3(0,0,0));
    return (
        <mesh position={position.current}>
            <sphereGeometry args={[body.radius / plotSize, 32, 32]} />
            <meshLambertMaterial color={hexFromColorString(body.color.toString())} />
        </mesh>
    )
  }
  
  export default CentralBodySphere