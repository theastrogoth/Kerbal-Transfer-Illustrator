import React, { useState, useEffect, useRef } from 'react';
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from '@mui/material/Typography';
import Slider from '@mui/material/Slider';
import DateField from '../DateField';

import { Canvas } from '@react-three/fiber';

import CelestialBody from '../../main/objects/body';
import SolarSystem from '../../main/objects/system';

import { calendarDateToString, timeToCalendarDate } from '../../main/libs/math';
import { makeDateFields, timeFromDateFieldState } from '../../utils';

import { atom, useAtom } from 'jotai';
import { timeSettingsAtom } from '../../App';
import OrbitPlot from './OrbitPlot';

export type OrbitDisplayProps = {
  label:              string,
  index:              number,
  centralBody:        CelestialBody,
  system:             SolarSystem,
  flightPlans?:       FlightPlan[],
  startDate?:         number,
  endDate?:           number,
  slider?:            boolean,
  marks?:             {value: number, label: string}[],
}

interface OrbitDisplayPropsWithInfo extends OrbitDisplayProps {
  infoItem:     InfoItem,
  setInfoItem:  React.Dispatch<React.SetStateAction<InfoItem>>,
}

function OrbitDisplay({centralBody, system, flightPlans=[], startDate=0, endDate=startDate + 9201600, slider=false, marks=[], setInfoItem}: OrbitDisplayPropsWithInfo) {
  
  const [timeSettings] = useAtom(timeSettingsAtom);
  const timeSettingsRef = useRef(timeSettings);
  const [date, setDate] = useState(startDate);
  const dateRef = useRef(date);
  const startDateRef = useRef(startDate);
  const dateFieldAtom = useRef(atom(makeDateFields(...Object.values(timeToCalendarDate(startDate, timeSettings, 1, 1))))).current;
  const [dateField, setDateField] = useAtom(dateFieldAtom);
  const dateFieldRef = useRef(dateField);
  const [updateFields, setUpdateFields] = useState(false);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, timeSettings]);

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
    <Stack sx={{my: 1, mx: 1}} spacing={1} display="flex" alignItems="center" justifyContent="center">
      <Canvas style={{height: '500px'}} gl={{logarithmicDepthBuffer: true}} frameloop={'always'}>
        <OrbitPlot 
          centralBody={centralBody} 
          system={system} 
          date={date} 
          flightPlans={flightPlans}
          setInfoItem={setInfoItem}
        />
      </Canvas>
      <Typography>Click object for detailed info. Double-click to focus view.</Typography>
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
      <br/>
      <Box component="div" display="flex" alignItems="center" justifyContent="center" maxWidth="700px">
          <DateField id={'plot-date'} label={'Date'} calendarDateAtom={dateFieldAtom} correctFormat={true} variant="all"/>
      </Box>
    </Stack>
  )
}

export default OrbitDisplay;