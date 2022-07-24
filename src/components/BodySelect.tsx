import SolarSystem from "../main/objects/system";

import React, {useEffect, useState } from "react";
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";

function createBodyItems(system: SolarSystem) {
    const options =[<MenuItem key={system.sun.id} value={system.sun.id}>{system.sun.name}</MenuItem>];
    const bds = system.orbiting;
    for (let i = 0; i < bds.length; i++) {
        options.push(<MenuItem key={bds[i].id} value={bds[i].id}>{bds[i].name}</MenuItem>)
    }
    return options;
}

function BodySelect({ label, bodyId, setBodyId, system }: { label: string, bodyId: number, setBodyId: React.Dispatch<React.SetStateAction<number>> | ((id: number) => void), system: SolarSystem }) {
    const [bodyOptions, setBodyOptions] = useState(createBodyItems(system));

    useEffect(() => {
        setBodyOptions(createBodyItems(system));
    }, [system])

    return (
    <FormControl>
        <InputLabel id={"body-select-label-"+label}>Body</InputLabel>
        <Select
            labelId={"body-select-label-"+label}
            label='Body'
            id={'body-'+label}
            value={bodyId}
            onChange={(e) => setBodyId(Number(e.target.value))}
            error={isNaN(bodyId) || bodyOptions.find(opt => Number(opt.key) === bodyId) === undefined}
        >
            {bodyOptions}
        </Select>
    </FormControl>
    )
}

export default BodySelect;