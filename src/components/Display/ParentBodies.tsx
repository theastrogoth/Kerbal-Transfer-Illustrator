import React, { useEffect, useState, useRef } from 'react';

import CelestialBody, { OrbitingBody } from '../../main/objects/body';
import SolarSystem from '../../main/objects/system';
import Kepler from '../../main/libs/kepler';
import { mult3, sub3 } from '../../main/libs/math';
import BodySphere from './BodySphere';

function getParentPositions(parentBodies: CelestialBody[], system: SolarSystem, date: number) {
    const positions: Vector3[] = [];
    for(let i=0; i<parentBodies.length-1; i++) {
        positions.push(Kepler.orbitToPositionAtDate((parentBodies[i] as OrbitingBody).orbit, date))
    }
    return positions;
}

function getRelativePositions(bodyPosition: Vector3, parentPositions: Vector3[]) {
    const relativePositions = [mult3(bodyPosition, -1)];
    for(let i=0; i<parentPositions.length; i++) {
        relativePositions.push(sub3(relativePositions[i], parentPositions[i]))
    }
    return relativePositions;
}

function ParentBodies({centralBody, system, date, plotSize, setInfoItem}: {centralBody: OrbitingBody, system: SolarSystem, date: number, plotSize: number, setInfoItem: React.Dispatch<React.SetStateAction<InfoItem>>}) {
    const parentIdxs = useRef(system.sequenceToSun(centralBody.id).slice(1))
    const [parentBodies, setParentBodies] = useState(parentIdxs.current.map(idx => system.bodyFromId(idx)))
    const bodyPosition = Kepler.orbitToPositionAtDate(centralBody.orbit, date);
    const parentPositions = getParentPositions(parentBodies, system, date)
    const relativePositions = getRelativePositions(bodyPosition, parentPositions)
    useEffect(() => {
        parentIdxs.current = system.sequenceToSun(centralBody.id).slice(1);
        setParentBodies(parentIdxs.current.map(idx => system.bodyFromId(idx)));
    }, [centralBody, system])
    console.log(parentBodies.map(bd => bd.name), relativePositions)
    return ( 
    <>
        { parentBodies.map((bd, i) =>
            <BodySphere 
                body={bd} 
                system={system} 
                date={date} 
                plotSize={plotSize}
                depth={-1}
                isSun={i === parentBodies.length-1}
                centeredAt={relativePositions[i]}
                setInfoItem={setInfoItem}
                setTarget={(() => {})}
            />
        )}
    </>
    )
}

export default React.memo(ParentBodies);