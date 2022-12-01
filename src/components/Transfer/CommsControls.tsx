import React, { useEffect, useRef } from "react";
import Stack from "@mui/material/Stack";
import FormGroup from "@mui/material/FormGroup";
import FormLabel from "@mui/material/FormLabel";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import FormControl from "@mui/material/FormControl";
import RadioGroup from "@mui/material/RadioGroup";
import Radio from "@mui/material/Radio";
import { NumberField } from "../NumberField";

import { PrimitiveAtom, useAtom } from "jotai";
import { groundStationsAtom, systemNameAtom } from "../../App";

export type CommsOptionsState = {
    spaceCenter:        boolean,
    groundStations:     boolean,
    commStrength:       number,
    trackingLevel:      number,
}

function ControlsOptions({optsAtom, showStrength}: {optsAtom: PrimitiveAtom<CommsOptionsState>, showStrength: boolean}) {
    const [opts, setOpts] = useAtom(optsAtom);
    const [systemName] = useAtom(systemNameAtom);
    const [groundStations, setGroundStations] = useAtom(groundStationsAtom);
    const optsRef = useRef(opts);

    const disabled = (systemName !== "Kerbol System (Stock)" && systemName !== "Kerbol System (OPM)");

    function handleCheckboxChange(setOpts: React.Dispatch<React.SetStateAction<CommsOptionsState>>, property: string, oldOpts: CommsOptionsState) {
        return (
            (event: React.ChangeEvent<HTMLInputElement>): void => {
                const newOpts = {...optsRef.current};
                // @ts-ignore
                newOpts[property] = event.target.checked;
                optsRef.current = newOpts;
                setOpts(newOpts);
            }
        )
    }

    const setCommStrength = (cs: number) => {
        const newOpts = {...optsRef.current, commStrength: cs};
        optsRef.current = newOpts;
        setOpts(newOpts);
    }

    const setTrackingLevel = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newOpts = {...optsRef.current, trackingLevel: Number(e.target.value)};
        optsRef.current = newOpts;
        setOpts(newOpts);
    }

    useEffect(() => {
        const newGroundStations = groundStations.map(gs => {
            const commRange = opts.trackingLevel === 1 ? 2e9 : (opts.trackingLevel === 2 ? 50e9 : 250e9)
            return {...gs, commRange};
        });
        setGroundStations(newGroundStations);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [opts.trackingLevel])

    return ( 
        <Stack spacing={1.5}>
            <FormGroup>
                <FormControlLabel control={<Checkbox disabled={disabled} checked={opts.spaceCenter}     onChange={handleCheckboxChange(setOpts, "spaceCenter", opts)}/>} label="Show KSC" />
                <FormControlLabel control={<Checkbox disabled={disabled} checked={opts.groundStations}  onChange={handleCheckboxChange(setOpts, "groundStations", opts)}/>}   label="Show Kerbin Groundstations" />
            </FormGroup>
            <FormControl disabled={disabled}>
                <FormLabel>Tracking Station Level</FormLabel>
                <RadioGroup
                    defaultValue={3}
                    onChange={setTrackingLevel}
                >
                    <Stack direction="row" >
                        <FormControlLabel value={1} control={<Radio />} label="1" />
                        <FormControlLabel value={2} control={<Radio />} label="2" />
                        <FormControlLabel value={3} control={<Radio />} label="3" />
                    </Stack>
                </RadioGroup>
            </FormControl>
            {showStrength && 
                <NumberField
                    value={opts.commStrength}
                    setValue={setCommStrength}
                    label={"Craft Signal Strength (Mm)"}
                    min={0}
                    step={1}
                    useSetState={false}
                    disabled={disabled}
                />
            }
        </Stack>
    )
}

export default React.memo(ControlsOptions);