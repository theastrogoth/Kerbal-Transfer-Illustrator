import React, { useRef } from 'react';
import * as THREE from 'three';
import CelestialBody, { OrbitingBody } from '../../main/objects/body';
import { hexFromColorString } from '../../main/libs/math';
import { useLoader } from '@react-three/fiber';
import textures from '../../textureData';

function getCentralBodyOrbit(body: OrbitingBody, date: number) {
    
}

function CentralBodySphere({body, date, plotSize}: {body: CelestialBody, date: number, plotSize: number}) {
    const position = useRef(new THREE.Vector3(0,0,0));
    const hasOrbit = useRef(body.hasOwnProperty('orbit'));
    let textureURL = textures.get(body.name);
    const hasTexture = textureURL !== undefined;
    textureURL = textureURL || textures.get("blank") as string;
    const texture = useLoader(THREE.TextureLoader, textureURL);
    return (
        <>
        <mesh position={position.current}>
            <sphereGeometry args={[body.radius / plotSize, 32, 32]} />
            <meshLambertMaterial color={hasTexture ? 'white' : hexFromColorString(body.color.toString())} map={texture} />
        </mesh>
        {body.atmosphereHeight > 0 ?
            <mesh >
                <sphereGeometry args={[(body.radius + body.atmosphereHeight) / plotSize, 32, 32]} />
                <meshStandardMaterial color={hexFromColorString(body.color.toString())} transparent={true} opacity={0.05} roughness={1} />
            </mesh>
            : <></>    
        }
        </>
    )
  }
  
  export default CentralBodySphere