import { useAtom } from "jotai";
import DateField from "../DateField"
import { DateFieldState } from "../DateField";
import { dateFieldIsEmpty, timeFromDateFieldState } from "../../utils";

import React, { useEffect, useState } from "react"
import Box from "@mui/material/Box";
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';

import { timeSettingsAtom } from "../../App";


export type DateControlsState = {
    earlyStartDate:   DateFieldState,
    lateStartDate:    DateFieldState,
    shortFlightTime:  DateFieldState,
    longFlightTime:   DateFieldState,
  }

function DateControls({earlyStartDate, lateStartDate, shortFlightTime, longFlightTime}: DateControlsState) {
    const [optsVisible, setOptsVisible] = useState(false);
    const [startErr, setStartErr] = useState(false);
    const [flightErr, setFlightErr] = useState(false);
    const [timeSettings] = useAtom(timeSettingsAtom)

    useEffect(() => {
        if(!dateFieldIsEmpty(earlyStartDate) && !dateFieldIsEmpty(lateStartDate)) {
            const earlyStartTime = timeFromDateFieldState(earlyStartDate, timeSettings, 1, 1);
            const lateStartTime  = timeFromDateFieldState(lateStartDate,  timeSettings, 1, 1);
            if(earlyStartTime > lateStartTime) {
                setStartErr(true);
            } else {
                setStartErr(false);
            }
        } else {
            setStartErr(false)
        }
      }, [earlyStartDate, lateStartDate, timeSettings]);

      useEffect(() => {
        const sfEmpty = dateFieldIsEmpty(shortFlightTime);
        const lfEmpty = dateFieldIsEmpty(longFlightTime);
        if(!sfEmpty || !lfEmpty) {
            const sfTime = timeFromDateFieldState(shortFlightTime, timeSettings, 0, 0);
            const lfTime = timeFromDateFieldState(longFlightTime,  timeSettings, 0, 0);
            console.log(sfTime > lfTime, !sfEmpty && sfTime < 0, !lfEmpty && lfTime < 0)
            if((!sfEmpty && !lfEmpty && sfTime > lfTime) || (!sfEmpty && sfTime < 0) || (!lfEmpty && lfTime < 0)) {
                setFlightErr(true);
            } else {
                setFlightErr(false);
            }
        } else {
            setFlightErr(false)
        }
      }, [shortFlightTime, longFlightTime, timeSettings]);

    return (
        <>
            <DateField 
                id='early-start-date' 
                label='Earliest Departure Date'
                state={earlyStartDate}
                error={startErr}
                required={true} 
            />
            <Collapse in={optsVisible} timeout="auto">
                <DateField
                    id='late-start-date'
                    label='Latest Departure Date'
                    state={lateStartDate} 
                    error={startErr} 
                />
                <DateField
                    id='short-flight-time'
                    label='Shortest Flight Duration'
                    state={shortFlightTime}
                    error={flightErr}  
                />
                <DateField
                    id='long-flight-time'
                    label='Longest Flight Duration'
                    state={longFlightTime}
                    error={flightErr}  
                />
            </Collapse>
            <Box textAlign='center'>
                <Button 
                    variant="text" 
                    onClick={() => setOptsVisible(!optsVisible)}
                    sx={{ mx: 'auto' }}
                >
                    {(optsVisible ? '\u25B4' : '\u25BE') + ' Advanced Options'}
                </Button>
            </Box>
        </>
    )
}

export default React.memo(DateControls);