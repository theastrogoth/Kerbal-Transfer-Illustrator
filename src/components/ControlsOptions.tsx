import React from "react";
import Stack from "@mui/material/Stack";
import FormGroup from "@mui/material/FormGroup";
import RadioGroup from "@mui/material/RadioGroup";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import Checkbox from "@mui/material/Checkbox";

import { PrimitiveAtom, useAtom } from "jotai";

export type ControlsOptionsState = {
    planeChange:        0 | 1 | 2,
    matchStartMo:       boolean,
    matchEndMo:         boolean,
    oberthManeuvers:    boolean,
    noInsertionBurn:    boolean,
}

function handleChange(setOpts: React.Dispatch<React.SetStateAction<ControlsOptionsState>>, property: string, oldOpts: ControlsOptionsState) {
    return (
        (event: React.ChangeEvent<HTMLInputElement>): void => {
            const newOpts = Object.assign(oldOpts);
            newOpts[property] = (event.target.value === "true");
            setOpts(newOpts);
        }
    )
}
function handleCheckboxChange(setOpts: React.Dispatch<React.SetStateAction<ControlsOptionsState>>, property: string, oldOpts: ControlsOptionsState) {
    return (
        (event: React.ChangeEvent<HTMLInputElement>): void => {
            const newOpts = Object.assign(oldOpts);
            newOpts[property] = event.target.checked;
            setOpts(newOpts);
        }
    )
}
function handlePlaneChangeChange(setOpts: React.Dispatch<React.SetStateAction<ControlsOptionsState>>, oldOpts: ControlsOptionsState) {
    return (
        (event: React.ChangeEvent<HTMLInputElement>): void => {
            const newOpts = Object.assign(oldOpts) as ControlsOptionsState;
            newOpts.planeChange = parseInt(event.target.value) as 0 | 1 | 2;
            setOpts(newOpts);
        }
    )
}

function ControlsOptions({optsAtom}: {optsAtom: PrimitiveAtom<ControlsOptionsState>}) {
    const [opts, setOpts] = useAtom(optsAtom)
    return ( 
        <Stack spacing={1.5}>
            <FormControl>
                <FormLabel>Transfer Type</FormLabel>
                <RadioGroup
                    defaultValue={0}
                    onChange={handlePlaneChangeChange(setOpts, opts)}
                >
                    <FormControlLabel value={0} control={<Radio />} label="Ballistic" />
                    <FormControlLabel value={1}  control={<Radio />} label="Mid-course plane change (Type 1)" />
                    <FormControlLabel value={2}  control={<Radio />} label="Mid-course plane change (Type 2)" />
                </RadioGroup>
            </FormControl>
            <FormControl>
                <FormLabel>Departure/Arrival Type</FormLabel>
                <RadioGroup
                    defaultValue={false}
                    onChange={handleChange(setOpts, "oberthManeuvers", opts)}
                >
                    <FormControlLabel value={false} control={<Radio />} label="Direct maneuvers (one-impulse)" />
                    <FormControlLabel value={true}  control={<Radio />} label="Oberth maneuvers (two-impulse)" />
                </RadioGroup>
            </FormControl>
            <FormGroup>
                <FormLabel>Departure/Arrival Timing</FormLabel>
                <FormControlLabel control={<Checkbox defaultChecked={opts.matchStartMo} onChange={handleCheckboxChange(setOpts, "matchStartMo", opts)}/>} label="Match Starting Orbit Mean Anomaly" />
                <FormControlLabel control={<Checkbox defaultChecked={opts.matchEndMo}   onChange={handleCheckboxChange(setOpts, "matchEndMo", opts)}/>}   label="Match Target Orbit Mean Anomaly" />
            </FormGroup>
            <FormGroup> 
                <FormLabel>Δv calculation</FormLabel>
                <FormControlLabel control={<Checkbox defaultChecked={opts.noInsertionBurn} onChange={handleCheckboxChange(setOpts, "noInsertionBurn", opts)}/>} label="No Insertion Burn" />
            </FormGroup>
        </Stack>
    )
}

export default React.memo(ControlsOptions);