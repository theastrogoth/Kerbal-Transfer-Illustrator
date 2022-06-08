import { useState } from "react";
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/system/Box';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';

import Navbar from '../components/Navbar';

import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import BodyConfigList from "../components/SystemEditor/BodyConfigList";

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
        <Grid container component='main' justifyContent="center">
          <Grid item xs={12} sm={11} md={4} lg={3} xl={3}>
            <Paper 
              elevation={1}
              sx={{
                my: 1, 
                mx: 1, 
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <BodyConfigList />
            </Paper>
          </Grid>
        </Grid>
      </Stack>
    </>
  )
}

function SolarSystemApp() {
  return <>{SolarSystemAppContent()}</>
}

export default SolarSystemApp;
