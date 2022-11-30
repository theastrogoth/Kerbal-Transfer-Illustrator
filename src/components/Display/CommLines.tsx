import React, { useEffect, useState } from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei'

import SolarSystem from '../../main/objects/system';
import { bodiesBlockComms, signalStrength } from '../../main/libs/comm';
import { TWO_PI, Z_DIR, div3, degToRad, roderigues, vec3, add3 } from '../../main/libs/math';

import { useAtom } from 'jotai';
import { displayOptionsAtom } from '../../App';
import CelestialBody, { OrbitingBody } from '../../main/objects/body';
import Kepler from '../../main/libs/kepler';
import Trajectories from '../../main/libs/trajectories';

type CommLineProps = {
    flightPlan1:    FlightPlan,
    flightPlan2:    FlightPlan,
    centralBody:    CelestialBody
    system:         SolarSystem,
    date:           number,
    plotSize:       number,
    depth?:         number,
}

type MixedLineProps = {
    flightPlan:     FlightPlan,
    landedVessel:   LandedVessel,
    centralBody:    CelestialBody
    system:         SolarSystem,
    date:           number,
    plotSize:       number,
    depth?:         number,
}

type GroundLineProps = {
    landedVessel1:  LandedVessel,
    landedVessel2:  LandedVessel,
    centralBody:    CelestialBody
    system:         SolarSystem,
    date:           number,
    plotSize:       number,
    depth?:         number,  
}

type CommLinesProps = {
    flightPlans:    FlightPlan[],
    landedVessels:  LandedVessel[],
    centralBody:    CelestialBody
    system:         SolarSystem,
    date:           number,
    plotSize:       number,
    depth?:         number,
}

function CommLine({flightPlan1, flightPlan2, centralBody, system, date, plotSize}: CommLineProps) {
    const [displayOptions] = useAtom(displayOptionsAtom);
    if ( !displayOptions.comms ) {return <></> }
    if ( (flightPlan1 === undefined || flightPlan2 === undefined)) { return <></> }
    if ( (flightPlan1.commRange || 0) === 0) { return <></> }
    if ( (flightPlan2.commRange || 0) === 0) { return <></> }
    const orb1 = Trajectories.currentOrbitForFlightPlan(flightPlan1, date);
    if ( orb1 === null) { return <></> };
    const orb2 = Trajectories.currentOrbitForFlightPlan(flightPlan2, date);
    if ( orb2 === null) { return <></> };
    let pos1 = Kepler.orbitPositionFromCentralBody(orb1, system, centralBody, date);
    let pos2 = Kepler.orbitPositionFromCentralBody(orb2, system, centralBody, date);
    const strength = signalStrength(flightPlan1.commRange as number, flightPlan2.commRange as number, pos1, pos2);
    if (strength === 0) { return <></> };
    if (bodiesBlockComms(pos1, pos2, centralBody, centralBody, system, date)) { return <></> }
    pos1 = div3(pos1, plotSize);
    pos2 = div3(pos2, plotSize);
    const points = [new THREE.Vector3(-pos1.x, pos1.z, pos1.y), new THREE.Vector3(-pos2.x, pos2.z, pos2.y)];
    const color = "rgb(" + String(Math.round((1 - strength) * 255)) + "," + String(Math.round(strength * 255)) + ",0)";
    return (
        <Line 
            points={points} 
            lineWidth={2} 
            color={color} 
        />
    )
}

function MixedLine({flightPlan, landedVessel, centralBody, system, date, plotSize}: MixedLineProps) {
    const [displayOptions] = useAtom(displayOptionsAtom);
    if ( !displayOptions.comms ) {return <></> }
    if ( (flightPlan === undefined || landedVessel === undefined)) { return <></> }
    if ( (flightPlan.commRange || 0) === 0) { return <></> }
    if ( (landedVessel.commRange || 0) === 0) { return <></> }
    if ( (landedVessel.bodyIndex || 0) === 0) { return <></>}
    const orb = Trajectories.currentOrbitForFlightPlan(flightPlan, date);
    if ( orb === null) { return <></> };
    let pos1 = Kepler.orbitPositionFromCentralBody(orb, system, centralBody, date);
    const body2 = (system.bodyFromId(landedVessel.bodyIndex) as OrbitingBody);
    let pos2 =Kepler.orbitPositionFromCentralBody(body2.orbit, system, centralBody, date);
    const rotation2 = degToRad(body2.initialRotation || 0) + Math.PI + TWO_PI * ((date % (body2.rotationPeriod || Infinity)) / (body2.rotationPeriod || Infinity));
    const groundPos2 = roderigues(getGroundPosition(body2.radius, landedVessel), Z_DIR, rotation2);
    pos2 = add3(pos2, groundPos2);
    const strength = signalStrength(flightPlan.commRange as number, landedVessel.commRange as number, pos1, pos2);
    if (strength === 0) { return <></> };
    if (bodiesBlockComms(pos1, pos2, centralBody, centralBody, system, date)) { return <></> }
    pos1 = div3(pos1, plotSize);
    pos2 = div3(pos2, plotSize);
    const points = [new THREE.Vector3(-pos1.x, pos1.z, pos1.y), new THREE.Vector3(-pos2.x, pos2.z, pos2.y)];
    const color = "rgb(" + String(Math.round((1 - strength) * 255)) + "," + String(Math.round(strength * 255)) + ",0)";
    return (
        <Line 
            points={points} 
            lineWidth={2} 
            color={color} 
        />
    )
}

function GroundLine({landedVessel1, landedVessel2, centralBody, system, date, plotSize}: GroundLineProps) {
    const [displayOptions] = useAtom(displayOptionsAtom);
    if ( !displayOptions.comms ) {return <></> }
    if ( (landedVessel1 === undefined || landedVessel2 === undefined)) { return <></> }
    if ( (landedVessel1.commRange || 0) === 0) { return <></> }
    if ( (landedVessel2.commRange || 0) === 0) { return <></> }
    if ( (landedVessel2.bodyIndex || 0) === 0) { return <></>}
    const body1 = (system.bodyFromId(landedVessel1.bodyIndex) as OrbitingBody);
    const body2 = (system.bodyFromId(landedVessel2.bodyIndex) as OrbitingBody);
    let pos1 = Kepler.orbitPositionFromCentralBody(body1.orbit, system, centralBody, date);
    let pos2 = Kepler.orbitPositionFromCentralBody(body2.orbit, system, centralBody, date);
    const rotation1 = degToRad(body1.initialRotation || 0) + Math.PI + TWO_PI * ((date % (body1.rotationPeriod || Infinity)) / (body1.rotationPeriod || Infinity));
    const rotation2 = degToRad(body2.initialRotation || 0) + Math.PI + TWO_PI * ((date % (body2.rotationPeriod || Infinity)) / (body2.rotationPeriod || Infinity));
    const groundPos1 = roderigues(getGroundPosition(body1.radius, landedVessel1), Z_DIR, rotation1);
    const groundPos2 = roderigues(getGroundPosition(body2.radius, landedVessel2), Z_DIR, rotation2);
    pos1 = add3(pos1, groundPos1);
    pos2 = add3(pos2, groundPos2);
    const strength = signalStrength(landedVessel1.commRange as number, landedVessel2.commRange as number, pos1, pos2);
    if (strength === 0) { return <></> };
    if (bodiesBlockComms(pos1, pos2, centralBody, centralBody, system, date)) { return <></> }
    pos1 = div3(pos1, plotSize);
    pos2 = div3(pos2, plotSize);
    const points = [new THREE.Vector3(-pos1.x, pos1.z, pos1.y), new THREE.Vector3(-pos2.x, pos2.z, pos2.y)];
    const color = "rgb(" + String(Math.round((1 - strength) * 255)) + "," + String(Math.round(strength * 255)) + ",0)";
    return (
        <Line 
            points={points} 
            lineWidth={2} 
            color={color} 
        />
    )
}

function getGroundPosition(radius: number, vessel: LandedVessel) {
    const r = (radius + vessel.altitude);
    const latRad = degToRad(vessel.latitude);
    const longRad = degToRad(vessel.longitude) + Math.PI;
    const coslat = Math.cos(latRad);
    const sinlat = Math.sin(latRad);
    const coslong = Math.cos(longRad);
    const sinlong = Math.sin(longRad);
    const groundPos = vec3(r * coslong * coslat, r * sinlong * coslat, r * sinlat);
    return groundPos;
}

function getCombos(len: number) {
    const combos: [number, number][] = [];
    for (let i=0; i<len; i++) {
        for (let j=i+1; j<len; j++) {
            combos.push([i,j])
        }
    }
    return combos
}

function getCombos2(len1: number, len2: number) {
    const combos: [number, number][] = [];
    for (let i=0; i<len1; i++) {
        for (let j=0; j<len2; j++) {
            combos.push([i,j])
        }
    }
    return combos
}


function CommLines({flightPlans, landedVessels, centralBody, system, date, plotSize}: CommLinesProps) {
    const [commCombos, setCommCombos] = useState(getCombos(flightPlans.length));
    const [mixCombos, setMixCombos] = useState(getCombos2(flightPlans.length, landedVessels.length));
    const [groundCombos, setGroundCombos] = useState(getCombos(landedVessels.length));

    useEffect(() => {
        setCommCombos(getCombos(flightPlans.length))
        setMixCombos(getCombos2(flightPlans.length, landedVessels.length))
        setGroundCombos(getCombos(landedVessels.length))
    }, [flightPlans.length, landedVessels.length])
    return (<>
        { commCombos.map(x => <CommLine 
                            key={"c" + String(x[0]) + String(x[1])}
                            flightPlan1={flightPlans[x[0]]} 
                            flightPlan2={flightPlans[x[1]]} 
                            centralBody={centralBody} 
                            system={system}
                            date={date} 
                            plotSize={plotSize} 
                        />)
        }
        { mixCombos.map(x => <MixedLine 
                    key={"m" + String(x[0]) + String(x[1])}
                    flightPlan={flightPlans[x[0]]} 
                    landedVessel={landedVessels[x[1]]} 
                    centralBody={centralBody} 
                    system={system}
                    date={date} 
                    plotSize={plotSize} 
                />)
        }
            { groundCombos.map(x => <GroundLine 
                key={"g" + String(x[0]) + String(x[1])}
                landedVessel1={landedVessels[x[0]]} 
                landedVessel2={landedVessels[x[1]]} 
                centralBody={centralBody} 
                system={system}
                date={date} 
                plotSize={plotSize} 
            />)
        }
    </>)
}

export default CommLines;