import React from 'react';
import { Suspense } from 'react';

import CentralBodySphere from './CentralBodySphere';
import OrbitingBodySphere from './OrbitingBodySphere';

import CelestialBody from '../../main/objects/body';

function SystemDisplay({centralBody, plotSize, date, isSun = true}: {centralBody: CelestialBody, plotSize: number, date: number, isSun?: boolean}) {
    return (
        <Suspense fallback={null}>
            <CentralBodySphere body={centralBody} date={date} plotSize={plotSize} isSun={isSun} />
            {centralBody.orbiters.map((orbiter, index) => 
                <OrbitingBodySphere key={index} body={orbiter} plotSize={plotSize} date={date} />    
            )}
        </Suspense>
    )
  }
  
  export default SystemDisplay