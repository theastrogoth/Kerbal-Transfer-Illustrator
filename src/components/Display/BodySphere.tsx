import React, { Suspense, useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { ThreeEvent, useFrame } from '@react-three/fiber';
import { useTexture, Html } from '@react-three/drei';
import textures from '../../textureData';

import SolarSystem from '../../main/objects/system';
import CelestialBody, { OrbitingBody } from '../../main/objects/body';
import Color from '../../main/objects/color';

import Kepler from '../../main/libs/kepler';
import { TWO_PI, degToRad, linspace, wrapAngle, vec3, sub3, div3, hexFromColorString } from '../../main/libs/math';

import { PrimitiveAtom, useAtom } from 'jotai';
import { displayOptionsAtom } from '../../App';

const textureLoader = new THREE.TextureLoader();
const sphereTexture = textureLoader.load("https://raw.githubusercontent.com/theastrogoth/Kerbal-Transfer-Illustrator/assets/icons/sphere.png");
const kscTexture = textureLoader.load("https://raw.githubusercontent.com/theastrogoth/Kerbal-Transfer-Illustrator/assets/icons/ksc.png");
const dishTexture = textureLoader.load("https://raw.githubusercontent.com/theastrogoth/Kerbal-Transfer-Illustrator/assets/icons/dish.png");

type BodySphereProps = {
    body:           CelestialBody,
    system:         SolarSystem,
    date:           number,
    plotSize:       number,
    isSun?:         boolean,
    depth?:         number,
    centeredAt?:    Vector3,
    infoItemAtom:   PrimitiveAtom<InfoItem>,
    landedVessels?: LandedVessel[],
    setTarget:      React.Dispatch<React.SetStateAction<TargetObject>> | ((body: CelestialBody) => void),
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

function getGroundPosition(radius: number, plotSize: number, vessel: LandedVessel) {
    const r = (radius + vessel.altitude) / plotSize;
    const latRad = degToRad(vessel.latitude);
    const longRad = degToRad(vessel.longitude) + Math.PI;
    const coslat = Math.cos(latRad);
    const sinlat = Math.sin(latRad);
    const coslong = Math.cos(longRad);
    const sinlong = Math.sin(longRad);
    const groundPos = [-r * coslong * coslat, r * sinlat, r * sinlong * coslat];
    console.log(r, Math.sqrt(groundPos[1] * groundPos[1] + groundPos[2] * groundPos[2] + groundPos[0] * groundPos[0] ))
    return groundPos;
}

function LandedObject({position, rotation, radius, plotSize, vessel, visible}: {position: THREE.Vector3, rotation: number, radius: number, plotSize: number, vessel: LandedVessel, visible: boolean}) {
    const groundPosVec = useRef(getGroundPosition(radius, plotSize, vessel));
    const groundPos = new THREE.Vector3(...groundPosVec.current);
    groundPos.applyAxisAngle(new THREE.Vector3(0,1,0), rotation);
    groundPos.add(position);

    return (
        <sprite
            key={vessel.name}
            scale={[0.05,0.05,0.05]}
            position={groundPos}
        >
            <spriteMaterial map={vessel.type === "Center" ? kscTexture : dishTexture} sizeAttenuation={false} color={'white'} depthTest={false} visible={visible}/>
        </sprite>
    )
}

function BodyTexture({textureURL, isSun = false, hasTexture = true, color = 'white', shadows = false, wireframe = false}: {textureURL: string, isSun?: boolean, hasTexture?: boolean, color?: string, shadows?: boolean, wireframe?: boolean}) {
    const texture = useTexture(textureURL);
    return (
        (isSun || !shadows) ? <meshBasicMaterial color={hasTexture ? 'white' : color} wireframe={wireframe} map={texture} /> : (
            wireframe       ? <meshLambertMaterial color={hasTexture ? 'white' : color} wireframe={true} map={texture} /> :
                              <meshStandardMaterial color={hasTexture ? 'white' : color} wireframe={false} map={texture} roughness={0.75} metalness={0.1} />
        )             
    )
}

function BodySphere({body, system, date, plotSize, isSun = true, depth = 0, centeredAt = vec3(0,0,0), infoItemAtom, landedVessels = [], setTarget}: BodySphereProps) {
    const [displayOptions] = useAtom(displayOptionsAtom);
    const [, setInfoItem] = useAtom(infoItemAtom);
    
    const color = useRef(hexFromColorString(body.color.toString()));
    const soiColor= useRef(hexFromColorString(body.color.rescale(0.5).toString()));
    const attractorSoi = useRef(depth < 2 ? Infinity : system.bodyFromId((body as OrbitingBody).orbiting).soi as number);

    const hasTexture = useRef((textures.get(body.name + displayOptions.textureType) !== undefined) && displayOptions.textures);
    const [textureURL, setTextureURL] = useState(( hasTexture.current ? textures.get(body.name + displayOptions.textureType) : textures.get("blank") ) as string);

    const timer = useRef<NodeJS.Timeout | null>(null);
    const shadows = !isSun && displayOptions.shadows;

    useEffect(() => {
        color.current = hexFromColorString(body.color.toString());
        soiColor.current = hexFromColorString(body.color.rescale(0.5).toString());
        const newTextureURL = textures.get(body.name + displayOptions.textureType);
        hasTexture.current = (newTextureURL !== undefined) && displayOptions.textures;
        setTextureURL(( hasTexture.current ? newTextureURL : textures.get("blank") ) as string);
        attractorSoi.current = depth < 2 ? Infinity : system.bodyFromId((body as OrbitingBody).orbiting).soi as number;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [body, displayOptions])
    
    const pos = div3(centeredAt, plotSize);
    const position = new THREE.Vector3(-pos.x, pos.z, pos.y);

    const rotation = degToRad(body.initialRotation || 0) + Math.PI + TWO_PI * ((date % (body.rotationPeriod || Infinity)) / (body.rotationPeriod || Infinity));

    const [veryCloseVisible, setVeryCloseVisible] = useState(false);
    const [closeVisible, setCloseVisible] = useState(false);
    const [farVisible, setFarVisible] = useState(false);
    useFrame((state) => {
        setFarVisible(depth <= 1 ? true : state.camera.position.distanceTo(position) < 10 * attractorSoi.current / plotSize);
        setCloseVisible(depth <= 0 ? true : state.camera.position.distanceTo(position) < 10 * (body.soi as number) / plotSize);
        setVeryCloseVisible(state.camera.position.distanceTo(position) < 10 * body.radius / plotSize);
    })

    useEffect(() => {}, [closeVisible, farVisible])

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
        {displayOptions.bodies &&
            <mesh 
                position={position}
                rotation={[0, rotation, 0]} 
                onClick={handleClick(farVisible)}
                onDoubleClick={handleDoubleClick(farVisible)}
                visible={farVisible}
                castShadow={shadows}
                receiveShadow={shadows}
            >
                <sphereGeometry args={[body.radius / plotSize, 32, 32]} />
                <Suspense
                    fallback={(isSun || !displayOptions.shadows) ? <meshBasicMaterial color={color.current} wireframe={displayOptions.wireframe} />
                                    : <meshLambertMaterial color={color.current} wireframe={displayOptions.wireframe} />
                            }
                >
                    <BodyTexture textureURL={textureURL} isSun={isSun} hasTexture={hasTexture.current} color={color.current} shadows={displayOptions.shadows} wireframe={displayOptions.wireframe}/>
                </Suspense>
            </mesh>
        }
        {(displayOptions.atmospheres && body.atmosphereHeight > 0) &&
            <mesh position={position} visible={closeVisible} castShadow={false} receiveShadow={shadows}>
                <sphereGeometry args={[(body.radius + body.atmosphereHeight) / plotSize, 32, 32]} />
                <meshLambertMaterial color={color.current} transparent={true} opacity={0.05} />
                
            </mesh> 
        }
        {(displayOptions.sois && depth > 0 && body.soi) &&
            <mesh position={position} visible={farVisible} castShadow={false} receiveShadow={false}>
                <sphereGeometry args={[body.soi as number / plotSize, 32, 32]} />
                <meshBasicMaterial transparent={true} opacity={0.25} color={soiColor.current}/>
            </mesh>
        }
        {(displayOptions.bodySprites && depth >= 0) && 
            <sprite 
                scale={[0.05,0.05,0.05]} 
                position={position}
                onClick={handleClick(farVisible)}
                onDoubleClick={handleDoubleClick(farVisible)}
                visible={farVisible}
                castShadow={false}
                receiveShadow={false}
            >
                <spriteMaterial map={sphereTexture} sizeAttenuation={false} color={color.current} depthTest={depth <= 0} />
            </sprite>
        }
        {(displayOptions.bodyOrbits && !isSun && depth === 0) &&
            getCentralBodyOrbit(body as OrbitingBody, date, plotSize)
        }
        {(displayOptions.bodyNames && farVisible) &&
            <Html 
                position={position} 
                visible={farVisible && displayOptions.bodyNames}
                style={{fontSize: '1rem', transform: 'translate3d(-50%, -150%, 0)', color: color.current}}
                castShadow={false}
                receiveShadow={false}
            >
                <div>{body.name}</div> 
            </Html>
        }
        {landedVessels.map(lv => 
            <LandedObject position={position} rotation={rotation} radius={body.radius} plotSize={plotSize} vessel={lv} visible={veryCloseVisible}/>
        )}
        </>
    )
  }
  
  export default React.memo(BodySphere);