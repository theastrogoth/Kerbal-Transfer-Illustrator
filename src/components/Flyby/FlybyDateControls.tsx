import DateField from "../DateField"
import { dateFieldIsEmpty, timeFromDateFieldState } from "../../utils";

import React, { useState, useEffect } from "react"
import Box from "@mui/material/Box";
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

import { useAtom } from "jotai";
import { timeSettingsAtom, multiFlybyEarlyStartDateAtom, multiFlybyLateStartDateAtom, multiFlybyFlightTimesAtom, multiFlybyFlightTimesAtomsAtom } from "../../App";

function flybyTimesLabel(id: number): string {
    if(id % 2 === 0) {
        return 'Minimum Leg #' + String(id / 2 + 1) + ' Duration';
    } else {
        return 'Maximum Leg #' + String((id+1) / 2) + ' Duration';
    }
}

function FlybyDateControls() {
    const [timeSettings] = useAtom(timeSettingsAtom);
    const [earlyStartDate] = useAtom(multiFlybyEarlyStartDateAtom);
    const [lateStartDate] = useAtom(multiFlybyLateStartDateAtom);
    const [flightTimesAtoms] = useAtom(multiFlybyFlightTimesAtomsAtom);
    const [flightTimes] = useAtom(multiFlybyFlightTimesAtom);

    const [optsVisible, setOptsVisible] = useState(false)
    const [startErr, setStartErr] = useState(false);
    const [flightErrs, setFlightErrs] = useState(flightTimes.map(ft => false));

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
        const times = flightTimes.map(ft => timeFromDateFieldState(ft, timeSettings, 0, 0));
        const newFlightErrs = flightErrs.slice();
        for(let i=0; i<(flightTimes.length); i += 2) {
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
                calendarDateAtom={multiFlybyEarlyStartDateAtom}
                error={startErr}
                required={true} 
            />
            <Collapse in={optsVisible} timeout="auto">
                <DateField
                    id='late-start-date'
                    label='Latest Departure Date'
                    calendarDateAtom={multiFlybyLateStartDateAtom}
                    error={startErr}
                    required={false} 
                />
                {
                    flightTimesAtoms.map((fta, idx) => 
                        <DateField 
                            key={idx} 
                            id={'flight-time-'+idx} 
                            label={flybyTimesLabel(idx)}
                            calendarDateAtom={fta}
                            error={flightErrs[idx]}
                            required={false}
                        />
                    )     
                }
            </Collapse>
            <Box textAlign='center'>
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

export default React.memo(FlybyDateControls);