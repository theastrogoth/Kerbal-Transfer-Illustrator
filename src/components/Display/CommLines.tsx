import React, { useEffect, useState } from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei'

import SolarSystem from '../../main/objects/system';
import { signalStrength } from '../../main/libs/comm';
import { div3 } from '../../main/libs/math';
import Color from '../../main/objects/color';

import { useAtom } from 'jotai';
import { displayOptionsAtom } from '../../App';
import CelestialBody from '../../main/objects/body';
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

type CommLinesProps = {
    flightPlans:    FlightPlan[],
    centralBody:    CelestialBody
    system:         SolarSystem,
    date:           number,
    plotSize:       number,
    depth?:         number,
}

function CommLine({flightPlan1, flightPlan2, centralBody, system, date, plotSize}: CommLineProps) {
    const [displayOptions] = useAtom(displayOptionsAtom);
    if ( !displayOptions.comms ) {return <></>}
    if ( (flightPlan1.commRange || 0) === 0) { return <></>}
    if ( (flightPlan2.commRange || 0) === 0) { return <></>}
    const orb1 = Trajectories.currentOrbitForFlightPlan(flightPlan1, date);
    if ( orb1 === null) { return <></>};
    const orb2 = Trajectories.currentOrbitForFlightPlan(flightPlan2, date);
    if ( orb2 === null) { return <></>};
    let pos1 = Kepler.orbitPositionFromCentralBody(orb1, system, centralBody, date);
    let pos2 = Kepler.orbitPositionFromCentralBody(orb2, system, centralBody, date);
    const strength = signalStrength(flightPlan1.commRange as number, flightPlan2.commRange as number, pos1, pos2, system);
    if (strength === 0) { return <></>};
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

function getCombos(len: number) {
    const combos: [number, number][] = [];
    for (let i=0; i<len; i++) {
        for (let j=i+1; j<len; j++) {
            combos.push([i,j])
        }
    }
    return combos
}

function CommLines({flightPlans, centralBody, system, date, plotSize}: CommLinesProps) {
    const [combos, setCombos] = useState(getCombos(flightPlans.length));
    useEffect(() => {
        setCombos(getCombos(flightPlans.length))
    }, [flightPlans.length])
    return (<>
        { combos.map(x => <CommLine 
                            flightPlan1={flightPlans[x[0]]} 
                            flightPlan2={flightPlans[x[1]]} 
                            centralBody={centralBody} 
                            system={system}
                            date={date} 
                            plotSize={plotSize} 
                        />)
        }
    </>)
}

export default CommLines;