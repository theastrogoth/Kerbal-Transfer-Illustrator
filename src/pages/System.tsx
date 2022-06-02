import { useState } from "react";
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/system/Box';
import Stack from '@mui/material/Stack';

import Navbar from '../components/Navbar';

import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';

////////// App Content //////////
function SolarSystemAppContent() { 

  const [showHelp, setShowHelp] = useState(false);

  ///// App Body /////
  return (
    <>
      <Navbar showHelp={showHelp} setShowHelp={setShowHelp} />
      <Stack sx={{mx: 4, my: 1}}>
        <CssBaseline />
        <Box textAlign='left' sx={{mx: 2, my: 3}}>
          <Typography variant="h4">Solar System Editor (coming soon) </Typography>
          <Divider />
        </Box>
      </Stack>
    </>
  )
}

function SolarSystemApp() {
  return <>{SolarSystemAppContent()}</>
}

export default SolarSystemApp;
