import React, { useState, useEffect, useRef } from "react";
import Stack from "@mui/material/Stack";
import RequiredNumberField, { NumberField } from "./NumberField";
import HourMinSecField from "./HourMinSecField";

import { PrimitiveAtom, useAtom } from "jotai";
import { timeSettingsAtom } from "../App";
import { Typography } from "@mui/material";

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

    const alreadyUpdatedFields = useRef(false);
    
    const NumField = required ? RequiredNumberField : NumberField;
    const HourField =   variant === "hhmmss" ? <HourMinSecField
                                    hour={hour}
                                    setHour={setHour}
                                    minute={minute}
                                    setMinute={setMinute}
                                    second={second}
                                    setSecond={setSecond}
                                    error={error} 
                                /> :
                         variant === "hour" ? <NumField
                                    label='Hour'
                                    value={hour} 
                                    setValue={setHour}
                                    error={error}    
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHour(e.target.value)} 
                                    sx={{minWidth: "60px", maxWidth: "65px"}}
                                /> :
                        [
                            <NumField
                                key='hour'
                                label='Hour'
                                value={hour} 
                                setValue={setHour}
                                error={error}    
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHour(e.target.value)}
                                sx={{minWidth: "60px", maxWidth: "65px"}}
                            />,
                            <NumField
                                key='min'
                                label='Minute'
                                value={minute} 
                                setValue={setMinute}
                                error={error}    
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMinute(e.target.value)} 
                                sx={{minWidth: "60px", maxWidth: "65px"}}
                            />,
                            <NumField
                                key='sec'
                                label='Second'
                                value={second} 
                                setValue={setSecond}
                                error={error}    
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSecond(e.target.value)} 
                                sx={{minWidth: "60px", maxWidth: "78px"}}
                            />,
                        ];

    useEffect(() => {
        if(timeSettings !== timeSettingsRef.current) {
            timeSettingsRef.current = timeSettings;
        } else if(calendarDateRef.current !== calendarDate) {
            if(calendarDateRef.current !== calendarDate) {
                calendarDateRef.current = calendarDate;
                if(calendarDate.year !== Number(year)) {
                    setYear(isNaN(calendarDate.year) ? '' : String(calendarDate.year));
                }
                if(calendarDate.day !== Number(day)) {
                    setDay(isNaN(calendarDate.day) ? '' : String(calendarDate.day));
                }
                if(calendarDate.hour !== Number(hour)) {
                    setHour(isNaN(calendarDate.hour) ? '' : String(calendarDate.hour));
                }
                if(calendarDate.minute !== Number(minute)) {
                    setMinute(isNaN(calendarDate.minute) ? '' : String(calendarDate.minute));
                }
                if(calendarDate.second !== Number(second)) {
                    setSecond(isNaN(calendarDate.second) ? '' : String(calendarDate.second));
                }
            }
        } else if(!alreadyUpdatedFields.current) {
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

                if(!(changeYear || changeDay || changeHour || changeMinute || changeSecond)) {
                    setCalendarDate({year: newYear, day: newDay, hour: newHour, minute: newMinute, second: newSecond});
                } else {
                    alreadyUpdatedFields.current = true;
                }
            } else {
                setCalendarDate({year: newYear, day: newDay, hour: newHour, minute: newMinute, second: newSecond});
            }
        } else {
            setCalendarDate({year: Number(year), day: Number(day), hour: Number(hour), minute: Number(minute), second: Number(second)});
            alreadyUpdatedFields.current = false;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [year, day, hour, minute, second, timeSettings, calendarDate])

    return (
        <Stack spacing={1} direction="column">
            <Typography>
                {label}
            </Typography>
            <Stack spacing={0} direction="row" flexWrap="wrap" sx={{justifyContent: 'left'}} >
                <NumField
                    label='Year'
                    value={year}
                    setValue={setYear}
                    error={error}    
                    onChange={handleChange(setYear)} 
                    sx={{minWidth: "60px", maxWidth: "65px"}}
                />      
                <NumField
                    label='Day'
                    value={day} 
                    setValue={setDay}
                    error={error}    
                    onChange={handleChange(setDay)} 
                    sx={{minWidth: "60px", maxWidth: "65px"}}
                />            
                {HourField}
            </Stack>
        </Stack>
    )
}

export default React.memo(DateField)