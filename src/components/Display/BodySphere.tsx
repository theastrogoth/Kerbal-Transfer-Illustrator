import React, { /* Suspense, */ useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { ThreeEvent, useFrame, /* useLoader */ } from '@react-three/fiber';
import textures from '../../textureData';

import SolarSystem from '../../main/objects/system';
import CelestialBody, { OrbitingBody } from '../../main/objects/body';
import Color from '../../main/objects/color';

import Kepler from '../../main/libs/kepler';
import { /* TWO_PI, degToRad, */ linspace, wrapAngle, vec3, sub3, div3, hexFromColorString } from '../../main/libs/math';

import sphereIcon from '../../assets/icons/sphere.png';
const sphereTexture = new THREE.TextureLoader().load(sphereIcon);

type BodySphereProps = {
    body:           CelestialBody,
    system:         SolarSystem,
    date:           number,
    plotSize:       number,
    isSun?:         boolean,
    depth?:         number,
    centeredAt?:    Vector3,
    setInfoItem:    React.Dispatch<React.SetStateAction<InfoItem>>,
    setTarget:      React.Dispatch<React.SetStateAction<TargetObject>>
}

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
    lineGeometry.setAttribute('color', new THREE.BufferAttribute(colors,3))
    return (
        //@ts-ignore
        <line geometry={lineGeometry}>
           <lineBasicMaterial vertexColors={true} attach="material" linewidth={10} />
        </line>
    )
}

function BodySphere({body, system, date, plotSize, isSun = true, depth = 0, centeredAt = vec3(0,0,0), setInfoItem, setTarget}: BodySphereProps) {
    const color = useRef(hexFromColorString(body.color.toString()));
    const soiColor= useRef(hexFromColorString(body.color.rescale(0.5).toString()));
    const attractorSoi = useRef(depth < 2 ? Infinity : system.bodyFromId((body as OrbitingBody).orbiting).soi as number);

    const hasTexture = useRef(textures.get(body.name) !== undefined);
    const textureURL= useRef(textures.get(body.name) || textures.get("blank") as string);
    // const texture = useLoader(THREE.TextureLoader, textureURL.current);

    const timer = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        color.current = hexFromColorString(body.color.toString());
        soiColor.current = hexFromColorString(body.color.rescale(0.5).toString());
        const newTextureURL = textures.get(body.name);
        hasTexture.current = newTextureURL !== undefined;
        textureURL.current = newTextureURL || textures.get("blank") as string;
        attractorSoi.current = depth < 2 ? Infinity : system.bodyFromId((body as OrbitingBody).orbiting).soi as number;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [body])
    
    const pos = div3(centeredAt, plotSize);
    const position = new THREE.Vector3(-pos.x, pos.z, pos.y);

    const [closeVisible, setCloseVisible] = useState(true);
    const [farVisible, setFarVisible] = useState(true);
    useFrame((state) => {
        setFarVisible(depth <= 1 ? true : state.camera.position.distanceTo(position) < 10 * attractorSoi.current / plotSize);
        setCloseVisible(depth === 0 ? true : state.camera.position.distanceTo(position) < 10 * (body.soi as number) / plotSize);
    })

    const handleClick = (visible: boolean) => (e: ThreeEvent<MouseEvent>) => {
        if(visible) {
            e.stopPropagation();
            if(timer.current === null) {
                timer.current = setTimeout(() => {
                    setInfoItem(body);
                    timer.current = null;
                }, 300)
            }
        }
    }
    const handleDoubleClick = (visible: boolean) => (e: ThreeEvent<MouseEvent>) => {
        if(visible) {
            e.stopPropagation(); 
            setTarget(body);
            clearTimeout(timer.current as NodeJS.Timeout);
            timer.current = null;
        }
    }

    return (
        <>    
        <mesh 
            position={position}
            onClick={handleClick(closeVisible)}
            onDoubleClick={handleDoubleClick(closeVisible)}
            visible={closeVisible}
        >
            <sphereGeometry args={[body.radius / plotSize, 32, 32]} />
            {/* <Suspense
            fallback={isSun ? <meshBasicMaterial color={color.current} />
                            : <meshLambertMaterial color={color.current} />
                    }
            >
                {isSun ? <meshBasicMaterial color={hasTexture.current ? 'white' : color.current} map={texture} />
                    : <meshLambertMaterial color={hasTexture.current ? 'white' : color.current} map={texture} />
                }
            </Suspense> */}
            {isSun ? <meshBasicMaterial color={color.current} />
                            : <meshLambertMaterial color={color.current} />
            }
        </mesh>
        {body.atmosphereHeight > 0 &&
            <mesh position={position} visible={closeVisible}>
                <sphereGeometry args={[(body.radius + body.atmosphereHeight) / plotSize, 32, 32]} />
                <meshLambertMaterial color={color.current} transparent={true} opacity={0.05} />
            </mesh> 
        }
        {(depth > 0 && body.soi) &&
            <mesh position={position} visible={farVisible}>
                <sphereGeometry args={[body.soi as number / plotSize, 32, 32]} />
                <meshBasicMaterial transparent={true} opacity={0.25} color={soiColor.current}/>
            </mesh>
        }
        <sprite 
            scale={[0.05,0.05,0.05]} 
            position={position}
            onClick={handleClick(farVisible)}
            onDoubleClick={handleDoubleClick(farVisible)}
            visible={farVisible}
        >
            <spriteMaterial map={sphereTexture} sizeAttenuation={false} color={color.current} depthTest={false} />
        </sprite>
        {(!isSun && depth === 0) &&
            getCentralBodyOrbit(body as OrbitingBody, date, plotSize)
        }
        </>
    )
  }
  
  export default BodySphere;