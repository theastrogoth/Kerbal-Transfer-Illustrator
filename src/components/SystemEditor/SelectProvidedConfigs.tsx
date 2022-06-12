import React, { useState, useRef } from "react";
import FormControl from '@mui/material/FormControl';
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";

import opmconfigs from '../../data/opm_configs.json';
import rssconfigs from '../../data/rss_configs.json';
import ksrssconfigs from '../../data/ksrss_configs.json';
import jnsqconfigs from '../../data/jnsq_configs.json';

import { sunToConfig, bodyToConfig } from "../../main/utilities/loadPlanetConfig";

import { useAtom } from 'jotai';
import { bodyConfigsAtom, editorSelectedNameAtom, kspSystem } from "../../App";

function SelectProvidedConfigs() {
    const [, setBodyConfigs] = useAtom(bodyConfigsAtom);
    const [editorSelectedName, setEditorSelectedName] = useAtom(editorSelectedNameAtom)
    const [idx, setIdx] = useState(0);

    const kspconfigs: (SunConfig | OrbitingBodyConfig)[] = useRef([sunToConfig(kspSystem.sun), ...kspSystem.orbiters.map(bd => bodyToConfig(bd, kspSystem))]).current;
    const configsList: (SunConfig | OrbitingBodyConfig)[][] = useRef([kspconfigs, opmconfigs, jnsqconfigs, rssconfigs, ksrssconfigs]).current;
    const namesList = useRef(["Kerbol System (Stock)", "Kerbol System (OPM)", "Kerbol System (JNSQ)", "Sol System (RSS)", "Sol System (KSRSS)"]).current;

    const options = useRef(namesList.map((name, idx) => <MenuItem key={idx} value={idx}>{name}</MenuItem>)).current;

    return (
        <FormControl sx={{ minWidth: 120 }}>
            <InputLabel id={"system-select-label"}>System Configs Selection</InputLabel>
            <Select
                labelId={"system-select-label"}
                label='Solar System'
                id={'system-select'}
                value={idx}
                onChange={(event) => {
                    const val = Number(event.target.value);
                    const newConfigs = configsList[val];
                    const nameInNewConfigs = newConfigs.find(c => (c.name || c.templateName) === editorSelectedName) !== undefined;
                    if(!nameInNewConfigs) {
                        setEditorSelectedName("Sun");
                    }
                    setIdx(val);
                    setBodyConfigs(newConfigs);
                }}
            >
                {options}
            </Select>
        </FormControl>
    )
}

export default React.memo(SelectProvidedConfigs);