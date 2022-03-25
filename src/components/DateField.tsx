import RequiredNumberField, { NumberField } from "./NumberField";

import React from "react";
import Stack from "@mui/material/Stack";

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
}

function DateField({id, label, state, required = false}: DateFieldProps) {

    function handleChange(setFunction: Function) {
        return (
            (event: React.ChangeEvent<HTMLInputElement>): void => {
                setFunction(event.target.value)
            }
        )
    }

    if(required) {
        return (
            <label>
                {label}
                <Stack spacing={2} direction="row">
                    <RequiredNumberField
                        id={'year-'+String(id)}
                        label='Year'
                        type='number'
                        value={state.year}
                        onChange={handleChange(state.setYear)} />            
                    <RequiredNumberField
                        id={'day-'+String(id)}
                        label='Day'
                        type='number'
                        value={state.day} 
                        onChange={handleChange(state.setDay)} />            
                    <RequiredNumberField
                        id={'hour-'+String(id)}
                        label='Hour'
                        type='number'
                        value={state.hour}
                        onChange={handleChange(state.setHour)}  />
                </Stack>
            </label>
        )
    } else {
        return (
            <label>
                {label}
                <Stack spacing={2} direction="row">
                    <NumberField
                        id={'year-'+String(id)}
                        label='Year'
                        type='number'
                        value={state.year}
                        onChange={handleChange(state.setYear)} />            
                    <NumberField
                        id={'day-'+String(id)}
                        label='Day'
                        type='number'
                        value={state.day} 
                        onChange={handleChange(state.setDay)} />             
                    <NumberField
                        id={'hour-'+String(id)}
                        label='Hour'
                        type='number'
                        value={state.hour}
                        onChange={handleChange(state.setHour)}  />
                </Stack>
            </label>
        )
    }
}

export default React.memo(DateField, (prevProps, nextProps) => prevProps.state === nextProps.state)