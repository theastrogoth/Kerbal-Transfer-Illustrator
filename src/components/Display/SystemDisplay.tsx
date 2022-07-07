import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import BodySphere from './BodySphere';
import OrbitLine from './OrbitLine';
import TrajectoryDisplay from './TrajectoryDisplay';

import SolarSystem from '../../main/objects/system';
import CelestialBody, { OrbitingBody } from '../../main/objects/body';

import Kepler from '../../main/libs/kepler';
import { sub3, normalize3, vec3, add3 } from '../../main/libs/math';

import { useAtom } from 'jotai';
import { displayOptionsAtom } from '../../App';

type SystemDisplayProps = {centralBody: CelestialBody,
    system:         SolarSystem,
    plotSize:       number,
    date:           number,
    isSun?:         boolean,
    depth?:         number,
    centeredAt?:    Vector3,
    flightPlans?:   FlightPlan[],
    setInfoItem:    React.Dispatch<React.SetStateAction<InfoItem>>,
    setTarget:      React.Dispatch<React.SetStateAction<TargetObject>>,
}

function getTrajectoryIcons(trajectory: Trajectory, index: number, flightPlan: FlightPlan, centralBody: CelestialBody, system: SolarSystem): TrajectoryIconInfo {
    const maneuver: [number, string][] = [];
    const soi: [number, string][] = [];
    if(flightPlan.maneuverContexts) {
        let startManeuverIdx = 0;
        for(let i=0; i<index; i++) {
            startManeuverIdx += flightPlan.trajectories[i].maneuvers.length;
        }
        for(let i=0; i<trajectory.maneuvers.length; i++) {
            maneuver.push([i, (flightPlan.maneuverContexts as string[])[i + startManeuverIdx]])
        }
    } else {
        for(let i=0; i<trajectory.maneuvers.length; i++) {
            maneuver.push([i, 'Maneuver']);
        }
    }
    if(index !== 0) {
        const previousBodyId = flightPlan.trajectories[index - 1].orbits[0].orbiting;
        const previousBody = system.bodyFromId(previousBodyId);
        if(centralBody.orbiterIds.includes(previousBodyId)) {
            soi.push([0, "Escape from " + previousBody.name]);
        } else {
            soi.push([0, centralBody.name + " Encounter"]);
        }
    }
    if(index !== flightPlan.trajectories.length-1) {
        const nextBodyId = flightPlan.trajectories[index + 1].orbits[0].orbiting;
        const nextBody = system.bodyFromId(nextBodyId);
        if(centralBody.orbiterIds.includes(nextBodyId)) {
            soi.push([trajectory.intersectTimes.length-1, nextBody.name + " Encounter"]);
        } else {
            soi.push([trajectory.intersectTimes.length-1, "Escape from " + centralBody.name]);
        }
    }
    return {maneuver, soi};
}

function getSunLight(centralBody: CelestialBody, system: SolarSystem, date: number, depth: number) {
    if(depth === 0) {
        if(centralBody.name === system.sun.name) {
            return <>
                <ambientLight key={'ambient'} intensity={0.1} />
                <pointLight key={'sun'} castShadow={true} position={[0, 0, 0] } intensity={1.5} />
            </>
        } else {
            const pathToSun = system.sequenceToSun(centralBody.id);
            let sunDirection = vec3(0,0,0);
            for(let i=0; i<pathToSun.length-1; i++) {
                const body = system.bodyFromId(pathToSun[i]) as OrbitingBody;
                sunDirection = sub3(sunDirection, Kepler.orbitToPositionAtDate(body.orbit, date));
            }
            sunDirection = normalize3(sunDirection);
            return <>
                <ambientLight key={'ambient'} intensity={0.1} />
                <directionalLight key={'sun'} castShadow={true} position={new THREE.Vector3(-sunDirection.x, sunDirection.z, sunDirection.y)} intensity={1.5} />
            </>
        }
    } else {
        return <></>
    }
}

function SystemDisplay({centralBody, system, plotSize, date, isSun = true, depth = 0, centeredAt = vec3(0,0,0), flightPlans = [], setInfoItem, setTarget}: SystemDisplayProps) {
    const [displayOptions] = useAtom(displayOptionsAtom);
    
    const sunLight = useRef(getSunLight(centralBody, system, date, depth));

    const bodyFlightPlans = flightPlans.map((flightPlan) => flightPlan.trajectories.map((trajectory, trajIndex) => {return {trajectory, index: trajIndex}}).filter(traj => traj.trajectory.orbits[0].orbiting === centralBody.id));
    const iconInfos = bodyFlightPlans.map((trajectories, index) => trajectories.map(trajectory => getTrajectoryIcons(trajectory.trajectory, trajectory.index, flightPlans[index], centralBody, system)));

    useEffect(() => {
        sunLight.current = getSunLight(centralBody, system, date, depth);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [centralBody, system, date, depth])

    return (
        <>
            <mesh>
                {sunLight.current}
            </mesh>
            <BodySphere 
                key={centralBody.name}
                body={centralBody}
                system={system}
                date={date}
                plotSize={plotSize}
                isSun={isSun}
                depth={depth}
                centeredAt={centeredAt}
                setInfoItem={setInfoItem}
                setTarget={setTarget}
            />
            {centralBody.orbiters.map((orbiter, index) => {
                const orbiterPosition = add3(Kepler.orbitToPositionAtDate(orbiter.orbit, date), centeredAt)
                return <>
                    <OrbitLine 
                        key={centralBody.name + 'orbit' + String(index)}
                        orbit={orbiter.orbit}
                        date={date}
                        plotSize={plotSize}
                        centeredAt={centeredAt}
                        depth={depth}
                        name={orbiter.name}
                        color={orbiter.color}
                        setInfoItem={setInfoItem}
                        displayOptions={{
                            orbits: displayOptions.bodyOrbits,
                            apses:  displayOptions.bodyApses,
                            nodes:  displayOptions.bodyNodes,
                        }}
                    />
                    <SystemDisplay key={orbiter.name + 'system'}
                        centralBody={orbiter}
                        system={system}
                        plotSize={plotSize}
                        date={date}
                        isSun={false}
                        depth={depth+1}
                        centeredAt={orbiterPosition}
                        flightPlans={flightPlans}
                        setInfoItem={setInfoItem}
                        setTarget={setTarget}
                    />    
                </>
            })}
            {bodyFlightPlans.map((trajectories, fpindex) => 
                trajectories.map((trajectory, tindex) => 
                    <TrajectoryDisplay key={centralBody.name + String(fpindex) + String(tindex)}
                        trajectory={trajectory.trajectory}
                        system={system}
                        date={date}
                        plotSize={plotSize}
                        centeredAt={centeredAt}
                        depth={depth}
                        icons={iconInfos[fpindex][tindex]}
                        flightPlan={flightPlans[fpindex]}
                        setInfoItem={setInfoItem}
                        setTarget={setTarget}
                        displayOptions={displayOptions}
                    />
                ).flat()
            )}
        </>
    )
  }
  
  export default React.memo(SystemDisplay);