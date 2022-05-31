import DateField, { DateFieldState } from "../DateField"
import DynamicDateFields,  { DynamicDateFieldState } from "../DynamicDateFields";
import { dateFieldIsEmpty, timeFromDateFieldState, timesFromDynamicDateFieldState } from "../../utils";

import React, { useState, useEffect } from "react"
import Box from "@mui/material/Box";
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';

export type FlybyDateControlsState = {
    earlyStartDate:   DateFieldState,
    lateStartDate:    DateFieldState,
    flightTimes:      DynamicDateFieldState,
    timeSettings:     TimeSettings,
}

function flybyTimesLabel(id: number): string {
    if(id % 2 === 0) {
        return 'Minimum Leg #' + String(id / 2 + 1) + ' Duration';
    } else {
        return 'Maximum Leg #' + String((id+1) / 2) + ' Duration';
    }
}


function FlybyDateControls({earlyStartDate, lateStartDate, flightTimes, timeSettings}: FlybyDateControlsState) {
    const [optsVisible, setOptsVisible] = useState(false)
    const [startErr, setStartErr] = useState(false);
    const [flightErrs, setFlightErrs] = useState(flightTimes.years.map(y => false));

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [earlyStartDate, lateStartDate, timeSettings]);

    useEffect(() => {
        const times = timesFromDynamicDateFieldState(flightTimes, timeSettings, 0, 0);
        const newFlightErrs = flightErrs.slice();
        for(let i=0; i<(flightTimes.years.length); i += 2) {
            const sfTime = times[i];
            const lfTime = times[i + 1];
            if (sfTime > 0 && lfTime > 0) {
                if (sfTime > lfTime) {
                    newFlightErrs[i] = true;
                    newFlightErrs[i+1] = true;
                } else {
                    newFlightErrs[i] = false;
                    newFlightErrs[i+1] = false;
                }
            } else {
                newFlightErrs[i] = false;
                newFlightErrs[i+1] = false;
            }
        }
        setFlightErrs(newFlightErrs)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [flightTimes, timeSettings])

    return (
        <>
            <DateField 
                id='early-start-date' 
                label='Earliest Departure Date'
                state={earlyStartDate}
                error={startErr}
                required={true} 
                timeSettings={timeSettings}
            />
            <Collapse in={optsVisible} timeout="auto">
                <DateField
                    id='late-start-date'
                    label='Latest Departure Date'
                    state={lateStartDate} 
                    error={startErr}
                    required={false} 
                    timeSettings={timeSettings}
                />
                <DynamicDateFields
                    labelFun={flybyTimesLabel}
                    state={flightTimes}
                    errors={flightErrs}
                    required={false}
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

export default React.memo(FlybyDateControls);