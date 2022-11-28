import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';


function objIsEqual(obj1: Object, obj2: Object): boolean {
    const string1 = JSON.stringify(obj1);
    const string2 = JSON.stringify(obj2);
    return string1 === string2;
}

function CopyButton({obj, copiedObj, setCopiedObj, size = "small", variant = "icon", label = "Copy"}: {obj: ManeuverComponents | IOrbit | IVessel, copiedObj: ManeuverComponents | IOrbit | IVessel, setCopiedObj: React.Dispatch<React.SetStateAction<ManeuverComponents>> | React.Dispatch<React.SetStateAction<IOrbit>> | React.Dispatch<React.SetStateAction<IVessel>> | ((o: IOrbit) => void), size?: "small" | "medium" | "large", variant?: "icon" | "text", label?: string}) {
    const isCopied = objIsEqual(obj, copiedObj);
    return ( variant === "icon" ?
        <IconButton 
            size={size}
            color={isCopied ? "success" : "inherit"}
            // @ts-ignore
            onClick={() => setCopiedObj(obj)}
        >
            <ContentCopyIcon />
        </IconButton>
        
        :

        <Button
            variant="text"
            color={isCopied ? "success" : "inherit"}
            startIcon={<ContentCopyIcon />}
            // @ts-ignore
            onClick={() => setCopiedObj(obj)}
        >
            {isCopied ? "Copied!" : label}
        </Button>
    );
}

export default CopyButton;