import React, { useRef } from 'react';
import * as THREE from 'three';
import { OrbitingBody } from '../../main/objects/body';
import { div3, hexFromColorString, TWO_PI, degToRad } from '../../main/libs/math';
import Kepler from '../../main/libs/kepler';
import OrbitLine from './OrbitLine';
import textures from '../../textureData';
import { useLoader } from '@react-three/fiber';

function OrbitingBodySphere({body, plotSize, date}: {body: OrbitingBody, plotSize: number, date: number}) {
    const pos = div3(Kepler.orbitToPositionAtDate(body.orbit, date), plotSize);
    const position = new THREE.Vector3(-pos.x, pos.z, pos.y);
    const color = hexFromColorString(body.color.toString());
    const soiColor = hexFromColorString(body.color.rescale(0.5).toString());
    let textureURL = textures.get(body.name);
    const hasTexture = textureURL !== undefined;
    textureURL = textureURL || textures.get("blank") as string;
    const texture = useLoader(THREE.TextureLoader, textureURL);
    return (
        <>
        <mesh position={position} rotation={[0, 0, degToRad(body.initialRotation) + TWO_PI * ((date % body.rotationPeriod) / body.rotationPeriod)]}>
            <sphereGeometry args={[body.radius / plotSize, 32, 32]} />
            <meshLambertMaterial color={hasTexture ? 'white' : color} map={texture} />
        </mesh>
        <mesh position={position}>
            <sphereGeometry args={[body.soi / plotSize, 32, 32]} />
            <meshBasicMaterial transparent={true} opacity={0.25} color={soiColor} />
        </mesh>
        <OrbitLine orbit={body.orbit} date={date} plotSize={plotSize} color={body.color} />
        </>
    )
  }
  
  export default OrbitingBodySphere