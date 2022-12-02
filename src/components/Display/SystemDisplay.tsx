import React from 'react';
import BodySphere from './BodySphere';
import OrbitLine from './OrbitLine';
import TrajectoryDisplay from './TrajectoryDisplay';

import SolarSystem from '../../main/objects/system';
import CelestialBody, { OrbitingBody } from '../../main/objects/body';

import Kepler from '../../main/libs/kepler';
import { vec3, add3 } from '../../main/libs/math';

import { PrimitiveAtom, useAtom } from 'jotai';
import { commsOptionsAtom, displayOptionsAtom, groundStationsAtom, systemNameAtom } from '../../App';

type OrbiterDisplayProps = {
    body:           OrbitingBody,
    index:          number,
    tabValue:       number,
    system:         SolarSystem,
    plotSize:       number,
    date:           number,
    depth:          number,
    centeredAt:     Vector3,
    flightPlans:    FlightPlan[],
    landedVessels?: LandedVessel[],
    infoItemAtom:   PrimitiveAtom<InfoItem>,
    displayOptions: DisplayOptions,
    setTarget:      React.Dispatch<React.SetStateAction<TargetObject>>,
}

type SystemDisplayProps = {
    centralBody:    CelestialBody,
    index:          number,
    tabValue:       number,
    system:         SolarSystem,
    plotSize:       number,
    date:           number,
    isSun?:         boolean,
    depth?:         number,
    centeredAt?:    Vector3,
    flightPlans?:   FlightPlan[],
    landedVessels?: LandedVessel[],
    infoItemAtom:   PrimitiveAtom<InfoItem>,
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

function OrbiterDisplay({index, tabValue, body, system, plotSize, date, depth, centeredAt, flightPlans, landedVessels, infoItemAtom, displayOptions, setTarget}: OrbiterDisplayProps) {
    const position = add3(Kepler.orbitToPositionAtDate(body.orbit, date), centeredAt);
    return (<> 
        <OrbitLine 
            orbit={body.orbit}
            date={date}
            plotSize={plotSize}
            centeredAt={centeredAt}
            depth={depth}
            name={body.name}
            color={body.color}
            infoItemAtom={infoItemAtom}
            displayOptions={{
                orbits: displayOptions.bodyOrbits,
                apses:  displayOptions.bodyApses,
                nodes:  displayOptions.bodyNodes,
            }}
        />
        <SystemDisplay 
            index={index}
            tabValue={tabValue}
            centralBody={body}
            system={system}
            plotSize={plotSize}
            date={date}
            isSun={false}
            depth={depth+1}
            centeredAt={position}
            flightPlans={flightPlans}
            landedVessels={landedVessels}
            infoItemAtom={infoItemAtom}
            setTarget={setTarget}
        />    
    </>);
}

function SystemDisplay({index, tabValue, centralBody, system, plotSize, date, isSun = true, depth = 0, centeredAt = vec3(0,0,0), flightPlans = [], landedVessels = [], infoItemAtom, setTarget}: SystemDisplayProps) {
    const [displayOptions] = useAtom(displayOptionsAtom);
    const [commsOptions] = useAtom(commsOptionsAtom);
    const [systemName] = useAtom(systemNameAtom);
    const [groundStations] = useAtom(groundStationsAtom);
    
    const bodyFlightPlans = flightPlans.map((flightPlan) => flightPlan.trajectories.map((trajectory, trajIndex) => {return {trajectory, index: trajIndex}}).filter(traj => traj.trajectory.orbits[0].orbiting === centralBody.id));
    const iconInfos = bodyFlightPlans.map((trajectories, index) => trajectories.map(trajectory => getTrajectoryIcons(trajectory.trajectory, trajectory.index, flightPlans[index], centralBody, system)));

    const bodyLandedVessels = landedVessels.filter(lv => lv.bodyIndex === centralBody.id);
    if (centralBody.id === 1 && (systemName === "Kerbol System (Stock)" || systemName === "Kerbol System (OPM)") ) {
        if (commsOptions.spaceCenter) {
            bodyLandedVessels.push(groundStations[0]);
        }
        if (commsOptions.groundStations) {
            bodyLandedVessels.push(...groundStations.slice(1));
        }
    }
    
    return (
        <>
            <BodySphere 
                key={centralBody.name}
                body={centralBody}
                system={system}
                date={date}
                plotSize={plotSize}
                isSun={isSun}
                depth={depth}
                centeredAt={centeredAt}
                infoItemAtom={infoItemAtom}
                setTarget={setTarget}
                landedVessels={bodyLandedVessels}
            />
            {centralBody.orbiters.map((body, index) => {
                return <OrbiterDisplay 
                    key={body.name}
                    index={index}
                    tabValue={tabValue}
                    body={body}
                    system={system}
                    plotSize={plotSize}
                    date={date}
                    depth={depth}
                    centeredAt={centeredAt}
                    flightPlans={flightPlans}
                    landedVessels={landedVessels}
                    infoItemAtom={infoItemAtom}
                    displayOptions={displayOptions}
                    setTarget={setTarget}
                />
            })}
            {bodyFlightPlans.map((trajectories, fpindex) => 
                trajectories.map((trajectory, tindex) => 
                    <TrajectoryDisplay 
                        key={centralBody.name + String(index) + String(fpindex) + String(tindex)}
                        index={index}
                        tabValue={tabValue}
                        trajectory={trajectory.trajectory}
                        system={system}
                        date={date}
                        plotSize={plotSize}
                        centeredAt={centeredAt}
                        depth={depth}
                        icons={iconInfos[fpindex][tindex]}
                        flightPlan={flightPlans[fpindex]}
                        infoItemAtom={infoItemAtom}
                        setTarget={setTarget}
                        displayOptions={displayOptions}
                    />
                ).flat()
            )}
        </>
    )
  }
  
  export default React.memo(SystemDisplay);