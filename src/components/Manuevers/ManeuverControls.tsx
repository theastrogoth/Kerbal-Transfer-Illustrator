import React, { useEffect, useState, useRef } from "react";
import Stack from "@mui/material/Stack";
import RequiredNumberField from "../NumberField"
import { timeFromDateFieldState, makeDateFields } from "../../utils";
import DateField from "../DateField";
import { timeToCalendarDate } from "../../main/libs/math";
import Typography from "@mui/material/Typography";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import ClearIcon from '@mui/icons-material/Clear';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import { Box } from "@mui/system";
import PasteButton from "../PasteButton";

import { atom, useAtom } from "jotai";
import { copiedManeuverAtom, timeSettingsAtom } from "../../App";

type ManeuverControlsState = {
    idx:                number,
    maneuvers:          ManeuverComponents[],
    setManeuvers:       (maneuvers: ManeuverComponents[]) => void,
}

function handleChange(setFunction: Function) {
    return (
        (event: React.ChangeEvent<HTMLInputElement>): void => {
            setFunction(event.target.value);
        }
    )
}

function ManeuverControls({idx, maneuvers, setManeuvers}: ManeuverControlsState) {
    const [timeSettings] = useAtom(timeSettingsAtom);
    const timeSettingsRef = useRef(timeSettings);

    const [copiedManeuver] = useAtom(copiedManeuverAtom);

    const maneuverComponents = maneuvers[idx];
    const [prograde, setPrograde] = useState(String(maneuverComponents.prograde));
    const [normal,   setNormal]   = useState(String(maneuverComponents.normal));
    const [radial,   setRadial]   = useState(String(maneuverComponents.radial));
    const [UT,       setUT]       = useState('0');
    
    const dateFieldAtom = useRef(atom(makeDateFields(...Object.values(timeToCalendarDate(maneuvers[idx].date, timeSettings, 1, 1))))).current;
    const [dateField, setDateField] = useAtom(dateFieldAtom);
    const dateFieldRef = useRef(dateField);

    const maneuverRef = useRef(maneuvers[idx]);
    const progradeRef = useRef(prograde);
    const normalRef = useRef(normal);
    const radialRef = useRef(radial);
    const UTRef = useRef(UT);

    const [open, setOpen] = useState(false);

    const handleToggle = () => {
        setOpen(!open);
    }

    const setUTandUpdate = (event: React.ChangeEvent<HTMLInputElement>) => {
        setUT(event.target.value);
        const calendarDate = timeToCalendarDate(Number(event.target.value), timeSettings, 1, 1);
        setDateField(calendarDate);
        dateFieldRef.current = calendarDate;
    }

    useEffect(() => {
        if(timeSettings !== timeSettingsRef.current) {
            timeSettingsRef.current = timeSettings;
            setDateField(timeToCalendarDate(maneuvers[idx].date, timeSettings, 1, 1));
        } else if(maneuvers[idx] !== maneuverRef.current) {
            maneuverRef.current = maneuvers[idx]
            setPrograde(String(maneuvers[idx].prograde));
            setNormal(String(maneuvers[idx].normal));
            setRadial(String(maneuvers[idx].radial));
            setUT(String(maneuvers[idx].date));
            const newDateFields = timeToCalendarDate(maneuvers[idx].date, timeSettings, 1, 1)
            setDateField(newDateFields);
            dateFieldRef.current = newDateFields;
        } else if((prograde !== progradeRef.current) || (normal !== normalRef.current) || (radial !== radialRef.current) || (UT !== UTRef.current)) {
            progradeRef.current = prograde;
            normalRef.current = normal;
            radialRef.current = radial;
            const newManeuvers = [...maneuvers];
            newManeuvers[idx] = {prograde: Number(prograde), normal: Number(normal), radial: Number(radial), date: Number(UT)}
            setManeuvers(newManeuvers);
            if(UT !== UTRef.current) {
                const calendarDate = timeToCalendarDate(Number(UT), timeSettings, 1, 1);
                setDateField(calendarDate);
            }
            UTRef.current = UT;
        } else if(dateField !== dateFieldRef.current) {
            dateFieldRef.current = dateField;
            const newDate = timeFromDateFieldState(dateField, timeSettings, 1, 1);
            if(Number(UT) !== newDate) {
                setUT(String(newDate));
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateField, timeSettings, prograde, normal, radial, UT, maneuvers, idx])

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
                <Box sx={{ flexGrow: 1 }} />
                <Typography variant="body2" >
                    {String(Math.round(Math.sqrt(maneuvers[idx].prograde ** 2 + maneuvers[idx].normal ** 2 + maneuvers[idx].radial ** 2) * 100) / 100) + " m/s"}
                </Typography>
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
                        onChange={setUTandUpdate}
                        sx={{ fullWidth: true }} />
                    <DateField 
                        id={String(idx)}
                        label={''}
                        calendarDateAtom={dateFieldAtom}
                        correctFormat={true}
                        variant="all"  
                    />
                    <Box display="flex" justifyContent="center" alignItems="center" >
                        <PasteButton setObj={(m: ManeuverComponents) => { const newManeuvers = [...maneuvers]; newManeuvers[idx] = m; setManeuvers(newManeuvers)} } copiedObj={copiedManeuver}/>
                        <IconButton 
                            size="small"
                            color="inherit"
                            // @ts-ignore
                            onClick={() => { const newManeuvers = [...maneuvers]; newManeuvers[idx] = {prograde: 0, normal: 0, radial: 0, date: maneuvers[idx].date}; setManeuvers(newManeuvers)} }
                        >
                            <ClearIcon />
                        </IconButton>
                    </Box>
                </Stack>
            </Collapse>
        </>
        
    );
}

export default React.memo(ManeuverControls);