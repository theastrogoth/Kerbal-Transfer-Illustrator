import Box from "@mui/material/Box";
import AppBar from "@mui/material/AppBar"
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button"

import Vessel from "../main/objects/vessel";
import HelpOutline from "@mui/icons-material/HelpOutline";
import SaveFileUploadButton from "./SaveFileUploadButton";


function Navbar({system, setVessels, showHelp, setShowHelp}: {system: ISolarSystem, setVessels: React.Dispatch<React.SetStateAction<Vessel[]>>, showHelp: boolean, setShowHelp: React.Dispatch<React.SetStateAction<boolean>>}) {  
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
                <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
                    <Button href="/#/" sx={{ my: 2, color: 'white', display: 'block' }}>
                        Transfer
                    </Button>
                    <Button href="/#/Flyby" sx={{ my: 2, color: 'white', display: 'block' }}>
                        Flyby
                    </Button>
                    {/* <Button href="/#/FlightPlan" sx={{ my: 2, color: 'white', display: 'block' }}>
                        Flight Plan
                    </Button> */}
                </Box>
                <Box sx={{ flexGrow: 1 }} />
                <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
                    <Button 
                        color="inherit"
                        startIcon={<HelpOutline />}
                        onClick={() => setShowHelp(!showHelp)}
                    />
                </Box>
                <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
                      <SaveFileUploadButton system={system} setVessels={setVessels} />
                </Box>
            </Toolbar>
        </AppBar>
    );
}
export default Navbar;