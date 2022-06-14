import React from "react";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import ContentPasteIcon from '@mui/icons-material/ContentPaste';

function PasteButton({setObj, copiedObj, variant = "icon", label = "Paste"}: {setObj: ((m: ManeuverComponents) => void) | ((o :IOrbit) => void) | React.Dispatch<React.SetStateAction<IVessel>>, copiedObj: ManeuverComponents | IOrbit | IVessel, variant?: "icon" | "text", label?: string}) {
    return ( variant === "icon" ?
        <IconButton 
            size="small"
            color="inherit"
            // @ts-ignore
            onClick={() => setObj(copiedObj)}
        >
            <ContentPasteIcon />
        </IconButton>

        :

        <Button
            variant="text"
            color="inherit"
            startIcon={<ContentPasteIcon />}
            // @ts-ignore
            onClick={() => setObj(copiedObj)}
        >
            {label}
        </Button>
    );
}

export default PasteButton;