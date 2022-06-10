import React, { useState } from "react";
import Box from'@mui/material/Box';
import Stack from '@mui/material/Stack';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import Collapse from '@mui/material/Collapse';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import LanguageIcon from '@mui/icons-material/Language';
import PublicIcon from '@mui/icons-material/Public';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';

import { useAtom } from "jotai";
import { editorSelectedNameAtom, configTreeAtom } from "../../App";
import { Typography } from "@mui/material";

function BodyConfigListItem({node, depth = 0, orphan = false}: {node: TreeNode<SunConfig | OrbitingBodyConfig>, depth?: number, orphan?: boolean}) {
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
        <Box sx={{ maxWidth: 500 }}>
            <Stack direction="row">
                <ListItemButton onClick={handleNodeClick} >
                    <ListItemIcon>
                        {orphan ? <LanguageIcon fontSize="medium" /> : (depth === 0 ? <Brightness7Icon fontSize="large"/> : depth === 1 ? <PublicIcon fontSize="medium" /> : <DarkModeIcon fontSize="small" />)}
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
        </Box>
    )
}

function BodyConfigList() {
    const [configTree] = useAtom(configTreeAtom);

    return(
        <Stack spacing={1} sx={{mx: 2, my: 2}}>
            <Typography variant="h6">Solar System Tree</Typography>
            <List>
                <BodyConfigListItem node={configTree.tree} />
            </List>
            {configTree.orphans.length > 0 &&
                <>
                    <Typography variant="h6">Bodies with a missing Reference Body</Typography>
                    <List>
                        {configTree.orphans.map(orphan => <BodyConfigListItem key={orphan.data.name || orphan.data.templateName} node={orphan} orphan={true} />)} 
                    </List>
                </>
            }
        </Stack>

    )
}

export default React.memo(BodyConfigList);