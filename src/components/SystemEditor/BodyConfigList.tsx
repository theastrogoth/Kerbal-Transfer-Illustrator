import React, { useEffect, useState } from "react";
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import Collapse from '@mui/material/Collapse';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import LanguageIcon from '@mui/icons-material/Language';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';

import { useAtom } from "jotai";
import { kspSystem, sunConfigAtom, bodyConfigsAtom, editorSelectedNameAtom } from "../../App";
import { bodyConfigsToTree } from "../../utils";

function BodyConfigListItem({node, depth = 0}: {node: TreeNode<SunConfig | OrbitingBodyConfig>, depth?: number}) {
    const leaf = node.children === undefined;
    const [open, setOpen] = useState(depth === 0);
    const [, setSelectedName] = useAtom(editorSelectedNameAtom);

    const handleNodeClick = () => {
        setSelectedName((node.data.name || node.data.templateName) as string)
    }

    const handleExpandClick = () => {
        setOpen(!open);
    };

    return (
        <>
            <ListItemButton onClick={handleNodeClick} >
                <ListItemIcon>
                    {depth === 0 ? <Brightness7Icon fontSize="large"/> : <LanguageIcon fontSize={depth === 1 ? "medium" : "small"} />}
                </ListItemIcon>
                <ListItemText primary={node.data.name || node.data.templateName} />
                {!leaf && 
                    <IconButton onClick={handleExpandClick}>
                        {open ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                }
            </ListItemButton>
            {!leaf && 
                <Collapse in={open} timeout="auto">
                    <List component="div" sx={{ pl: 3 }} >
                        {node.children!.map(childNode => <BodyConfigListItem key={childNode.data.name || childNode.data.templateName} node={childNode} depth={depth + 1} />)}
                    </List>
                </Collapse>
            }
        </>
    )
}

function BodyConfigList() {
    const [sunConfig] = useAtom(sunConfigAtom);
    const [bodyConfigs] = useAtom(bodyConfigsAtom);

    const [configTree, setConfigTree] = useState(bodyConfigsToTree(sunConfig, bodyConfigs, kspSystem));
    console.log(configTree)

    useEffect(() => {
        setConfigTree(bodyConfigsToTree(sunConfig, bodyConfigs, kspSystem))
    }, [sunConfig, bodyConfigs])

    return(
        <List>
            <BodyConfigListItem node={configTree} />
        </List>
    )
}

export default React.memo(BodyConfigList);