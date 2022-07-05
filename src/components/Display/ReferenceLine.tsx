import React, { useRef } from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei'

import { useAtom } from 'jotai';
import { displayOptionsAtom } from '../../App';

function ReferenceLine() {
    const [displayOptions] = useAtom(displayOptionsAtom);
    // const dists = useRef(linspace(0, -1, 20)).current;
    // const points = useRef<THREE.Vector3[]>(dists.map(dist => new THREE.Vector3(dist,0,0))).current;
    const points = useRef<THREE.Vector3[]>([new THREE.Vector3(0,0,0), new THREE.Vector3(-0.5,0,0)]).current;
    return ( displayOptions.referenceLine ? 
        <Line 
            points={points} 
            dashed={true} 
            lineWidth={2} 
            color='white' />
        : <></>
    )
}

export default ReferenceLine;