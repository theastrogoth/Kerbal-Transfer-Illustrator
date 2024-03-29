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
import Button from "@mui/material/Button";
import ClearIcon from '@mui/icons-material/Clear';

import Navbar from '../components/Navbar';
import HelpCollapse from "../components/SystemEditor/HelpCollapse";
import { NumberField } from "../components/NumberField";
import BodyConfigList from "../components/SystemEditor/BodyConfigList";
import BodyConfigControls from "../components/SystemEditor/BodyConfigControls";
import TimeSettingsControls from "../components/TimeSettingsControls";
import BodyConfigUploadButton from "../components/SystemEditor/BodyConfigUploadButton";
import SunConfigUploadButton from "../components/SystemEditor/SunConfigUploadButton";
import OrbitDisplay from "../components/Display/OrbitDisplay";
import SelectProvidedConfigs from "../components/SystemEditor/SelectProvidedConfigs";
import GetLinkButton from "../components/SystemEditor/GetLinkButton";

import SolarSystem from "../main/objects/system";

import { atom, useAtom } from "jotai";
import { customSystemAtom, configTreeAtom, bodyConfigsAtom, editorSelectedNameAtom, systemScaleAtom } from "../App";
import InfoPopper from "../components/Display/InfoPopper";


function createBodyItems(system: SolarSystem) {
  const options =[<MenuItem key={system.sun.id} value={system.sun.name}>{system.sun.name}</MenuItem>];
  const bds = system.orbiting;
  for (let i = 0; i < bds.length; i++) {
      options.push(<MenuItem key={bds[i].id} value={bds[i].name}>{bds[i].name}</MenuItem>)
  }
  return options;
}

const systemLoaderWorker = new Worker(new URL("../workers/system.worker.ts", import.meta.url));

////////// App Content //////////
function SolarSystemAppContent() { 
  const [bodyConfigs, setBodyConfigs] = useAtom(bodyConfigsAtom);
  const [configTree] = useAtom(configTreeAtom);
  const [customSystem, setCustomSystem] = useAtom(customSystemAtom);
  const [, setEditorSelectedName] = useAtom(editorSelectedNameAtom);
  const [systemScale, setSystemScale] = useAtom(systemScaleAtom);

  const [bodyOptions, setBodyOptions] = useState(createBodyItems(customSystem));
  const centralBodyName = useRef(customSystem.sun.name);
  const [centralBody, setCentralBody] = useState(customSystem.sun);
  const [showHelp, setShowHelp] = useState(false);

  const infoItemAtom = atom<InfoItem>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);

  const [deleteBodiesTrigger, setDeleteBodiesTrigger] = useState(0);

  useEffect(() => {
    systemLoaderWorker.onmessage = (event: MessageEvent<ISolarSystem>) => {
        if (event && event.data) {
          const newSystem = new SolarSystem(event.data.sun, event.data.orbiters);
          setCustomSystem(newSystem);
          setBodyOptions(createBodyItems(newSystem));
          let newCentralBody = newSystem.bodies.find(bd => bd.name === centralBodyName.current);
          if(!newCentralBody) {
            newCentralBody = newSystem.sun;
          }
          setCentralBody(newCentralBody);
          centralBodyName.current = newCentralBody.name;
        }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [systemLoaderWorker]);
  
  useEffect(() => {
    systemLoaderWorker
      .postMessage({tree: configTree.tree, scale: systemScale});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configTree, systemScale]);

  useEffect(() => {
    if(deleteBodiesTrigger > 0) {
      // setTimeout( () => {
        setBodyConfigs([bodyConfigs[0]]);
      // }, 100)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deleteBodiesTrigger])

  ///// App Body /////
  return (
    <>
      <Navbar showHelp={showHelp} setShowHelp={setShowHelp} />
      <Stack sx={{mx: 4, my: 1}}>
        <CssBaseline />
        <Box component="div" textAlign='left' sx={{mx: 2, my: 3}}>
          <Typography variant="h4">Solar System Editor</Typography>
          <Divider />
        </Box>
        <HelpCollapse showHelp={showHelp} />
        <Grid container component='main' justifyContent="center">
          <Grid item xs={12} sm={5} md={4} lg={3} xl={3}>
            <Paper 
              elevation={1}
              sx={{
                my: 1, 
                mx: 1, 
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Stack spacing={2} sx={{mx: 2, my: 2}} >
                <SelectProvidedConfigs />
                <NumberField 
                  label="System Scale Factor"
                  value={systemScale}
                  setValue={setSystemScale}
                  min={0}
                  error={systemScale <= 0}
                />
              </Stack>
              <Stack spacing={1.5} sx={{mx: 2, my: 2}} alignItems='center' justifyContent='center'>
                <SunConfigUploadButton />
                <BodyConfigUploadButton />
                <Box component="div">
                  <Button
                    variant="text" 
                    color="inherit" 
                    component="span"
                    startIcon={<ClearIcon />}
                    onClick={() => {
                      setEditorSelectedName(customSystem.sun.name);
                      setCentralBody(customSystem.sun);
                      centralBodyName.current = customSystem.sun.name;
                      setDeleteBodiesTrigger(deleteBodiesTrigger + 1);
                    }}
                  >
                    Clear Bodies
                  </Button>
                </Box>

              </Stack>
              <Divider />
              <BodyConfigList />
            </Paper>
          </Grid>
          <Grid item xs={12} sm={5} md={4} lg={4} xl={4}>
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
          <Grid item xs={12} sm={12} md={4} lg={5} xl={5}>
            <Paper 
              elevation={1}
              sx={{
                my: 1, 
                mx: 1, 
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Stack alignItems="center" justifyContent="center" sx={{mx: 2, my: 2}}>
                <GetLinkButton />
              </Stack>
              <Divider />
              <Typography variant="h5" sx={{mx: 2, my: 2}}>Custom System</Typography>
              <Stack sx={{mx: 2, my: 2, maxWidth: '300px'}} >
                <FormControl>
                  <InputLabel id={"body-select-label"}>Central Body</InputLabel>
                  <Select
                      labelId={"body-select-label"}
                      label='Central Body'
                      id={'central-body'}
                      value={centralBodyName.current}
                      onChange={(e) => {
                        centralBodyName.current = e.target.value;
                        setCentralBody(customSystem.bodyFromName(e.target.value));
                      }}
                  >
                      {bodyOptions}
                  </Select>
                </FormControl>
              </Stack>
              <Box component="div" sx={{mx: 2, my: 2}}>
                <div ref={canvasRef}>
                  <OrbitDisplay 
                    label='Custom System'
                    index={0}
                    centralBody={centralBody} 
                    startDate={0.0} 
                    system={customSystem}
                    infoItemAtom={infoItemAtom}
                  />
                </div>
                <InfoPopper infoItemAtom={infoItemAtom} parentRef={canvasRef} system={customSystem} />
              </Box>
              <Box component="div" sx={{mx: 2, my: 2}}>
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
