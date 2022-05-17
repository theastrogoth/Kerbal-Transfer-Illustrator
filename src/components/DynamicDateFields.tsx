import RequiredNumberField, { NumberField } from "./NumberField";

import React, { useEffect, useState } from "react";
import Stack from "@mui/material/Stack";

export type DynamicDateFieldState = {
    years:     string[],
    days:      string[],
    hours:     string[],
    setYears:  React.Dispatch<React.SetStateAction<string[]>>
    setDays:   React.Dispatch<React.SetStateAction<string[]>>
    setHours:  React.Dispatch<React.SetStateAction<string[]>>
}

type DynamicDateFieldsProps = {
    labelFun:       (idx: number) => string,
    state:          DynamicDateFieldState,
    required?:      boolean,
    errors?:        boolean[],
}

function handleChange(setFunction: React.Dispatch<React.SetStateAction<string>>) {
    return (
        (event: React.ChangeEvent<HTMLInputElement>): void => {
            setFunction(event.target.value)
        }
    )
}

function DynamicDateField({id, label, state, required = false, error = false}: {id: number, label: string, state: DynamicDateFieldState, required: boolean, error: boolean}) {
    
    const [y, setY] = useState(state.years[id]);
    const [d, setD] = useState(state.days[id]);
    const [h, setH] = useState(state.hours[id]);

    useEffect(() => {
        const newYears = state.years.slice();
        newYears[id] = y;
        state.setYears(newYears)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [y])
    useEffect(() => {
        const newDays = state.days.slice();
        newDays[id] = d;
        state.setDays(newDays)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [d])
    useEffect(() => {
        const newHours = state.hours.slice();
        newHours[id] = h;
        state.setHours(newHours)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [h])

    const NumField = required ? RequiredNumberField : NumberField; 
    return (
        <label>
            {label}
            <Stack spacing={2} direction="row">
                <NumField
                    id={'year-'+String(id)}
                    label='Year'
                    type='number'
                    value={state.years[id]}
                    error={error}
                    onChange={handleChange(setY)} />            
                <NumField
                    id={'day-'+String(id)}
                    label='Day'
                    type='number'
                    value={state.days[id]} 
                    error={error}
                    onChange={handleChange(setD)} />            
                <NumField
                    id={'hour-'+String(id)}
                    label='Hour'
                    type='number'
                    value={state.hours[id]}
                    error={error}
                    onChange={handleChange(setH)}  />
            </Stack>
        </label>
    )
}

function DynamicDateFields({labelFun, state, required = false, errors = state.years.map(y => false)}: DynamicDateFieldsProps) {
    const idxs = Array.from(state.years.keys());
    return (
        <>
            {idxs.map(idx => <DynamicDateField key={idx} id={idx} label={labelFun(idx)} state={state} required={required} error={errors[idx]}/>)}
        </>
    )
}

export default DynamicDateFields;