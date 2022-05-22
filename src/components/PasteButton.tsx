import IconButton from "@mui/material/IconButton";
import ContentPasteIcon from '@mui/icons-material/ContentPaste';

function PasteButton({setObj, copiedObj}: {setObj: ((m: ManeuverComponents) => void) | ((o :IOrbit) => void), copiedObj: ManeuverComponents | IOrbit }) {
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