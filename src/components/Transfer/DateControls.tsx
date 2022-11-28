import DateField from "../DateField"
import { dateFieldIsEmpty, timeFromDateFieldState } from "../../utils";

import React, { useEffect, useState } from "react"
import Box from "@mui/material/Box";
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

import { timeSettingsAtom } from "../../App";

import { useAtom } from "jotai";
import { transferEarlyStartDateAtom, transferLateStartDateAtom, transferShortFlightTimeAtom, transferLongFlightTimeAtom } from "../../App";


function DateControls() {
    const [optsVisible, setOptsVisible] = useState(false);
    const [startErr, setStartErr] = useState(false);
    const [flightErr, setFlightErr] = useState(false);
    const [timeSettings] = useAtom(timeSettingsAtom)

    const [earlyStartDate] = useAtom(transferEarlyStartDateAtom);
    const [lateStartDate] = useAtom(transferLateStartDateAtom);
    const [shortFlightTime] = useAtom(transferShortFlightTimeAtom);
    const [longFlightTime] = useAtom(transferLongFlightTimeAtom);

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
                calendarDateAtom={transferEarlyStartDateAtom}
                error={startErr}
                required={true} 
            />
            <Collapse in={optsVisible} timeout="auto">
                <DateField
                    id='late-start-date'
                    label='Latest Departure Date'
                    calendarDateAtom={transferLateStartDateAtom} 
                    error={startErr} 
                />
                <DateField
                    id='short-flight-time'
                    label='Shortest Flight Duration'
                    calendarDateAtom={transferShortFlightTimeAtom}
                    error={flightErr}  
                />
                <DateField
                    id='long-flight-time'
                    label='Longest Flight Duration'
                    calendarDateAtom={transferLongFlightTimeAtom}
                    error={flightErr}  
                />
            </Collapse>
            <Box component="div" textAlign='center'>
                <Button 
                    variant="text" 
                    startIcon={optsVisible ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
                    onClick={() => setOptsVisible(!optsVisible)}
                    sx={{ mx: 'auto' }}
                >
                    Advanced Options
                </Button>
            </Box>
        </>
    )
}

export default React.memo(DateControls);