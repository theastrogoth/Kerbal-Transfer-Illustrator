import RequiredNumberField, { NumberField } from "./NumberField";

import React, { useState, useEffect } from "react";
import Stack from "@mui/material/Stack";
import { timeFromDateFieldState } from "../utils";

export type DateFieldState = {
    year:     string,
    day:      string,
    hour:     string,
    setYear:  React.Dispatch<React.SetStateAction<string>>
    setDay:   React.Dispatch<React.SetStateAction<string>>
    setHour:  React.Dispatch<React.SetStateAction<string>>
}

type DateFieldProps = {
    id:             string,
    label:          string,
    state:          DateFieldState,
    required?:      boolean,
    error?:         boolean,
    correctFormat?: boolean,
    timeSettings?:  TimeSettings,
}

function handleChange(setFunction: Function) {
    return (
        (event: React.ChangeEvent<HTMLInputElement>): void => {
            setFunction(event.target.value)
        }
    )
}

function DateField({id, label, state, required = false, error = false, correctFormat = false, timeSettings = {} as TimeSettings }: DateFieldProps) {
    const NumField = required ? RequiredNumberField : NumberField;

    useEffect(() => {
        if(correctFormat) {
            let newYear = Number(state.year);
            let newDay  = Number(state.day);
            let newHour = Number(state.hour);
            while(newHour < 0) {
                newDay -= 1;
                newHour += timeSettings.hoursPerDay;
            }
            while(newHour >= timeSettings.hoursPerDay) {
                newDay += 1;
                newHour -= timeSettings.hoursPerDay;
            }
            while(newDay < 0) {
                newYear -= 1;
                newDay += timeSettings.daysPerYear
            }
            while(newDay >= timeSettings.daysPerYear) {
                newYear += 1;
                newDay -= timeSettings.daysPerYear
            }
            state.setYear(String(newYear));
            state.setDay(String(newDay));
            state.setHour(String(newHour));
        }
    }, [state.year, state.day, state.hour])

    return (
        <label>
            {label}
            <Stack spacing={2} direction="row">
                <NumField
                    id={'year-'+String(id)}
                    label='Year'
                    type='number'
                    value={state.year}
                    error={error}    
                    onChange={handleChange(state.setYear)} />      
                <NumField
                    id={'day-'+String(id)}
                    label='Day'
                    type='number'
                    value={state.day} 
                    error={error}    
                    onChange={handleChange(state.setDay)} />            
                <NumField
                    id={'hour-'+String(id)}
                    label='Hour'
                    type='number'
                    value={state.hour}
                    error={error}    
                    onChange={handleChange(state.setHour)}  />
            </Stack>
        </label>
    )
}

export default React.memo(DateField)