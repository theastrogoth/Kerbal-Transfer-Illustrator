import React from 'react';
import Orbit from '../../main/objects/orbit';
import OrbitLine from './OrbitLine';
import SolarSystem from '../../main/objects/system';

function TrajectoryDisplay({trajectory, system, date, plotSize, color = {r: 255, g: 255, b: 255}}: {trajectory: Trajectory, system: SolarSystem, date: number, plotSize: number, color?: IColor}) {
    const returnedElements = trajectory.orbits.map((orbit, index) =>
        <OrbitLine 
            key={index}
            orbit={new Orbit(orbit, system.bodyFromId(orbit.orbiting))} 
            date={date} 
            plotSize={plotSize} 
            color={color}
            minDate={trajectory.intersectTimes[index]}
            maxDate={trajectory.intersectTimes[index+1]}
        />
    );
    return (
        <>
            {returnedElements}
        </>
    );
}
  
  export default TrajectoryDisplay;