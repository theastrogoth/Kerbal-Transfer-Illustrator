import DateField from "../DateField"
import { DateFieldState } from "../DateField";

import React, { useState } from "react"
import Box from "@mui/material/Box";
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';

export type FlybyDateControlsState = {
    earlyStartDate:   DateFieldState,
    lateStartDate:    DateFieldState,
    flightTimes:      DateFieldState[],
    setFlightTimes:   React.Dispatch<React.SetStateAction<DateFieldState[]>>,
}

function flybyTimesLabels(flightTimes: DateFieldState[]) {
    return flightTimes.map(
        (ft, idx) => {
            let label: string;
            if(idx % 2 == 0) {
                return 'Minimum Leg #' + String(idx / 2 + 1) + ' Duration';
            } else {
                return 'Maximum Leg #' + String((idx+1) / 2) + ' Duration';
            }
        }
    )
}


function FlybyDateControls({earlyStartDate, lateStartDate, flightTimes}: FlybyDateControlsState) {
    const [optsVisible, setOptsVisible] = useState(false)

    const labels = flybyTimesLabels(flightTimes);

    return (
        <>
            <DateField 
                id='early-start-date' 
                label='Earliest Departure Date'
                state={earlyStartDate}
                required={true}
            />
            <Collapse in={optsVisible} timeout="auto">
                <DateField
                    id='late-start-date'
                    label='Latest Departure Date'
                    state={lateStartDate} 
                />
                {/* {flightTimes.map((d,idx) => <DateField key={idx} id={String(idx)} label={labels[idx]} state={d} />)} */}
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

export default React.memo(FlybyDateControls);