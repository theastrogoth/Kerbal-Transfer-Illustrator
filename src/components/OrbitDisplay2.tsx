import React from 'react';
import { Canvas } from '@react-three/fiber';

import { OrthographicCamera, OrbitControls } from '@react-three/drei'
import SystemDisplay from './Display/SystemDisplay';
import CelestialBody from '../main/objects/body';

function OrbitDisplay({centralBody, date}: {centralBody: CelestialBody, date: number}) {
  const plotSize = (centralBody.soi === undefined || centralBody.soi === null || centralBody.soi === Infinity) ? 
                      centralBody.orbiters.length === 0 ? 
                        centralBody.radius * 2 :
                      2 * centralBody.furtherstOrbiterDistance :
                    centralBody.soi;
  return (
    <Canvas style={{height: '500px'}} >
        <OrthographicCamera makeDefault={true} position={[0,1,0]} zoom={750} />
            <mesh>
              <ambientLight intensity={0.25} />
              <pointLight position={[0, 0, 0]} />
            </mesh>
            <SystemDisplay centralBody={centralBody} plotSize={plotSize} date={date}/>

        <OrbitControls />
    </Canvas>
  )
}

export default OrbitDisplay