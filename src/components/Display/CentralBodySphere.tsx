import React, { useRef } from 'react';
import * as THREE from 'three';
import CelestialBody, { OrbitingBody } from '../../main/objects/body';
import { div3, hexFromColorString } from '../../main/libs/math';
import { useLoader } from '@react-three/fiber';
import textures from '../../textureData';
import { TWO_PI, degToRad, linspace, wrapAngle, sub3 } from '../../main/libs/math';
import Kepler from '../../main/libs/kepler';
import Color from '../../main/objects/color';
import { BufferAttribute } from 'three';

function getCentralBodyOrbit(body: OrbitingBody, date: number, plotSize: number) {
    const nu = Kepler.dateToOrbitTrueAnomaly(date, body.orbit);
    const dist = Kepler.distanceAtOrbitTrueAnomaly(nu, body.orbit);
    const arcWidth = plotSize / dist;
    const angles = linspace(nu - arcWidth, nu + arcWidth, 401).map(a => wrapAngle(a, nu));

    const currentPosition = Kepler.positionAtTrueAnomaly(body.orbit, nu);
    const positions: Vector3[] = angles.map(a => div3(sub3(Kepler.positionAtTrueAnomaly(body.orbit, a), currentPosition), plotSize));

    const points = positions.map(pt => new THREE.Vector3(-pt.x, pt.z, pt.y));
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);

    const fullColor = new Color(body.color);
    const colorScales = [...linspace(0.2, 0.25, 200), ...linspace(0.05, 0.1, 201)];
    const scaledColors = colorScales.map(scale => {
        const color = fullColor.rescale(scale);
        return [color.r / 255, color.g/255, color.b/255];
    }).flat();
    const colors = new Float32Array(scaledColors);
    lineGeometry.setAttribute('color', new BufferAttribute(colors,3))
    return (
        //@ts-ignore
        <line geometry={lineGeometry}>
           <lineBasicMaterial vertexColors={true} attach="material" linewidth={10} />
        </line>
    )
}

function CentralBodySphere({body, date, plotSize, isSun = true}: {body: CelestialBody, date: number, plotSize: number, isSun?: boolean}) {
    const position = useRef(new THREE.Vector3(0,0,0));
    let textureURL = textures.get(body.name);
    const hasTexture = textureURL !== undefined;
    textureURL = textureURL || textures.get("blank") as string;
    const texture = useLoader(THREE.TextureLoader, textureURL);
    return (
        <>
        <mesh 
            position={position.current}
            rotation={[0, degToRad(body.initialRotation) + TWO_PI * ((date % body.rotationPeriod) / body.rotationPeriod), 0]} 
            onClick={(e) => {e.stopPropagation(); console.log(e)}}
        >
            <sphereGeometry args={[body.radius / plotSize, 32, 32]} />
            {isSun ? <meshBasicMaterial color={hasTexture ? 'white' : hexFromColorString(body.color.toString())} map={texture} />
                : <meshLambertMaterial color={hasTexture ? 'white' : hexFromColorString(body.color.toString())} map={texture} />
            }
        </mesh>
        {body.atmosphereHeight > 0 &&
            <mesh onClick={(e) => {e.stopPropagation(); console.log(e)}} >
                <sphereGeometry args={[(body.radius + body.atmosphereHeight) / plotSize, 32, 32]} />
                <meshStandardMaterial color={hexFromColorString(body.color.toString())} transparent={true} opacity={0.05} roughness={1} />
            </mesh> 
        }
        {!isSun && 
            getCentralBodyOrbit(body as OrbitingBody, date, plotSize)
        }
        </>
    )
  }
  
  export default CentralBodySphere