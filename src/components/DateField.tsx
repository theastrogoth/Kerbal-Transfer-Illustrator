import RequiredNumberField, { NumberField } from "./NumberField";

import React, { useEffect } from "react";
import Stack from "@mui/material/Stack";
import HourMinSecField from "./HourMinSecField";

export type DateFieldState = {
    year:       string,
    day:        string,
    sec:        string,
    setYear:    React.Dispatch<React.SetStateAction<string>>
    setDay:     React.Dispatch<React.SetStateAction<string>>
    setSec:     React.Dispatch<React.SetStateAction<string>>
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

function handleHourChange(setFunction: Function) {
    return (
        (event: React.ChangeEvent<HTMLInputElement>): void => {
            setFunction(String(3600 * Number(event.target.value)))
        }
    )
}

function DateField({id, label, state, required = false, error = false, correctFormat = false, hhmmss = false, timeSettings = {} as TimeSettings }: DateFieldProps) {
    
    const NumField = required ? RequiredNumberField : NumberField;
    const HourField = hhmmss ? <HourMinSecField
                                    sec={state.sec}
                                    setSec={state.setSec}
                                    error={error} /> :
                                <NumField
                                    id={'hour-'+String(id)}
                                    label='Hour'
                                    type='number'
                                    step="3600"
                                    value={String(Number(state.sec) /  3600)} 
                                    error={error}    
                                    onChange={handleHourChange(state.setSec)} />   ;

    useEffect(() => {
        if(correctFormat) {
            let newYear = Number(state.year);
            let newDay  = Number(state.day);
            let newSec = Number(state.sec);
            while(newSec < 0) {
                newDay -= 1;
                newSec += timeSettings.hoursPerDay * 3600;
            }
            while(newSec >= timeSettings.hoursPerDay * 3600) {
                newDay += 1;
                newSec -= timeSettings.hoursPerDay * 3600;
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
            state.setSec(String(newSec));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.year, state.day, state.sec])

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