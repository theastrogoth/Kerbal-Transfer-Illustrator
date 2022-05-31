import SolarSystem from '../main/objects/system';
import Vessel from '../main/objects/vessel';

import Navbar from '../components/Navbar';

import { useState } from "react";
import { ThemeProvider, Theme } from '@mui/material/styles';
import { PaletteMode } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/system/Box';
import Stack from '@mui/material/Stack';

import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';



type SolarSystemAppState = {
  theme:                   Theme,
  mode:                    PaletteMode,
  setMode:                 React.Dispatch<React.SetStateAction<PaletteMode>>,
  systemOptions:           Map<string, SolarSystem>,
  system:                  SolarSystem,
  setSystem:               React.Dispatch<React.SetStateAction<SolarSystem>>,
  systemName:              string,
  setSystemName:           React.Dispatch<React.SetStateAction<string>>,
  timeSettings:            TimeSettings,
  setTimeSettings:         React.Dispatch<React.SetStateAction<TimeSettings>>,
  vessels:                 Vessel[],
  setVessels:              React.Dispatch<React.SetStateAction<Vessel[]>>,
}

// worker
const propagateWorker = new Worker(new URL("../workers/propagate.worker.ts", import.meta.url));

////////// App Content //////////
function SolarSystemAppContent({theme, mode, setMode, systemOptions, system, setSystem, systemName, setSystemName, timeSettings, setTimeSettings, vessels, setVessels}: SolarSystemAppState) { 

  const [showHelp, setShowHelp] = useState(false);

  ///// App Body /////
  return (
    <ThemeProvider theme={theme}>
      <Navbar theme={theme} mode={mode} setMode={setMode} system={system} setVessels={setVessels} showHelp={showHelp} setShowHelp={setShowHelp} />
      <Stack sx={{mx: 4, my: 1}}>
        <CssBaseline />
        <Box textAlign='left' sx={{mx: 2, my: 3}}>
          <Typography variant="h4">Solar System Editor (coming soon) </Typography>
          <Divider />
        </Box>
      </Stack>
    </ThemeProvider>
  )
}

function SolarSystemApp(state: SolarSystemAppState) {
  return <>{SolarSystemAppContent(state)}</>
}

export default SolarSystemApp;
