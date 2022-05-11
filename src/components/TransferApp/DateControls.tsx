import DateField from "../DateField"
import { DateFieldState } from "../DateField";

import React, { useState } from "react"
import Box from "@mui/material/Box";
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';


export type DateControlsState = {
    earlyStartDate:   DateFieldState,
    lateStartDate:    DateFieldState,
    shortFlightTime:  DateFieldState,
    longFlightTime:   DateFieldState,
  }

function DateControls({earlyStartDate, lateStartDate, shortFlightTime, longFlightTime}: DateControlsState) {
    const [optsVisible, setOptsVisible] = useState(false)

    return (
        <>
            <DateField 
                id='early-start-date' 
                label='Earliest Departure Date'
                state={earlyStartDate}
                required={true} />
            <Collapse in={optsVisible} timeout="auto">
                <DateField
                    id='late-start-date'
                    label='Latest Departure Date'
                    state={lateStartDate} />
                <DateField
                    id='short-flight-time'
                    label='Shortest Flight Duration'
                    state={shortFlightTime} />
                <DateField
                    id='long-flight-time'
                    label='Longest Flight Duration'
                    state={longFlightTime} />
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