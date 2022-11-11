import React from "react";
import Stack from "@mui/material/Stack";
import FormGroup from "@mui/material/FormGroup";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import RadioGroup from "@mui/material/RadioGroup";
import Radio from "@mui/material/Radio";

import { useAtom } from "jotai";
import { displayOptionsAtom } from "../../App";

function handleChange(setOpts: React.Dispatch<React.SetStateAction<DisplayOptions>>, property: string, oldOpts: DisplayOptions) {
    return (
        (event: React.ChangeEvent<HTMLInputElement>): void => {
            const newOpts = {...oldOpts} as DisplayOptions;
            // @ts-ignore
            newOpts[property] = (event.target.value);
            setOpts(newOpts);
        }
    )
}
function handleCheckboxChange(setOpts: React.Dispatch<React.SetStateAction<DisplayOptions>>, property: string, oldOpts: DisplayOptions) {
    return (
        (event: React.ChangeEvent<HTMLInputElement>): void => {
            const newOpts = {...oldOpts} as DisplayOptions;
            // @ts-ignore
            newOpts[property] = event.target.checked;
            setOpts(newOpts);
        }
    )
}

function DisplayOptions() {
    const [opts, setOpts] = useAtom(displayOptionsAtom);
    return ( 
        <Stack direction='row' justifyContent='center' sx={{mx: 2, flexWrap: 'wrap'}} >
            <FormGroup>
                <FormControl>
                    <FormLabel>Bodies</FormLabel>
                    <FormControlLabel control={<Checkbox checked={opts.bodies} onChange={handleCheckboxChange(setOpts, "bodies", opts)}/>} label="Body Surfaces" />
                    <FormControlLabel control={<Checkbox checked={opts.textures} onChange={handleCheckboxChange(setOpts, "textures", opts)}/>} label="Body Textures" />
                    <FormControlLabel control={<Checkbox checked={opts.shadows} onChange={handleCheckboxChange(setOpts, "shadows", opts)}/>} label="Shadows" />
                    <FormControlLabel control={<Checkbox checked={opts.wireframe} onChange={handleCheckboxChange(setOpts, "wireframe", opts)}/>} label="Wireframe Bodies" />
                    <FormControlLabel control={<Checkbox checked={opts.bodySprites} onChange={handleCheckboxChange(setOpts, "bodySprites", opts)}/>} label="Body Sprites" />
                    <FormControlLabel control={<Checkbox checked={opts.atmospheres} onChange={handleCheckboxChange(setOpts, "atmospheres", opts)}/>} label="Atmospheres" />         
                    <FormControlLabel control={<Checkbox checked={opts.sois} onChange={handleCheckboxChange(setOpts, "sois", opts)}/>} label="Spheres of Influence" />    
                    <FormControlLabel control={<Checkbox checked={opts.bodyNames} onChange={handleCheckboxChange(setOpts, "bodyNames", opts)}/>} label="Names" />        
                    <FormControlLabel control={<Checkbox checked={opts.bodyOrbits} onChange={handleCheckboxChange(setOpts, "bodyOrbits", opts)}/>} label="Orbits" />      
                    <FormControlLabel control={<Checkbox checked={opts.bodyApses} onChange={handleCheckboxChange(setOpts, "bodyApses", opts)}/>} label="Apoapsis/Periapsis" />      
                    <FormControlLabel control={<Checkbox checked={opts.bodyNodes} onChange={handleCheckboxChange(setOpts, "bodyNodes", opts)}/>} label="Ascending/Descending Nodes" />      
                    <br/>
                </FormControl>
                <FormControl>
                <FormLabel>Texture Type</FormLabel>
                <RadioGroup
                    defaultValue={'Color'}
                    onChange={handleChange(setOpts, "textureType", opts)}
                >
                    <FormControlLabel value={'Color'} control={<Radio />} label="Surface Color" />
                    <FormControlLabel value={'Biome'}  control={<Radio />} label="Biome Map" />
                    <FormControlLabel value={'Height'}  control={<Radio />} label="Height Map" />
                </RadioGroup>
            </FormControl>
            </FormGroup>
            <FormGroup>
                <FormControl>
                    <FormLabel>Crafts</FormLabel>
                    <FormControlLabel control={<Checkbox checked={opts.crafts} onChange={handleCheckboxChange(setOpts, "crafts", opts)}/>} label="Craft Sprites" />
                    <FormControlLabel control={<Checkbox checked={opts.craftNames} onChange={handleCheckboxChange(setOpts, "craftNames", opts)}/>} label="Names" />        
                    <FormControlLabel control={<Checkbox checked={opts.maneuvers} onChange={handleCheckboxChange(setOpts, "maneuvers", opts)}/>} label="Maneuver Nodes" />
                    <FormControlLabel control={<Checkbox checked={opts.soiChanges} onChange={handleCheckboxChange(setOpts, "soiChanges", opts)}/>} label="Escapes/Encounters" />         
                    <FormControlLabel control={<Checkbox checked={opts.craftOrbits} onChange={handleCheckboxChange(setOpts, "craftOrbits", opts)}/>} label="Orbits" />      
                    <FormControlLabel control={<Checkbox checked={opts.comms} onChange={handleCheckboxChange(setOpts, "comms", opts)}/>} label="CommNet" />
                    <FormControlLabel control={<Checkbox checked={opts.craftApses} onChange={handleCheckboxChange(setOpts, "craftApses", opts)}/>} label="Apoapsis/Periapsis" />      
                    <FormControlLabel control={<Checkbox checked={opts.craftNodes} onChange={handleCheckboxChange(setOpts, "craftNodes", opts)}/>} label="Ascending/Descending Nodes" />      
                    <br/>
                </FormControl>
            </FormGroup>
            <FormGroup>
                <FormControl>
                    <FormLabel>Other</FormLabel>
                    <FormControlLabel control={<Checkbox checked={opts.referenceLine} onChange={handleCheckboxChange(setOpts, "referenceLine", opts)}/>} label="Reference Line" />
                    <FormControlLabel control={<Checkbox checked={opts.skyBox} onChange={handleCheckboxChange(setOpts, "skyBox", opts)}/>} label="Galaxy Background" />
                    <br/>
                </FormControl>
            </FormGroup>
        </Stack>
    )
}

export default React.memo(DisplayOptions);