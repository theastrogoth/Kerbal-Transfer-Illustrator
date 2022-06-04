import React, { useState, useEffect, useRef } from "react";
import Stack from "@mui/material/Stack";
import RequiredNumberField, { NumberField } from "./NumberField";
import HourMinSecField from "./HourMinSecField";

import { PrimitiveAtom, useAtom } from "jotai";
import { timeSettingsAtom } from "../App";

type DateFieldProps = {
    id:                 string,
    label:              string,
    calendarDateAtom:  PrimitiveAtom<CalendarDate>,
    required?:          boolean,
    error?:             boolean,
    correctFormat?:     boolean,
    variant?:           "hour" | "hhmmss" | "all",
}

function handleChange(setFunction: Function) {
    return (
        (event: React.ChangeEvent<HTMLInputElement>): void => {
            setFunction(event.target.value)
        }
    )
}

function DateField({id, label, calendarDateAtom, required = false, error = false, correctFormat = false, variant = "hour"}: DateFieldProps) {
    const [calendarDate, setCalendarDate] = useAtom(calendarDateAtom);
    const calendarDateRef = useRef(calendarDate);

    const [year, setYear]       = useState(isNaN(calendarDate.year)   ? '' : String(calendarDate.year));
    const [day, setDay]         = useState(isNaN(calendarDate.day)    ? '' : String(calendarDate.day));
    const [hour, setHour]       = useState(isNaN(calendarDate.hour)   ? '' : String(calendarDate.hour));
    const [minute, setMinute]   = useState(isNaN(calendarDate.minute) ? '' : String(calendarDate.minute));
    const [second, setSecond]   = useState(isNaN(calendarDate.second) ? '' : String(calendarDate.second));

    const [timeSettings] = useAtom(timeSettingsAtom);
    const timeSettingsRef = useRef(timeSettings);
    
    const NumField = required ? RequiredNumberField : NumberField;
    const HourField =   variant === "hhmmss" ? <HourMinSecField
                                    hour={hour}
                                    setHour={setHour}
                                    minute={minute}
                                    setMinute={setMinute}
                                    second={second}
                                    setSecond={setSecond}
                                    error={error} /> :
                         variant === "hour" ? <NumField
                                    id={'hour-'+String(id)}
                                    label='Hour'
                                    type='number'
                                    step="1"
                                    value={hour} 
                                    error={error}    
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHour(e.target.value)} /> :
                        [
                            <NumField
                                key='hour'
                                id={'hour-'+String(id)}
                                label='Hour'
                                type='number'
                                step="1"
                                value={hour} 
                                error={error}    
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHour(e.target.value)} />,
                            <NumField
                                key='min'
                                id={'minute-'+String(id)}
                                label='Minute'
                                type='number'
                                step="1"
                                value={minute} 
                                error={error}    
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMinute(e.target.value)} />,
                            <NumField
                                key='sec'
                                id={'second-'+String(id)}
                                label='Second'
                                type='number'
                                step="1"
                                value={second} 
                                error={error}    
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSecond(e.target.value)} />,
                        ];

    useEffect(() => {
        if(timeSettings !== timeSettingsRef.current) {
            timeSettingsRef.current = timeSettings;
        } else {
            let newYear     = parseFloat(year);
            let newDay      = parseFloat(day);
            let newHour     = parseFloat(hour);
            let newMinute   = parseFloat(minute);
            let newSecond   = parseFloat(second);
            if(correctFormat) {
                newYear     = isNaN(newYear)   ? 0 : newYear;
                newDay      = isNaN(newDay)    ? 0 : newDay;
                newHour     = isNaN(newHour)   ? 0 : newHour;
                newMinute   = isNaN(newMinute) ? 0 : newMinute;
                newSecond   = isNaN(newSecond) ? 0 : newSecond;
    
                let changeYear      = false;
                let changeDay       = false;
                let changeHour      = false;
                let changeMinute    = false;
                let changeSecond    = false;
    
                // make sure all non-second values are integers
                if(newYear % 1 !== 0) {
                    newDay += (newYear % 1) * timeSettings.daysPerYear;
                    newYear = Math.floor(newYear);
                    changeDay = true;
                    changeYear = true;
                }
                if(newDay % 1 !== 0) {
                    newHour += (newDay % 1) * timeSettings.hoursPerDay;
                    newDay = Math.floor(newDay);
                    changeHour = true;
                    changeDay = true;
                }
                if(newHour % 1 !== 0) {
                    newMinute += (newHour % 1) * 60;
                    newHour = Math.floor(newHour);
                    changeMinute = true;
                    changeHour = true;
                }
                if(newMinute % 1 !== 0) {
                    newSecond += (newMinute % 1) * 60;
                    newMinute = Math.floor(newMinute);
                    changeSecond = true;
                    changeMinute = true;
                }
    
                // require standard time format (seconds between 0 and 60, etc)
                while(newSecond < 0) {
                    newMinute -= 1;
                    newSecond += 60;
                    changeSecond = true;
                    changeMinute = true;
                }
                while(newSecond >= 60) {
                    newMinute += 1;
                    newSecond -= 60;
                    changeSecond = true;
                    changeMinute = true;
                }
                while(newMinute < 0) {
                    newHour -= 1;
                    newMinute += 60;
                    changeMinute = true;
                    changeHour = true;
                }
                while(newMinute >= 60) {
                    newHour += 1;
                    newMinute -= 60;
                    changeMinute = true;
                    changeHour = true;
                }
                while(newHour < 0) {
                    newDay -= 1;
                    newHour += timeSettings.hoursPerDay;
                    changeHour = true;
                    changeDay = true;
                }
                while(newHour >= timeSettings.hoursPerDay) {
                    newDay += 1;
                    newHour -= timeSettings.hoursPerDay;
                    changeHour = true;
                    changeDay = true;
                }
                while(newDay < 0) {
                    newYear -= 1;
                    newDay += timeSettings.daysPerYear;
                    changeDay = true;
                    changeYear = true;
                }
                while(newDay >= timeSettings.daysPerYear) {
                    newYear += 1;
                    newDay -= timeSettings.daysPerYear;
                    changeDay = true;
                    changeYear = true;
                }
    
                if(changeYear)   { setYear(String(newYear)) };
                if(changeDay)    { setDay(String(newDay)) };
                if(changeHour)   { setHour(String(newHour)) };
                if(changeMinute) { setMinute(String(newMinute)) };
                if(changeSecond) { setSecond(String(newSecond)) };
            }
    
            setCalendarDate({year: newYear, day: newDay, hour: newHour, minute: newMinute, second: newSecond});
        }
    }, [year, day, hour, minute, second, timeSettings])

    useEffect(() => {
        if(calendarDateRef.current !== calendarDate) {
            calendarDateRef.current = calendarDate;
            setYear(isNaN(calendarDate.year) ? '' : String(calendarDate.year));
            setDay(isNaN(calendarDate.day) ? '' : String(calendarDate.day));
            setHour(isNaN(calendarDate.hour) ? '' : String(calendarDate.hour));
            setMinute(isNaN(calendarDate.minute) ? '' : String(calendarDate.minute));
            setSecond(isNaN(calendarDate.second) ? '' : String(calendarDate.second));
        }
    }, [calendarDate])

    return (
        <label>
            {label}
            <Stack spacing={0.5} direction="row">
                <NumField
                    id={'year-'+String(id)}
                    label='Year'
                    type='number'
                    step='any'
                    value={year}
                    error={error}    
                    onChange={handleChange(setYear)} />      
                <NumField
                    id={'day-'+String(id)}
                    label='Day'
                    type='number'
                    step='any'
                    value={day} 
                    error={error}    
                    onChange={handleChange(setDay)} />            
                {HourField}
            </Stack>
        </label>
    )
}

export default React.memo(DateField)