import React, { useState, useEffect } from 'react';
import FormControl from '@mui/material/FormControl';
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";

function createVesselItems(vessels: IVessel[] | LandedVessel[]) {
    const options = [<MenuItem key={-1} value={-1}>Select a Craft</MenuItem>];
    for(let i=0; i<vessels.length; i++) {
        options.push(<MenuItem key={i} value={i}>{vessels[i].name}</MenuItem>)
    }
    return options;
}

function VesselSelect({vessels, label, vesselId, handleVesselIdChange}: {vessels: IVessel[] | LandedVessel[], label: string, vesselId: number, handleVesselIdChange: ((event: any) => void)}) {
    const [vesselOptions, setVesselOptions] = useState(createVesselItems(vessels));

    useEffect(() => {
        setVesselOptions(createVesselItems(vessels));
      }, [vessels]);   

    return (<>
        {(vessels.length > 0) &&
            <FormControl sx={{ minWidth: 120 }}>
                <InputLabel id={"vessel-select-label-"+label}>Vessel</InputLabel>
                <Select
                    labelId={"vessel-select-label-"+label}
                    label='Vessel'
                    id={'vessel-'+label}
                    value={vesselId}
                    onChange={handleVesselIdChange}
                >
                    {vesselOptions}
                </Select>
            </FormControl>
        }
     </>)
}

export default VesselSelect;