// import React from 'react';
// import { Canvas } from '@react-three/fiber';
// import { PerspectiveCamera, OrbitControls } from '@react-three/drei';

// function OrbitDisplay() {
//     return (
//         <Canvas frameloop='demand'>
//             {/* @ts-ignore  */}
//             <PerspectiveCamera makeDefault={true} fov={50} zoom={1}/>
//             <mesh>
//                 <ambientLight />
//                 <pointLight position={[0, 0, 0]} />
//                 <sphereGeometry args={[5,32,32]} />
//                 <meshStandardMaterial color="#E1DC59" />
//             </mesh>
//             <OrbitControls />
//         </Canvas>
//     );
// }

// export default React.memo(OrbitDisplay);

import React from 'react';
import { Canvas } from '@react-three/fiber';

import { OrthographicCamera, OrbitControls } from '@react-three/drei'

function OrbitDisplay() {

  return (
    <Canvas>
        {/* @ts-ignore */}
        <OrthographicCamera makeDefault position={[0, 0, 10]} zoom={40} />
            <mesh>
                <ambientLight />
                <pointLight position={[0, 0, 0]} />
                <sphereGeometry args={[1,32,32]} />
                <meshStandardMaterial color="#E1DC59" />
            </mesh>
        <OrbitControls />
    </Canvas>
  )
}

export default OrbitDisplay