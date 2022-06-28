import React, { useState, useEffect, useRef } from 'react';
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Slider from '@mui/material/Slider';
import DateField from './DateField';

import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei'
import SystemDisplay from './Display/SystemDisplay';

import CelestialBody from '../main/objects/body';
import SolarSystem from '../main/objects/system';

import { calendarDateToString, timeToCalendarDate } from '../main/libs/math';
import { makeDateFields, timeFromDateFieldState } from '../utils';

import { atom, useAtom } from 'jotai';
import { timeSettingsAtom } from '../App';
import TrajectoryDisplay from './Display/TrajectoryDisplay';

export type OrbitDisplayProps = {
  label:              string,
  index:              number,
  centralBody:        CelestialBody,
  system:             SolarSystem,
  startDate?:         number,
  endDate?:           number,
  trajectories?:      Trajectory[],
  trajectoryNames?:   string[],
  trajectoryColors?:  IColor[],
  trajectoryIcons?:   TrajectoryIconInfo[],
  slider?:            boolean,
  marks?:             {value: number, label: string}[],
}

interface OrbitDisplayPropsWithSetInfo extends OrbitDisplayProps {
  infoItem:     InfoItem,
  setInfoItem:  React.Dispatch<React.SetStateAction<InfoItem>>,
}

function getPlotSize(centralBody: CelestialBody) {
  return((centralBody.soi === undefined || centralBody.soi === null || centralBody.soi === Infinity) ? 
            centralBody.orbiters.length === 0 ? 
              centralBody.radius * 2 as number :
            2 * centralBody.furtherstOrbiterDistance as number :
          centralBody.soi as number);
}

function OrbitDisplay({centralBody, system, startDate=0, endDate=startDate + 9201600, trajectories=[], trajectoryNames=[], trajectoryColors=[], trajectoryIcons=[], slider=false, marks=[], infoItem, setInfoItem}: OrbitDisplayPropsWithSetInfo) {
  
  const [timeSettings] = useAtom(timeSettingsAtom);
  const timeSettingsRef = useRef(timeSettings);
  const [date, setDate] = useState(startDate);
  const dateRef = useRef(date);
  const startDateRef = useRef(startDate);
  const dateFieldAtom = useRef(atom(makeDateFields(...Object.values(timeToCalendarDate(startDate, timeSettings, 1, 1))))).current;
  const [dateField, setDateField] = useAtom(dateFieldAtom);
  const dateFieldRef = useRef(dateField);
  const [updateFields, setUpdateFields] = useState(false);

  const [plotSize, setPlotSize] = useState(getPlotSize(centralBody) / 10);

  useEffect(() => {
    if((timeSettings === timeSettingsRef.current)) {
        if(startDate !== startDateRef.current) {
          startDateRef.current = startDate;
          setDate(startDate);
          dateRef.current = startDate;
          const calendarDate = timeToCalendarDate(startDate, timeSettings, 1, 1);
          setDateField(calendarDate);
          dateFieldRef.current = calendarDate;
        }
    }
    setPlotSize(getPlotSize(centralBody));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, centralBody, timeSettings]);

  useEffect(() => {
      if(dateField !== dateFieldRef.current) {
        dateFieldRef.current = dateField;
        const newDate = timeFromDateFieldState(dateField, timeSettings, 1, 1);
        setDate(newDate)
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
    <Stack sx={{my: 1, mx: 1}} spacing={4} display="flex" alignItems="center" justifyContent="center">
      <Canvas style={{height: '500px'}} >
        <color attach="background" args={[0.07, 0.07, 0.07]} />
        <PerspectiveCamera makeDefault={true} position={[0,1,0]} zoom={1} near={1e-3} />
        <SystemDisplay centralBody={centralBody} system={system} plotSize={plotSize} date={date} isSun={centralBody.name === system.sun.name} setInfoItem={setInfoItem}/>
        {trajectories.map((traj, index) => 
          <TrajectoryDisplay 
            key={index} 
            trajectory={traj} 
            system={system}
            date={date}
            plotSize={plotSize}
            name={trajectoryNames[index]}
            color={trajectoryColors[index]}
            icons={trajectoryIcons[index]}
            infoItem={infoItem}
            setInfoItem={setInfoItem}
          />)}
        <OrbitControls rotateSpeed={0.5} />
      </Canvas>

      { slider ? <Slider
        sx={{ width: "60%" }}
        valueLabelDisplay="auto"
        value={date}
        valueLabelFormat={(d: number) => calendarDateToString(timeToCalendarDate(d, timeSettings, 1, 1))}
        min={Math.ceil(startDate)}     
        max={Math.floor(endDate)}
        step={Math.max((endDate-startDate)/1000, 1)}
        marks={marks}
        /* @ts-ignore */
        onChange={(event) => setDate(Number(event.target.value)) }
        onChangeCommitted={() => { setUpdateFields(true) }}
      /> : <></> }
      <Box component="div" display="flex" alignItems="center" justifyContent="center" maxWidth="700px">
          <DateField id={'plot-date'} label={'Date'} calendarDateAtom={dateFieldAtom} correctFormat={true} variant="all"/>
      </Box>
    </Stack>
  )
}

export default OrbitDisplay;