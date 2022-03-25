import React from "react";
import FormGroup from "@mui/material/FormGroup";
import RadioGroup from "@mui/material/RadioGroup";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import Checkbox from "@mui/material/Checkbox";


export type TransferControlsState = {
    planeChange:        boolean,
    matchStartMo:       boolean,
    matchEndMo:         boolean,
    noInsertionBurn:    boolean,
    setPlaneChange:     React.Dispatch<React.SetStateAction<boolean>>,
    setMatchStartMo:    React.Dispatch<React.SetStateAction<boolean>>,
    setMatchEndMo:      React.Dispatch<React.SetStateAction<boolean>>,
    setNoInsertionBurn: React.Dispatch<React.SetStateAction<boolean>>,
}

function handleChange(setFunction: Function) {
    return (
        (event: React.ChangeEvent<HTMLInputElement>): void => {
            setFunction(event.target.value === "true")
        }
    )
}
function handleCheckboxChange(setFunction: Function) {
    return (
        (event: React.ChangeEvent<HTMLInputElement>): void => {
            setFunction(event.target.checked)
        }
    )
}

function TransferControls({state}: {state: TransferControlsState}) {
    return ( 
        <>
            <FormControl>
                {/* <FormLabel>Transfer Type</FormLabel> */}
                <RadioGroup
                    defaultValue={false}
                    onChange={handleChange(state.setPlaneChange)}
                >
                    <FormControlLabel value={false} control={<Radio />} label="Ballistic" />
                    <FormControlLabel value={true}  control={<Radio />} label="Mid-course plane change" />
                </RadioGroup>
            </FormControl>
            <FormGroup>
                <FormControlLabel control={<Checkbox checked={state.matchStartMo}    onChange={handleCheckboxChange(state.setMatchStartMo)}/>}    label="Match Starting Orbit Mean Anomaly" />
                <FormControlLabel control={<Checkbox checked={state.matchEndMo}      onChange={handleCheckboxChange(state.setMatchEndMo)}/>}      label="Match Target Orbit Mean Anomaly" />
                <FormControlLabel control={<Checkbox checked={state.noInsertionBurn} onChange={handleCheckboxChange(state.setNoInsertionBurn)}/>} label="No Insertion Burn" />
            </FormGroup>
        </>
    )
}

export default React.memo(TransferControls);