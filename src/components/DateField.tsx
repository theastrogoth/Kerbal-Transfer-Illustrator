import RequiredNumberField, { NumberField } from "./NumberField";

import React, { useEffect } from "react";
import Stack from "@mui/material/Stack";
import HourMinSecField from "./HourMinSecField";

export type DateFieldState = {
    year:       string,
    day:        string,
    hour:        string,
    setYear:    React.Dispatch<React.SetStateAction<string>>
    setDay:     React.Dispatch<React.SetStateAction<string>>
    setHour:     React.Dispatch<React.SetStateAction<string>>
}

type DateFieldProps = {
    id:             string,
    label:          string,
    state:          DateFieldState,
    required?:      boolean,
    error?:         boolean,
    correctFormat?: boolean,
    hhmmss?:        boolean,
    timeSettings?:  TimeSettings,
}

function handleChange(setFunction: Function) {
    return (
        (event: React.ChangeEvent<HTMLInputElement>): void => {
            setFunction(event.target.value)
        }
    )
}

function DateField({id, label, state, required = false, error = false, correctFormat = false, hhmmss = false, timeSettings = {} as TimeSettings }: DateFieldProps) {
    
    const NumField = required ? RequiredNumberField : NumberField;
    const HourField = hhmmss ? <HourMinSecField
                                    hour={state.hour}
                                    setHour={state.setHour}
                                    error={error} /> :
                                <NumField
                                    id={'hour-'+String(id)}
                                    label='Hour'
                                    type='number'
                                    step="1"
                                    value={state.hour} 
                                    error={error}    
                                    onChange={handleChange(state.setHour)} />   ;

    useEffect(() => {
        if(correctFormat) {
            let newYear = Number(state.year);
            let newDay  = Number(state.day);
            let newHour = Number(state.hour);
            let changeYear = false;
            let changeDay = false;
            let changeHour = false;
            if(newYear % 1 !== 0) {
                newDay += (newYear % 1) * timeSettings.daysPerYear;
                newYear = Math.floor(newYear);
                changeYear = true;
            }
            if(newDay % 1 !== 0) {
                newHour += (newDay % 1) * timeSettings.hoursPerDay;
                newDay = Math.floor(newDay);
                changeDay = true;
            }
            while(newHour < 0) {
                newDay -= 1;
                newHour += timeSettings.hoursPerDay;
                changeHour = true;
            }
            while(newHour >= timeSettings.hoursPerDay) {
                newDay += 1;
                newHour -= timeSettings.hoursPerDay;
                changeHour = true;
            }
            while(newDay < 0) {
                newYear -= 1;
                newDay += timeSettings.daysPerYear;
                changeDay = true;
            }
            while(newDay >= timeSettings.daysPerYear) {
                newYear += 1;
                newDay -= timeSettings.daysPerYear;
                changeDay = true;
            }

            if(changeYear) { state.setYear(String(newYear)) };
            if(changeDay) { state.setDay(String(newDay)) };
            if(changeHour) { state.setHour(String(newHour)) };
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.year, state.day, state.hour])

    return (
        <label>
            {label}
            <Stack spacing={0.5} direction="row">
                <NumField
                    id={'year-'+String(id)}
                    label='Year'
                    type='number'
                    step='any'
                    value={state.year}
                    error={error}    
                    onChange={handleChange(state.setYear)} />      
                <NumField
                    id={'day-'+String(id)}
                    label='Day'
                    type='number'
                    step='any'
                    value={state.day} 
                    error={error}    
                    onChange={handleChange(state.setDay)} />            
                {HourField}
            </Stack>
        </label>
    )
}

export default React.memo(DateField)