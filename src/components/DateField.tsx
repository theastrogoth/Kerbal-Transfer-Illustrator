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
    error?:         boolean
}

function handleChange(setFunction: Function) {
    return (
        (event: React.ChangeEvent<HTMLInputElement>): void => {
            setFunction(event.target.value)
        }
    )
}

function DateField({id, label, state, required = false, error = false}: DateFieldProps) {
    const NumField = required ? RequiredNumberField : NumberField;
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