import React, { useState, useEffect } from 'react';
import { useAtom } from 'jotai';
import FormControl from '@mui/material/FormControl';
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";

import SolarSystem from '../main/objects/system';

import { systemOptionsAtom, systemAtom, systemNameAtom } from '../App';


function createSystemItems(systemOptions: Map<string, SolarSystem>) {
    const options = [...systemOptions.keys()].map((k,i) => <MenuItem key={i} value={k}>{k}</MenuItem> )
    return options;
}

function SystemSelect() {
    const [systemOptions] = useAtom(systemOptionsAtom);
    const [, setSystem] = useAtom(systemAtom);
    const [systemName, setSystemName] = useAtom(systemNameAtom);
    const [systemOpts, setSystemOpts] = useState(createSystemItems(systemOptions));

    useEffect(() => {
        setSystemOpts(createSystemItems(systemOptions))
    }, [systemOptions]);

    useEffect(() => {
        setSystem(systemOptions.get(systemName) as SolarSystem);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [systemName]);   

    return (
        <FormControl sx={{ minWidth: 120 }}>
            <InputLabel id={"system-select-label"}>System Selection</InputLabel>
            <Select
                labelId={"system-select-label"}
                label='Solar System'
                id={'system-select'}
                value={systemName}
                onChange={(event) => setSystemName(event.target.value)}
            >
                {systemOpts}
            </Select>
        </FormControl>
    )
}

export default React.memo(SystemSelect);