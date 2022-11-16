import React, { useEffect, useState, useRef } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import ClearIcon from '@mui/icons-material/Clear';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';

import RequiredNumberField from "../NumberField"
import DateField from "../DateField";
import PasteButton from "../PasteButton";

import { timeToCalendarDate } from "../../main/libs/math";
import { timeFromDateFieldState, makeDateFields } from "../../utils";

import { atom, useAtom } from "jotai";
import { copiedManeuverAtom, timeSettingsAtom } from "../../App";

type ManeuverControlsState = {
    idx:                number,
    maneuvers:          ManeuverComponents[],
    setManeuvers:       (maneuvers: ManeuverComponents[]) => void,
}

function ManeuverControls({idx, maneuvers, setManeuvers}: ManeuverControlsState) {
    const [timeSettings] = useAtom(timeSettingsAtom);
    const timeSettingsRef = useRef(timeSettings);

    const [copiedManeuver] = useAtom(copiedManeuverAtom);

    const maneuverComponents = maneuvers[idx];
    const [prograde, setPrograde] = useState(maneuverComponents.prograde);
    const [normal,   setNormal]   = useState(maneuverComponents.normal);
    const [radial,   setRadial]   = useState(maneuverComponents.radial);
    const [UT,       setUT]       = useState(0);
    
    const dateFieldAtom = useRef(atom(makeDateFields(...Object.values(timeToCalendarDate(maneuvers[idx].date, timeSettings, 1, 1))))).current;
    const [dateField, setDateField] = useAtom(dateFieldAtom);
    const dateFieldRef = useRef(dateField);

    const maneuverRef = useRef(maneuvers[idx]);
    const progradeRef = useRef(prograde);
    const normalRef = useRef(normal);
    const radialRef = useRef(radial);
    const UTRef = useRef(UT);

    const [open, setOpen] = useState(idx === 0);

    const handleToggle = () => {
        setOpen(!open);
    }

    const handleRemoveManeuver = () => {
        const newManeuvers = [...maneuvers];
        newManeuvers.splice(idx,1);
        setManeuvers(newManeuvers);
    }

    // const setUTandUpdate = (event: React.ChangeEvent<HTMLInputElement>) => {
    //     setUT(parseFloat(event.target.value));
    //     if(Number(event.target.value) !== Number(UT)) {
    //         const calendarDate = timeToCalendarDate(Number(event.target.value), timeSettings, 1, 1);
    //         setDateField(calendarDate);
    //         dateFieldRef.current = calendarDate;
    //     }
    // }

    useEffect(() => {
        if(timeSettings !== timeSettingsRef.current) {
            timeSettingsRef.current = timeSettings;
            setDateField(timeToCalendarDate(maneuvers[idx].date, timeSettings, 1, 1));
        } else if(maneuvers[idx] !== maneuverRef.current) {
            maneuverRef.current = maneuvers[idx]
            if(maneuvers[idx].prograde !== Number(prograde)) {
                setPrograde(maneuvers[idx].prograde);
            }
            if(maneuvers[idx].normal !== Number(normal)) {
                setNormal(maneuvers[idx].normal);
            }
            if(maneuvers[idx].radial !== Number(radial)) {
                setRadial(maneuvers[idx].radial);
            }
            if(maneuvers[idx].date !== UT) {
                setUT(maneuvers[idx].date);
                const newDateFields = timeToCalendarDate(maneuvers[idx].date, timeSettings, 1, 1);
                setDateField(newDateFields);
                dateFieldRef.current = newDateFields;
            }
        } else if((prograde !== progradeRef.current) || (normal !== normalRef.current) || (radial !== radialRef.current) || (UT !== UTRef.current)) {
            progradeRef.current = prograde;
            normalRef.current = normal;
            radialRef.current = radial;
            const newManeuvers = [...maneuvers];
            newManeuvers[idx] = {prograde: Number(prograde), normal: Number(normal), radial: Number(radial), date: Number(UT)}
            setManeuvers(newManeuvers);
            if(Number(UT) !== Number(UTRef.current)) {
                const calendarDate = timeToCalendarDate(Number(UT), timeSettings, 1, 1);
                setDateField(calendarDate);
            }
            UTRef.current = UT;
        } else if(dateField !== dateFieldRef.current) {
            dateFieldRef.current = dateField;
            const newDate = timeFromDateFieldState(dateField, timeSettings, 1, 1);
            if(Number(UT) !== newDate) {
                setUT(newDate);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateField, timeSettings, prograde, normal, radial, UT, maneuvers, idx])

    return (
        <>
            <Box component="div" display="flex" alignItems="center" >
                <Typography variant="body2" >
                    {"Maneuver #" + String(idx + 1)}
                </Typography>
                <IconButton
                    size="small"
                    onClick={ handleToggle }
                >
                    {open ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
                </IconButton>
                <Box component="div" sx={{ flexGrow: 11 }} />
                <Typography variant="body2" >
                    {String(Math.round(Math.sqrt(maneuvers[idx].prograde ** 2 + maneuvers[idx].normal ** 2 + maneuvers[idx].radial ** 2) * 100) / 100) + " m/s"}
                </Typography>
                <Box component="div" sx={{ flexGrow: 1 }} />
                <PasteButton setObj={(m: ManeuverComponents) => { const newManeuvers = [...maneuvers]; newManeuvers[idx] = m; setManeuvers(newManeuvers)} } copiedObj={copiedManeuver}/>
                <IconButton 
                    size="small"
                    color="inherit"
                    // @ts-ignore
                    onClick={handleRemoveManeuver}
                >
                    <ClearIcon />
                </IconButton>
            </Box>
            <Collapse in={open}>
                <Stack spacing={1.5}>
                    <RequiredNumberField
                        label='Prograde (m/s)' 
                        value={prograde}
                        setValue={setPrograde}
                        sx={{ fullWidth: true }}/>
                    <RequiredNumberField
                        label='Normal (m/s)' 
                        value={normal}
                        setValue={setNormal}
                        sx={{ fullWidth: true }} />
                    <RequiredNumberField
                        label={'Radial (m/s)'} 
                        value={radial}
                        setValue={setRadial}
                        sx={{ fullWidth: true }} />
                    <RequiredNumberField
                        label={'UT (s)'} 
                        value={UT}
                        setValue={setUT}
                        sx={{ fullWidth: true }} />
                    <DateField 
                        id={String(idx)}
                        label={''}
                        calendarDateAtom={dateFieldAtom}
                        correctFormat={true}
                        variant="all"  
                    />
                </Stack>
            </Collapse>
        </>
    );
}

export default React.memo(ManeuverControls);