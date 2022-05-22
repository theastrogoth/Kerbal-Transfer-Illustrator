import IconButton from "@mui/material/IconButton";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

function objIsEqual(obj1: Object, obj2: Object): boolean {
    const string1 = JSON.stringify(obj1);
    const string2 = JSON.stringify(obj2);
    return string1 === string2;
}

function CopyButton({obj, copiedObj, setCopiedObj, size = "small"}: {obj: ManeuverComponents | IOrbit | IVessel, copiedObj: ManeuverComponents | IOrbit | IVessel, setCopiedObj: React.Dispatch<React.SetStateAction<ManeuverComponents>> | React.Dispatch<React.SetStateAction<IOrbit>> | React.Dispatch<React.SetStateAction<IVessel>>, size?: "small" | "medium" | "large"}) {
    const isCopied = objIsEqual(obj, copiedObj);
    return (
        <IconButton 
            size={size}
            color={isCopied ? "success" : "inherit"}
            // @ts-ignore
            onClick={() => setCopiedObj(obj)}
        >
            <ContentCopyIcon />
        </IconButton>
    );
}

export default CopyButton;