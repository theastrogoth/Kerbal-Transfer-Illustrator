import React from "react";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import RadioGroup from "@mui/material/RadioGroup";
import Radio from "@mui/material/Radio";

const kspTimeSettings:   TimeSettings = {hoursPerDay: 6,   daysPerYear: 426};
const earthTimeSettings: TimeSettings = {hoursPerDay: 24,  daysPerYear: 365};

const options = [kspTimeSettings, earthTimeSettings];
const labels = ["Kerbin Time (6 hour/day, 426 day/year)", "Earth Time (24 hour/day, 365 day/year)"]

function handleChange(setFunction: Function) {
    return (
        (event: React.ChangeEvent<HTMLInputElement>): void => {
            setFunction(options[parseInt(event.target.value)])
        }
    )
}

function TimeSettingsControls({timeSettings, setTimeSettings}: {timeSettings: TimeSettings, setTimeSettings: React.Dispatch<React.SetStateAction<TimeSettings>>}) {
    return (
        <FormControl>
            <RadioGroup
                value={timeSettings.daysPerYear == kspTimeSettings.daysPerYear ? 0 : 1}
                onChange={handleChange(setTimeSettings)}
            >
                {options.map((ts, index) => <FormControlLabel key={index} value={index} control={<Radio />} label={labels[index]} />)}
            </RadioGroup>
        </FormControl>
    )
}

export default React.memo(TimeSettingsControls);