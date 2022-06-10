import { useEffect, useRef, useState } from "react";
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/system/Box';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";

import Navbar from '../components/Navbar';
import BodyConfigList from "../components/SystemEditor/BodyConfigList";
import BodyConfigControls from "../components/SystemEditor/BodyConfigControls";
import TimeSettingsControls from "../components/TimeSettingsControls";

import SolarSystem from "../main/objects/system";

import { useAtom } from "jotai";
import { customSystemAtom, configTreeAtom, timeSettingsAtom } from "../App";
import OrbitDisplay from "../components/OrbitDisplay";
import Draw from "../main/libs/draw";
import BodyConfigUploadButton from "../components/SystemEditor/BodyConfigUploadButton";

function createBodyItems(system: SolarSystem) {
  const options =[<MenuItem key={system.sun.id} value={system.sun.name}>{system.sun.name}</MenuItem>];
  const bds = system.orbiting;
  for (let i = 0; i < bds.length; i++) {
      options.push(<MenuItem key={bds[i].id} value={bds[i].name}>{bds[i].name}</MenuItem>)
  }
  return options;
}

// const newWorker = () => new Worker(new URL("../workers/system.worker.ts", import.meta.url));
const systemLoaderWorker = new Worker(new URL("../workers/system.worker.ts", import.meta.url));

////////// App Content //////////
function SolarSystemAppContent() { 

  const [configTree] = useAtom(configTreeAtom);
  const [customSystem, setCustomSystem] = useAtom(customSystemAtom);
  const [timeSettings] = useAtom(timeSettingsAtom);

  const [bodyOptions, setBodyOptions] = useState(createBodyItems(customSystem));
  const [centralBodyName, setCentralBodyName] = useState(customSystem.sun.name);
  const [centralBody, setCentralBody] = useState(customSystem.sun);
  const [showHelp, setShowHelp] = useState(false);

  const centralBodyNameRef = useRef(centralBodyName);

  useEffect(() => {
    systemLoaderWorker.onmessage = (event: MessageEvent<ISolarSystem>) => {
        if (event && event.data) {
          const newSystem = new SolarSystem(event.data.sun, event.data.orbiters);
          setCustomSystem(newSystem);
          setBodyOptions(createBodyItems(newSystem));
          let newCentralBody = newSystem.bodies.find(bd => bd.name === centralBodyNameRef.current);
          if(!newCentralBody) {
            newCentralBody = newSystem.bodyFromId(centralBody.id)
          }
          setCentralBody(newCentralBody);
          setCentralBodyName(newCentralBody.name);
        }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [systemLoaderWorker]);
  
  useEffect(() => {
    systemLoaderWorker
      .postMessage(configTree.tree);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configTree]);

  useEffect(() => {
    centralBodyNameRef.current = centralBodyName;
    const newCentralBody = customSystem.bodyFromName(centralBodyName);
    setCentralBody(newCentralBody);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centralBodyName])

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
              <Box sx={{mx: 2, my: 2}}>
                <BodyConfigUploadButton />
              </Box>
              <BodyConfigList />
            </Paper>
          </Grid>
          <Grid item xs={12} sm={11} md={4} lg={4} xl={4}>
            <Paper 
              elevation={1}
              sx={{
                my: 1, 
                mx: 1, 
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <BodyConfigControls />
            </Paper>
          </Grid>
          <Grid item xs={12} sm={11} md={4} lg={5} xl={5}>
            <Paper 
              elevation={1}
              sx={{
                my: 1, 
                mx: 1, 
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Typography variant="h5" sx={{mx: 2, my: 2}}>Custom System</Typography>
              <FormControl sx={{mx: 2, my: 2}} >
                <InputLabel id={"body-select-label"}>Central Body</InputLabel>
                <Select
                    labelId={"body-select-label"}
                    label='Body'
                    id={'central-body'}
                    value={centralBodyName}
                    onChange={(e) => setCentralBodyName(e.target.value)}
                >
                    {bodyOptions}
                </Select>
              </FormControl>
              <OrbitDisplay 
                index={0}
                label={'Solar System'}
                slider={false}
                orbits={[] as IOrbit[]}
                trajectories={[] as Trajectory[]}
                startDate={0}
                endDate={0}
                marks={[]}
                centralBody={centralBody}
                defaultTraces={{systemTraces: Draw.drawSystemAtTime(centralBody, 0, timeSettings), orbitTraces: [] as Line3DTrace[]}}
                plotSize={centralBody.orbiters.length === 0 ? 10 * centralBody.radius : 2 * centralBody.furtherstOrbiterDistance}
              />
              <Box sx={{mx: 2, my: 2}}>
                <Typography variant="body1">Time Settings</Typography>
                <TimeSettingsControls />
              </Box>
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
