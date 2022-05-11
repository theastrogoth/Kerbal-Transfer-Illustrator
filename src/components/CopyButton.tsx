import IconButton from "@mui/material/IconButton";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

function objShallowIsEqual(obj1: Maneuver | IOrbit, obj2: Maneuver | IOrbit): boolean {
    for (const key in obj1) {
        if (!(key in obj2)) {
            return false;
        }
        // @ts-ignore
        if (obj1[key] !== obj2[key]) {
            return false;
        }
    }
    return true;
}

function CopyButton({obj, copiedObj, setCopiedObj}: {obj: Maneuver | IOrbit, copiedObj: Maneuver | IOrbit, setCopiedObj: React.Dispatch<React.SetStateAction<Maneuver>> | React.Dispatch<React.SetStateAction<IOrbit>>}) {
    const isCopied = objShallowIsEqual(obj, copiedObj);
    return (
        <IconButton 
            size="small" 
            color={isCopied ? "success" : "inherit"}
            // @ts-ignore
            onClick={() => setCopiedObj(obj)}
        >
            <ContentCopyIcon />
        </IconButton>
    );
}

export default CopyButton;