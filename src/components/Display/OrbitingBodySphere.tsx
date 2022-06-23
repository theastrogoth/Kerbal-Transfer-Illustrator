import React, { useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitingBody } from '../../main/objects/body';
import { div3, hexFromColorString, TWO_PI, degToRad } from '../../main/libs/math';
import Kepler from '../../main/libs/kepler';
import OrbitLine from './OrbitLine';
import textures from '../../textureData';
import { useLoader } from '@react-three/fiber';

function OrbitingBodySphere({body, plotSize, date}: {body: OrbitingBody, plotSize: number, date: number}) {
    const [color, setColor] = useState(hexFromColorString(body.color.toString()));
    const [soiColor, setSoiColor] = useState(hexFromColorString(body.color.rescale(0.5).toString()));
    
    const [hasTexture, setHasTexture] = useState(textures.get(body.name) !== undefined);
    const [textureURL, setTextureURL] = useState(textures.get(body.name) || textures.get("blank") as string);
    const texture = useLoader(THREE.TextureLoader, textureURL);

    const pos = div3(Kepler.orbitToPositionAtDate(body.orbit, date), plotSize);
    const position = new THREE.Vector3(-pos.x, pos.z, pos.y);

    useEffect(() => {
        setColor(hexFromColorString(body.color.toString()));
        setSoiColor(hexFromColorString(body.color.rescale(0.5).toString()));
        const newTextureURL = textures.get(body.name);
        setHasTexture(newTextureURL !== undefined);
        setTextureURL(newTextureURL || textures.get("blank") as string);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [body])

    return (
        <>
            <mesh 
                position={position} 
                rotation={[0, degToRad(body.initialRotation) + TWO_PI * ((date % body.rotationPeriod) / body.rotationPeriod), 0]}
                onClick={(e) => {e.stopPropagation(); console.log(e)}}
            >
                <sphereGeometry args={[body.radius / plotSize, 32, 32]} />
                <meshLambertMaterial color={hasTexture ? 'white' : color} map={texture} />
            </mesh>
            <mesh position={position} onClick={(e) => {e.stopPropagation(); console.log(e)}}>
                <sphereGeometry args={[body.soi / plotSize, 32, 32]} />
                <meshBasicMaterial transparent={true} opacity={0.25} color={soiColor} />
            </mesh>
            <OrbitLine orbit={body.orbit} date={date} plotSize={plotSize} color={body.color} />
        </>
    )
  }
  
  export default OrbitingBodySphere