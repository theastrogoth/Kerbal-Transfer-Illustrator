import React, { useEffect, useState } from "react";
import Stack from "@mui/material/Stack";
import RequiredNumberField from "../NumberField"
import { timeFromDateFieldState, useDateField } from "../../utils";
import DateField, { DateFieldState } from "../DateField";
import { timeToCalendarDate } from "../../main/libs/math";
import Typography from "@mui/material/Typography";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import ClearIcon from '@mui/icons-material/Clear';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import { Box } from "@mui/system";
import PasteButton from "../PasteButton";

type ManeuverControlsState = {
    idx:                number,
    maneuvers:          ManeuverComponents[],
    setManeuvers:       (maneuvers: ManeuverComponents[]) => void,
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

function setUTandUpdate(setUT: React.Dispatch<React.SetStateAction<string>>, dateField: DateFieldState, timeSettings: TimeSettings) {
    return (
        (value: string): void => {
            setUT(value);
            const calendarDate = timeToCalendarDate(Number(value), timeSettings, 1, 1);
            dateField.setCalendarDate(calendarDate);
            dateField.setUpdateInputs(true);
        }
    )
}

function ManeuverControls({idx, maneuvers, setManeuvers, copiedManeuver, timeSettings}: ManeuverControlsState) {
    const maneuverComponents =maneuvers[idx];
    const [prograde, setPrograde] = useState(String(maneuverComponents.prograde));
    const [normal,   setNormal]   = useState(String(maneuverComponents.normal));
    const [radial,   setRadial]   = useState(String(maneuverComponents.radial));
    const [UT,       setUT]       = useState('0');
    
    const dateField = useDateField(...Object.values(timeToCalendarDate(maneuvers[idx].date, timeSettings, 1, 1)));

    const [open, setOpen] = useState(idx === 0);
    const [loaded, setLoaded] = useState(false);

    const handleToggle = () => {
        setOpen(!open);
    }

    useEffect(() => {
        const newDate = timeFromDateFieldState(dateField, timeSettings, 1, 1);
        if(Number(UT) !== newDate) {
            setUT(String(newDate));
        }
    }, [dateField])

    useEffect(() => {
        if(loaded) {
            let equal = true;
            equal = equal && Number(prograde) === maneuvers[idx].prograde;
            equal = equal && Number(normal)   === maneuvers[idx].normal;
            equal = equal && Number(radial)   === maneuvers[idx].radial;
            equal = equal && Number(UT)       === maneuvers[idx].date;

            if(!equal) {
                const newManeuvers = [...maneuvers];
                newManeuvers[idx] = {prograde: Number(prograde), normal: Number(normal), radial: Number(radial), date: Number(UT)}
                setManeuvers(newManeuvers);
            }
        } else {
            setLoaded(true)
        }
    }, [prograde, normal, radial, UT, loaded])

    useEffect(() => {
        setLoaded(false);
        setPrograde(String(maneuvers[idx].prograde));
        setNormal(String(maneuvers[idx].normal));
        setRadial(String(maneuvers[idx].radial));
        setUT(String(maneuvers[idx].date));
        dateField.setCalendarDate(timeToCalendarDate(maneuvers[idx].date, timeSettings, 1, 1));
        dateField.setUpdateInputs(true);
    }, [maneuvers])

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
                        onChange={handleChange(setUTandUpdate(setUT, dateField, timeSettings))}
                        sx={{ fullWidth: true }} />
                    <DateField 
                        id={String(idx)}
                        label={''}
                        state={dateField}
                        correctFormat={true}
                        variant="hour"  
                        timeSettings={timeSettings}/>
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