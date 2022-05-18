import React, { useEffect, useState } from "react";
import Stack from "@mui/material/Stack";
import RequiredNumberField from "../NumberField"
import { timeFromDateFieldState, useDateField } from "../../utils";
import DateField from "../DateField";
import { timeToCalendarDate } from "../../main/libs/math";

type ManeuverControlsState = {
    idx:                number,
    defaultUT:          number,
    maneuvers:          ManeuverComponents[],
    setManeuvers:       React.Dispatch<React.SetStateAction<ManeuverComponents[]>>,
    copiedManeuver:     ManeuverComponents,
    timeSettings:       TimeSettings,
}

function handleChange(setFunction: Function) {
    return (
        (event: React.ChangeEvent<HTMLInputElement>): void => {
            setFunction(event.target.value)
        }
    )
}

function ManeuverControls({idx, maneuvers, setManeuvers, copiedManeuver, timeSettings}: ManeuverControlsState) {
    const [prograde, setPrograde] = useState('0');
    const [normal,   setNormal]   = useState('0');
    const [radial,   setRadial]   = useState('0');
    const [UT,       setUT]       = useState(String(maneuvers[idx].date));
    
    const secsPerDay = timeSettings.hoursPerDay * 3600;
    const secsPerYear = timeSettings.daysPerYear * secsPerDay;
    const dateField = useDateField(String(Math.floor(maneuvers[idx].date / secsPerYear)), String(Math.floor(maneuvers[idx].date % secsPerYear)), String(maneuvers[idx].date % secsPerDay))

    useEffect(() => {
        const newDate = timeFromDateFieldState(dateField, timeSettings, 1, 1);
        if(Number(UT) !== newDate) {
            setUT(String(newDate));
        }
    }, [dateField])

    useEffect(() => {
        const oldDate = timeFromDateFieldState(dateField, timeSettings, 1, 1);
        const numUT = Number(UT)
        if(numUT !== oldDate) {
            const calendarDate = timeToCalendarDate(numUT, timeSettings, 1, 1);
            const hours = calendarDate.hour * 3600 + calendarDate.minute * 60 + calendarDate.second;
            dateField.setYear(String(calendarDate.year));
            dateField.setDay(String(calendarDate.day));
            dateField.setHour(String(hours));
        }
    }, [UT])

    useEffect(() => {
        const newManeuvers = [...maneuvers];
        newManeuvers[idx] = {prograde: Number(prograde), normal: Number(normal), radial: Number(radial), date: Number(UT)}
        setManeuvers(newManeuvers);
    }, [prograde, normal, radial, UT])

    return (
        <Stack spacing={1.5}>
            <RequiredNumberField
                id={'prograde'}
                label='Prograde (m/s)' 
                value={prograde}
                onChange={handleChange(setPrograde)}
                sx={{ fullWidth: true }}/>
            <RequiredNumberField
                id={'normal'}
                label='Normal (m/s)' 
                value={normal}
                onChange={handleChange(setNormal)}
                sx={{ fullWidth: true }} />
            <RequiredNumberField
                id={'radial'}
                label={'Radial (m/s)'} 
                value={radial}
                onChange={handleChange(handleChange(setRadial))}
                sx={{ fullWidth: true }} />
            <RequiredNumberField
                id={'UT'}
                label={'UT (s)'} 
                value={UT}
                onChange={handleChange(setUT)}
                sx={{ fullWidth: true }} />
            <DateField 
                id={String(idx)}
                label={'Date'}
                state={dateField}
                correctFormat={true}
                hhmmss={true} />
        </Stack>
    );
}

export default ManeuverControls;