import React, { useState, useEffect, useRef } from 'react';
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import DateField from './DateField';

import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrthographicCamera, OrbitControls } from '@react-three/drei'
import SystemDisplay from './Display/SystemDisplay';

import Kepler from '../main/libs/kepler';
import CelestialBody, { OrbitingBody } from '../main/objects/body';
import SolarSystem from '../main/objects/system';

import { normalize3, mult3, timeToCalendarDate } from '../main/libs/math';
import { makeDateFields, timeFromDateFieldState } from '../utils';

import { atom, useAtom } from 'jotai';
import { timeSettingsAtom } from '../App';

function getPlotSize(centralBody: CelestialBody) {
  return((centralBody.soi === undefined || centralBody.soi === null || centralBody.soi === Infinity) ? 
            centralBody.orbiters.length === 0 ? 
              centralBody.radius * 2 as number :
            2 * centralBody.furtherstOrbiterDistance as number :
          centralBody.soi as number);
}

function getSunLight(centralBody: CelestialBody, system: SolarSystem, date: number) {
  if(centralBody.name === system.sun.name) {
    return <pointLight position={[0, 0, 0] } intensity={2} />
  } else {
    const sunDirection = normalize3(Kepler.orbitToPositionAtDate((centralBody as OrbitingBody).orbit, date));
    return <directionalLight position={new THREE.Vector3(sunDirection.x, sunDirection.y, sunDirection.z)} intensity={2} />
  }
}

function OrbitDisplay({centralBody, startDate, system}: {centralBody: CelestialBody, startDate: number, system: SolarSystem}) {

  const [timeSettings] = useAtom(timeSettingsAtom);
  const timeSettingsRef = useRef(timeSettings);

  const [date, setDate] = useState(startDate);
  const dateRef = useRef(date);

  const dateFieldAtom = useRef(atom(makeDateFields(...Object.values(timeToCalendarDate(startDate, timeSettings, 1, 1))))).current;
  const [dateField, setDateField] = useAtom(dateFieldAtom);
  const dateFieldRef = useRef(dateField);

  const [updateFields, setUpdateFields] = useState(false);

  const [plotSize, setPlotSize] = useState(getPlotSize(centralBody));

  const [sunLight, setSunLight] = useState(getSunLight(centralBody, system, date));

      useEffect(() => {
        if((timeSettings === timeSettingsRef.current)) {
            const d = Math.ceil(startDate)
            setDate(d);
            dateRef.current = d;
            const calendarDate = timeToCalendarDate(d, timeSettings, 1, 1);
            setDateField(calendarDate);
            dateFieldRef.current = calendarDate;
            setPlotSize(getPlotSize(centralBody));
            setSunLight(getSunLight(centralBody, system, startDate));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startDate, centralBody, timeSettings]);

    useEffect(() => {
        if(dateField !== dateFieldRef.current) {
            dateFieldRef.current = dateField;
            const newDate = timeFromDateFieldState(dateField, timeSettings, 1, 1);
            setDate(newDate)
            setSunLight(getSunLight(centralBody, system, date));
        } else {
            dateRef.current = date;
            if(updateFields || (timeSettings !== timeSettingsRef.current)) {
                timeSettingsRef.current = timeSettings;
                setUpdateFields(false);
                const calendarDate = timeToCalendarDate(date, timeSettings, 1, 1);
                setDateField(calendarDate);
                dateFieldRef.current = calendarDate;
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [date, dateField, updateFields, timeSettings]);
  return (
    <Stack>
      <Canvas style={{height: '500px'}} >
          <OrthographicCamera makeDefault={true} position={[0,1,0]} zoom={750} />
              <mesh>
                <ambientLight intensity={0.1} />
                {sunLight}
              </mesh>
              <SystemDisplay centralBody={centralBody} plotSize={plotSize} date={date}/>

          <OrbitControls />
      </Canvas>
      <Box component="div" display="flex" alignItems="center" justifyContent="center" maxWidth="700px">
          <DateField id={'plot-date'} label={'Date'} calendarDateAtom={dateFieldAtom} correctFormat={true} variant="all"/>
      </Box>
    </Stack>
  )
}

export default OrbitDisplay