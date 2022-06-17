import React from 'react';
import CelestialBody from '../../main/objects/body';

function CentralBody({body}: {body: CelestialBody}) {

    return (
        <sphereGeometry args={[1,32,32]} />
    )
  }
  
  export default CentralBody