import React, { useState, useEffect, useRef } from 'react';

import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei'

import SystemDisplay from './SystemDisplay';
import SkyBox from './SkyBox';

import CelestialBody, { OrbitingBody } from '../../main/objects/body';
import SolarSystem from '../../main/objects/system';

import { vec3, div3 } from '../../main/libs/math';
import Kepler from '../../main/libs/kepler';
import Trajectories from '../../main/libs/trajectories';
import ReferenceLine from './ReferenceLine';

import { PrimitiveAtom, useAtom } from 'jotai';
import { displayOptionsAtom } from '../../App';
import ParentBodies from './ParentBodies';
import CommLines from './CommLines';

export type OrbitPlotProps = {
    index:              number,
    tabValue:           number,
    centralBody:        CelestialBody,
    system:             SolarSystem,
    date:               number,
    flightPlans?:       FlightPlan[],
    landedVessels?:     LandedVessel[],
    infoItemAtom:       PrimitiveAtom<InfoItem>,
}

function getPlotSize(centralBody: CelestialBody) {
    return((centralBody.soi === undefined || centralBody.soi === null || centralBody.soi === Infinity) ? 
              centralBody.orbiters.length === 0 ? 
                centralBody.radius * 2 as number :
              2 * centralBody.furtherstOrbiterDistance as number :
            centralBody.soi as number);
}

function getTargetPosition(target: ICelestialBody | IOrbitingBody | IVessel | IOrbit | FlightPlan, system: SolarSystem, centralBody: ICelestialBody, date: number) {
    let orbit: IOrbit | null = null;
    if (target.hasOwnProperty('eccentricity')) {
        orbit = target as IOrbit;
    } else if (target.hasOwnProperty('orbit')) {
        orbit = (target as IVessel | IOrbitingBody).orbit;
    } else if(target.hasOwnProperty('trajectories')) {
        orbit = Trajectories.currentOrbitForFlightPlan((target as FlightPlan), date);
    }
    return orbit === null ? vec3(0,0,0) : Kepler.orbitPositionFromCentralBody(orbit, system, centralBody, date);
}

function OrbitPlot({index, tabValue, centralBody, system, date, flightPlans=[], landedVessels=[], infoItemAtom}: OrbitPlotProps) {
    const [displayOptions] = useAtom(displayOptionsAtom);
    const [plotSize, setPlotSize] = useState(getPlotSize(centralBody));
    const state = useThree();
    
    const [targetObject, setTargetObject] = useState<TargetObject>(centralBody);
    const targetPosition = useRef(new THREE.Vector3(0,0,0));

    const oldTargetPosition = targetPosition.current.clone();
    const targetPos = div3(getTargetPosition(targetObject, system, centralBody, date), plotSize)
    const newTargetPosition = new THREE.Vector3(-targetPos.x, targetPos.z, targetPos.y);
    targetPosition.current = newTargetPosition;
    const move = newTargetPosition.clone().sub(oldTargetPosition);
    state.camera.position.add(move);
    state.camera.updateProjectionMatrix();

    const isSun = centralBody.name === system.sun.name;

    useEffect(() => {
        setPlotSize(getPlotSize(centralBody));
        setTargetObject(centralBody);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [centralBody.id, centralBody.radius, centralBody.name, centralBody.stdGravParam]);

    const bgColor = <color attach="background" args={[0.07, 0.07, 0.07]} />;
    return (
        <>
            { displayOptions.skyBox ? <SkyBox /> : bgColor }
            <PerspectiveCamera makeDefault={true} position={[0,1,0]} zoom={1} near={1e-7} far={1e9} />
            <SystemDisplay 
                index={index}
                tabValue={tabValue}
                centralBody={centralBody}
                system={system}
                flightPlans={flightPlans}
                landedVessels={landedVessels}
                plotSize={plotSize}
                date={date}
                isSun={isSun}
                infoItemAtom={infoItemAtom}
                setTarget={setTargetObject}
            />
            <ParentBodies 
                centralBody={centralBody as OrbitingBody}
                system={system}
                date={date}
                plotSize={plotSize}
                infoItemAtom={infoItemAtom}
            /> 
            <CommLines
                flightPlans={flightPlans}
                landedVessels={landedVessels}
                centralBody={centralBody}
                system={system}
                date={date}
                plotSize={plotSize}
            />
            <ambientLight key={'ambient'} intensity={0.1} />
            <ReferenceLine />
            <OrbitControls enablePan={false} rotateSpeed={0.5} zoomSpeed={2.5} target={targetPosition.current} />
        </>
    )
}

export default React.memo(OrbitPlot);