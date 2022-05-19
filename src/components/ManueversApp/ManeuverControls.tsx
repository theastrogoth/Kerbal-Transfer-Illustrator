import React, { useEffect, useState } from "react";
import Stack from "@mui/material/Stack";
import RequiredNumberField from "../NumberField"
import { timeFromDateFieldState, useDateField } from "../../utils";
import DateField from "../DateField";
import { timeToCalendarDate } from "../../main/libs/math";
import Typography from "@mui/material/Typography";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import { Box } from "@mui/system";

type ManeuverControlsState = {
    idx:                number,
    maneuvers:          ManeuverComponents[],
    setManeuvers:       React.Dispatch<React.SetStateAction<ManeuverComponents[]>>,
    copiedManeuver:     ManeuverComponents,
    timeSettings:       TimeSettings,
}

function handleChange(setFunction: Function) {
    return (
        (event: React.ChangeEvent<HTMLInputElement>): void => {
            setFunction(event.target.value);
        }
    )
}

function setUTandUpdate(setUT: React.Dispatch<React.SetStateAction<string>>, setUpdateFields: React.Dispatch<React.SetStateAction<boolean>>) {
    return (
        (value: string): void => {
            setUT(value);
            setUpdateFields(true);
        }
    )
}

function ManeuverControls({idx, maneuvers, setManeuvers, copiedManeuver, timeSettings}: ManeuverControlsState) {
    const maneuverComponents =maneuvers[idx];
    const [prograde, setPrograde] = useState(String(maneuverComponents.prograde));
    const [normal,   setNormal]   = useState(String(maneuverComponents.normal));
    const [radial,   setRadial]   = useState(String(maneuverComponents.radial));
    const [UT,       setUT]       = useState('0');
    
    const secsPerDay = timeSettings.hoursPerDay * 3600;
    const secsPerYear = timeSettings.daysPerYear * secsPerDay;
    const dateField = useDateField(String(Math.floor(maneuvers[idx].date / secsPerYear) + 1), String(Math.floor((maneuvers[idx].date % secsPerYear) / secsPerDay) + 1), String((maneuvers[idx].date % secsPerDay) / 3600))

    const [updateUT, setUpdateUT] = useState(false);
    const [updateFields, setUpdateFields] = useState(false);
    const [open, setOpen] = useState(true);

    const handleToggle = () => {
        setOpen(!open);
    }

    useEffect(() => {
        if(updateFields) {
            const oldDate = timeFromDateFieldState(dateField, timeSettings, 1, 1);
            const numUT = Number(UT)
            if(numUT !== oldDate) {
                const calendarDate = timeToCalendarDate(numUT, timeSettings, 1, 1);
                const hours = calendarDate.hour + calendarDate.minute / 60 + calendarDate.second / 3600;
                dateField.setYear(String(calendarDate.year));
                dateField.setDay(String(calendarDate.day));
                dateField.setHour(String(hours));
            }
            setUpdateFields(false);
        }
    }, [updateFields])

    useEffect(() => {
        const newDate = timeFromDateFieldState(dateField, timeSettings, 1, 1);
        if(Number(UT) !== newDate) {
            setUT(String(newDate));
        }
    }, [dateField])

    useEffect(() => {
        const newManeuvers = [...maneuvers];
        newManeuvers[idx] = {prograde: Number(prograde), normal: Number(normal), radial: Number(radial), date: Number(UT)}
        setManeuvers(newManeuvers);
    }, [prograde, normal, radial, UT])

    return (
        <>
            <Box display="flex" alignItems="center" >
            <Typography variant="body2" >
                    {"Maneuver #" + String(idx + 1)}
                </Typography>
                <IconButton
                    size="small"
                    onClick={ handleToggle }
                >
                    {open ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
                </IconButton>
            </Box>
            <Collapse in={open}>
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
                        onChange={handleChange(setRadial)}
                        sx={{ fullWidth: true }} />
                    <RequiredNumberField
                        id={'UT'}
                        label={'UT (s)'} 
                        value={UT}
                        onChange={handleChange(setUTandUpdate(setUT, setUpdateFields))}
                        sx={{ fullWidth: true }} />
                    <DateField 
                        id={String(idx)}
                        label={''}
                        state={dateField}
                        correctFormat={true}
                        hhmmss={true} />
                </Stack>
            </Collapse>
        </>
        
    );
}

export default React.memo(ManeuverControls);