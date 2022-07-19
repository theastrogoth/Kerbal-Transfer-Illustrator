import React, { useState, useEffect, useRef } from 'react';
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from '@mui/material/Typography';
import Slider from '@mui/material/Slider';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import DateField from '../DateField';

import { Canvas } from '@react-three/fiber';

import CelestialBody from '../../main/objects/body';
import SolarSystem from '../../main/objects/system';

import { calendarDateToString, calendarDateToTime, clamp, timeToCalendarDate } from '../../main/libs/math';
import { makeDateFields, timeFromDateFieldState } from '../../utils';

import { atom, PrimitiveAtom, useAtom } from 'jotai';
import { timeSettingsAtom } from '../../App';
import OrbitPlot from './OrbitPlot';
import DisplayOptions from './DisplayOptions';
import WarpButtons from './WarpButtons';

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
  tabValue?:    number,
  infoItemAtom: PrimitiveAtom<InfoItem>,
}

function OrbitDisplay({tabValue = 0, centralBody, system, flightPlans=[], startDate=0, endDate=startDate + 9201600, slider=false, marks=[], infoItemAtom}: OrbitDisplayPropsWithInfo) {
  const sDate = Number.isFinite(startDate) && !isNaN(startDate) ? startDate : (
                Number.isFinite(endDate) && !isNaN(endDate) ? endDate : 0);
  const eDate = Number.isFinite(endDate) && !isNaN(endDate) ? endDate : (
                Number.isFinite(startDate) && !isNaN(startDate) ? startDate : 0);

  const [timeSettings] = useAtom(timeSettingsAtom);
  const timeSettingsRef = useRef(timeSettings);
  const [date, setDate] = useState(Math.ceil(sDate));
  const dateRef = useRef(date);
  const startDateRef = useRef(startDate);
  const dateFieldAtom = useRef(atom(makeDateFields(...Object.values(timeToCalendarDate(Math.ceil(sDate), timeSettings, 1, 1))))).current;
  const [dateField, setDateField] = useAtom(dateFieldAtom);
  const dateFieldRef = useRef(dateField);
  const [updateFields, setUpdateFields] = useState(false);

  const [optsOpen, setOptsOpen] = useState(false);

  const [speed, setSpeed] = useState(0);
  const speedRef = useRef(speed);
  const intervalRef = useRef<null | NodeJS.Timer>(null);
  const counterRef = useRef(0);
  const frameRate = useRef(60).current;                   // per second
  const frameDuration = useRef(1000/frameRate).current;   // ms
  const realTime = useRef(Date.now());
  const [dateFieldDisabled, setDateFieldDisabled] = useState(false);

  const handleWarp = () => {
      setDateField((prevDateField) => {
        const dateNow = Date.now();
        const interval = dateNow - realTime.current;
        realTime.current = dateNow;
        counterRef.current = counterRef.current + 1;
        const prevDate = calendarDateToTime(prevDateField, timeSettings, 1, 1);
        const newDate = prevDate + speedRef.current * interval / 1000;
        const newDateField = timeToCalendarDate(newDate, timeSettings, 1, 1)
        return newDateField;
      });
  }

  const startWarp = () => {
      if (intervalRef.current) return;
      realTime.current = Date.now();
      intervalRef.current = setInterval(() => {
          handleWarp();
      }, frameDuration);
      setDateFieldDisabled(true);
  };

  const stopWarp = () => {
      if (intervalRef.current) {
          clearInterval(intervalRef.current);
      }
      intervalRef.current = null;
      counterRef.current = 0;
      setDateFieldDisabled(false);
  };

  useEffect(() => {
    if((timeSettings === timeSettingsRef.current)) {
        if(startDate !== startDateRef.current) {
          const sDate = Number.isFinite(startDate) && !isNaN(startDate) ? startDate : (
                        Number.isFinite(endDate) && !isNaN(endDate) ? endDate : 0);
          const eDate = Number.isFinite(endDate) && !isNaN(endDate) ? endDate : (
                        Number.isFinite(startDate) && !isNaN(startDate) ? startDate : 0);
          startDateRef.current = startDate;
          const newDate = Math.ceil(clamp(date, sDate, eDate))
          setDate(newDate);
          dateRef.current = newDate;
          const calendarDate = timeToCalendarDate(newDate, timeSettings, 1, 1);
          setDateField(calendarDate);
          dateFieldRef.current = calendarDate;
        }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, timeSettings]);

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

  useEffect(() => {
    speedRef.current = speed;
  }, [speed])

  useEffect(() => {
    setSpeed(0);
    stopWarp();
  }, [tabValue])
  
  return (
    <Stack sx={{my: 1, mx: 1}} spacing={1} display="flex" alignItems="center" justifyContent="center">
      <Canvas style={{height: '500px'}} gl={{logarithmicDepthBuffer: true}} frameloop={'always'} shadows={true} >
        <OrbitPlot 
          centralBody={centralBody} 
          system={system} 
          date={date} 
          flightPlans={flightPlans}
          infoItemAtom={infoItemAtom}
        />
      </Canvas>
      <Typography>Click object for detailed info. Double-click to focus view.</Typography>
      <WarpButtons speed={speed} setSpeed={setSpeed} intervalRef={intervalRef} startWarp={startWarp} stopWarp={stopWarp} />
      { slider ? <Slider
        sx={{ width: "60%" }}
        valueLabelDisplay="auto"
        value={date}
        valueLabelFormat={(d: number) => calendarDateToString(timeToCalendarDate(d, timeSettings, 1, 1))}
        min={Math.ceil(sDate)}     
        max={Math.floor(eDate)}
        step={Math.max((eDate-sDate)/1000, 1)}
        marks={marks}
        disabled={dateFieldDisabled}
        /* @ts-ignore */
        onChange={(event) => setDate(Number(event.target.value)) }
        onChangeCommitted={() => { setUpdateFields(true) }}
      /> : <></> }
      <br/>
      <Box component="div" display="flex" alignItems="center" justifyContent="center" maxWidth="700px">
          <DateField id={'plot-date'} label={'Date'} calendarDateAtom={dateFieldAtom} correctFormat={true} variant="all" disabled={dateFieldDisabled}/>
      </Box>
      <Button 
          variant="text" 
          startIcon={optsOpen ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
          onClick={() => setOptsOpen(!optsOpen)}
      >
          Display Options
      </Button>
      <Collapse in={optsOpen} timeout="auto">
        <DisplayOptions />
      </Collapse>
    </Stack>
  )
}

export default OrbitDisplay;