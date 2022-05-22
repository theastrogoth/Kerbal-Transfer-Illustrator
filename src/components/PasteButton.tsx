import React from "react";
import IconButton from "@mui/material/IconButton";
import ContentPasteIcon from '@mui/icons-material/ContentPaste';

function PasteButton({setObj, copiedObj}: {setObj: ((m: ManeuverComponents) => void) | ((o :IOrbit) => void) | React.Dispatch<React.SetStateAction<IVessel>>, copiedObj: ManeuverComponents | IOrbit | IVessel}) {
    return (
        <IconButton 
            size="small"
            color="inherit"
            // @ts-ignore
            onClick={() => setObj(copiedObj)}
        >
            <ContentPasteIcon />
        </IconButton>
    );
}

export default PasteButton;