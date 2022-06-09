import React, { useEffect, useState } from "react";
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import Collapse from '@mui/material/Collapse';
import Brightness7Icon from '@mui/icons-material/Brightness7';
// import LanguageIcon from '@mui/icons-material/Language';
import PublicIcon from '@mui/icons-material/Public';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';

import { useAtom } from "jotai";
import { editorSelectedNameAtom, configTreeAtom } from "../../App";

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
            <Stack direction="row">
                <ListItemButton onClick={handleNodeClick} >
                    <ListItemIcon>
                        {depth === 0 ? <Brightness7Icon fontSize="large"/> : depth === 1 ? <PublicIcon fontSize="medium" /> : <DarkModeIcon fontSize="small" /> }
                    </ListItemIcon>
                    <ListItemText primary={node.data.name || node.data.templateName} />
                </ListItemButton>
                {!leaf && 

                        <IconButton onClick={handleExpandClick} sx={{borderRadius: 0}}>
                            {open ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>

                }
            </Stack>
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
    const [configTree] = useAtom(configTreeAtom);

    return(
        <List>
            <BodyConfigListItem node={configTree} />
        </List>
    )
}

export default React.memo(BodyConfigList);