import React from 'react';
import CelestialBody from '../../main/objects/body';
import CentralBodySphere from './CentralBody';
import OrbitingBodySphere from './OrbitingBodySphere';

function SystemDisplay({centralBody, plotSize, date}: {centralBody: CelestialBody, plotSize: number, date: number}) {
    return (
        <>
            <CentralBodySphere body={centralBody} plotSize={plotSize} />
            {centralBody.orbiters.map((orbiter, index) => 
                <OrbitingBodySphere key={index} body={orbiter} plotSize={plotSize} date={date} />    
            )}
        </>
    )
  }
  
  export default SystemDisplay