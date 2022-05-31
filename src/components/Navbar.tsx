import React, { useState } from "react";
import Box from "@mui/material/Box";
import AppBar from "@mui/material/AppBar"
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button"
import IconButton from "@mui/material/IconButton"
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MenuIcon from '@mui/icons-material/Menu';
import MoreIcon from '@mui/icons-material/MoreVert';
import { PaletteMode, Theme } from "@mui/material";
import { Link } from "react-router-dom";

import Vessel from "../main/objects/vessel";
import HelpOutline from "@mui/icons-material/HelpOutline";
import SaveFileUploadButton from "./SaveFileUploadButton";
import DarkLightModeSwitch from "./DarkLightModeSwitch";

function Navbar({theme, mode, setMode, system, setVessels, showHelp, setShowHelp}: {theme: Theme, mode: PaletteMode, setMode: React.Dispatch<React.SetStateAction<PaletteMode>>, system: ISolarSystem, setVessels: React.Dispatch<React.SetStateAction<Vessel[]>>, showHelp: boolean, setShowHelp: React.Dispatch<React.SetStateAction<boolean>>}) {  
    
    const pages = ['Transfer', 'Flyby', 'Flight Plan', 'System'];
    const links = ["/", "/Flyby", "/FlightPlan", "/System",];    
    
    const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null);
    const [anchorElButton, setAnchorElButton] = React.useState<null | HTMLElement>(null);

    const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorElNav(event.currentTarget);
    };
    const handleCloseNavMenu = () => {
        setAnchorElNav(null);
    };

    const handleOpenButtonMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorElButton(event.currentTarget);
    };
    const handleCloseButtonMenu = () => {
        setAnchorElButton(null);
    };

    return (
        <AppBar position="static">
            <Toolbar>
                <Typography 
                    variant="h5"
                    sx={{
                        mr: 2,
                        display: { xs: 'none', md: 'flex' },
                        fontWeight: 700,
                        color: 'inherit',
                        textDecoration: 'none',
                      }}
                >
                    Kerbal Transfer Illustrator 
                </Typography>
                <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
                    <IconButton
                        size="large"
                        onClick={handleOpenNavMenu}
                        color="inherit"
                    >
                        <MenuIcon />
                    </IconButton>
                    <Menu
                        id="menu-nav"
                        anchorEl={anchorElNav}
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'left',
                        }}
                        keepMounted
                        transformOrigin={{
                            vertical: 'top',
                            horizontal: 'left',
                        }}
                        open={Boolean(anchorElNav)}
                        onClose={handleCloseNavMenu}
                        sx={{
                            display: { xs: 'block', md: 'none' },
                        }}
                    >
                        {pages.map((page, idx) => (
                            <MenuItem key={page} component={Link} to={links[idx]} onClick={handleCloseNavMenu}>
                                <Typography textAlign="center">{page}</Typography>
                            </MenuItem>
                        ))}
                    </Menu>
                </Box>
                <Typography 
                    variant="h5"
                    sx={{
                        mr: 2,
                        display: { xs: 'flex', md: 'none' },
                        fontWeight: 700,
                        color: 'inherit',
                        textDecoration: 'none',
                      }}
                >
                    Kerbal Transfer Illustrator 
                </Typography>
                <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex'} }}>
                    {pages.map((page, idx) => (
                        <Button
                            key={page}
                            component={Link}
                            to={links[idx]}
                            onClick={handleCloseNavMenu}
                            sx={{ my: 2, color: 'white', display: 'block' }}
                        >
                            {page}
                        </Button>
                    ))}
                </Box>
                <Box sx={{ flexGrow: 1 }} />
                <Box sx={{ display: { xs: 'none', sm: 'flex' } }}>
                      <SaveFileUploadButton system={system} setVessels={setVessels} />
                </Box>
                <Box sx={{ display: { xs: 'none', sm: 'flex' } }}>
                    <Button 
                        color="inherit"
                        onClick={() => setShowHelp(!showHelp)}
                    >
                        <HelpOutline />
                    </Button>
                </Box>
                <Box sx={{ display: { xs: 'none', sm: 'flex' } }}>
                    <DarkLightModeSwitch theme={theme} mode={mode} setMode={setMode} />
                </Box>
                <Box sx={{ flexGrow: 0,  display: { xs: 'flex', sm: 'none' } }}>
                    <IconButton onClick={handleOpenButtonMenu} >
                        <MoreIcon />
                    </IconButton>
                    <Menu
                        id="menu-buttons"
                        anchorEl={anchorElButton}
                        anchorOrigin={{
                            vertical: 'top',
                            horizontal: 'right',
                        }}
                        keepMounted
                        transformOrigin={{
                            vertical: 'top',
                            horizontal: 'right',
                        }}
                        open={Boolean(anchorElButton)}
                        onClose={handleCloseButtonMenu}
                    >
                        <MenuItem >
                            <SaveFileUploadButton system={system} setVessels={setVessels} />
                        </MenuItem>
                        <MenuItem >
                            <Button 
                                color="inherit"
                                startIcon={<HelpOutline />}
                                onClick={() => setShowHelp(!showHelp)}
                                fullWidth
                                sx={{justifyContent: 'left'}}
                            >
                                Help
                            </Button>
                        </MenuItem>
                        <MenuItem >
                            <Button
                                color="inherit"
                                startIcon={<DarkLightModeSwitch theme={theme} mode={mode} setMode={setMode} />}
                            >
                                Dark/Light Mode
                            </Button>
                        </MenuItem>
                    </Menu>
                </Box>
            </Toolbar>
        </AppBar>
    );
}
export default Navbar;