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
    calendarDateAtom:   PrimitiveAtom<CalendarDate>,
    required?:          boolean,
    error?:             boolean,
    correctFormat?:     boolean,
    variant?:           "hour" | "hhmmss" | "all",
    disabled?:          boolean,
}

function DateField({id, label, calendarDateAtom, required = false, error = false, correctFormat = false, variant = "hour", disabled = false}: DateFieldProps) {
    const [calendarDate, setCalendarDate] = useAtom(calendarDateAtom);
    const calendarDateRef = useRef(calendarDate);

    const [year, setYear]       = useState(isNaN(calendarDate.year)   ? undefined : calendarDate.year);
    const [day, setDay]         = useState(isNaN(calendarDate.day)    ? undefined : calendarDate.day);
    const [hour, setHour]       = useState(isNaN(calendarDate.hour)   ? undefined : calendarDate.hour);
    const [minute, setMinute]   = useState(isNaN(calendarDate.minute) ? undefined : calendarDate.minute);
    const [second, setSecond]   = useState(isNaN(calendarDate.second) ? undefined : calendarDate.second);

    const [timeSettings] = useAtom(timeSettingsAtom);
    const timeSettingsRef = useRef(timeSettings);

    const alreadyUpdatedFields = useRef(false);
    
    const NumField = required ? RequiredNumberField : NumberField;
    const HourField =   variant === "hhmmss" ? <HourMinSecField
                                    hour={hour || 0}
                                    setHour={setHour}
                                    minute={minute || 0}
                                    setMinute={setMinute}
                                    second={second || 0}
                                    setSecond={setSecond}
                                    error={error} 
                                    disabled={disabled}
                                /> :
                         variant === "hour" ? <NumField
                                    label='Hour'
                                    value={hour} 
                                    setValue={setHour}
                                    error={error}    
                                    sx={{minWidth: "55px", maxWidth: "55px"}}
                                    disabled={disabled}
                                /> :
                        [
                            <NumField
                                key='hour'
                                label='Hour'
                                value={hour} 
                                setValue={setHour}
                                error={error}    
                                sx={{minWidth: "55px", maxWidth: "55px"}}
                                disabled={disabled}
                            />,
                            <NumField
                                key='min'
                                label='Min'
                                value={minute} 
                                setValue={setMinute}
                                error={error}    
                                sx={{minWidth: "55px", maxWidth: "55px"}}
                                disabled={disabled}
                            />,
                            <NumField
                                key='sec'
                                label='Sec'
                                value={second} 
                                setValue={setSecond}
                                error={error}    
                                sx={{minWidth: "55px", maxWidth: "65px"}}
                                disabled={disabled}
                            />,
                        ];

    useEffect(() => {
        if(timeSettings !== timeSettingsRef.current) {
            timeSettingsRef.current = timeSettings;
        } else if(calendarDateRef.current !== calendarDate) {
            if(calendarDateRef.current !== calendarDate) {
                calendarDateRef.current = calendarDate;
                if(calendarDate.year !== year) {
                    setYear(calendarDate.year);
                }
                if(calendarDate.day !== day) {
                    setDay(calendarDate.day);
                }
                if(calendarDate.hour !== hour) {
                    setHour(calendarDate.hour);
                }
                if(calendarDate.minute !== minute) {
                    setMinute(calendarDate.minute);
                }
                if(calendarDate.second !== second) {
                    setSecond(calendarDate.second);
                }
            }
        } else if(!alreadyUpdatedFields.current) {
            let newYear     = year;
            let newDay      = day;
            let newHour     = hour;
            let newMinute   = minute;
            let newSecond   = second;
            if(correctFormat) {
                newYear     = (newYear   === undefined || isNaN(newYear))   ? 0 : newYear;
                newDay      = (newDay    === undefined || isNaN(newDay))    ? 0 : newDay;
                newHour     = (newHour   === undefined || isNaN(newHour))   ? 0 : newHour;
                newMinute   = (newMinute === undefined || isNaN(newMinute)) ? 0 : newMinute;
                newSecond   = (newSecond === undefined || isNaN(newSecond)) ? 0 : newSecond;
    
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
    
                if(changeYear)   { setYear(newYear) };
                if(changeDay)    { setDay(newDay) };
                if(changeHour)   { setHour(newHour) };
                if(changeMinute) { setMinute(newMinute) };
                if(changeSecond) { setSecond(newSecond) };

                if(!(changeYear || changeDay || changeHour || changeMinute || changeSecond)) {
                    setCalendarDate({year: newYear, day: newDay, hour: newHour, minute: newMinute, second: newSecond});
                } else {
                    alreadyUpdatedFields.current = true;
                }
            } else {
                setCalendarDate({
                    year: year === undefined ? NaN : year, 
                    day: day === undefined ? NaN : day, 
                    hour: hour === undefined ? NaN : hour, 
                    minute: minute === undefined ? NaN : minute, 
                    second: second === undefined ? NaN : second});
            }
        } else {
            setCalendarDate({
                year: year === undefined ? NaN : year, 
                day: day === undefined ? NaN : day, 
                hour: hour === undefined ? NaN : hour, 
                minute: minute === undefined ? NaN : minute, 
                second: second === undefined ? NaN : second});
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
                    sx={{minWidth: "55px", maxWidth: "55px"}}
                    disabled={disabled}
                />      
                <NumField
                    label='Day'
                    value={day} 
                    setValue={setDay}
                    error={error}    
                    sx={{minWidth: "55px", maxWidth: "55px"}}
                    disabled={disabled}
                />            
                {HourField}
            </Stack>
        </Stack>
    )
}

export default React.memo(DateField)