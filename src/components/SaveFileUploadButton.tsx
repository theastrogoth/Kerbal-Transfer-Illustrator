import React from "react";
import ReactGA from "react-ga";
import Button from "@mui/material/Button";
import saveFileToVessels from "../main/utilities/loadSaveData";
import UploadFileOutlined from "@mui/icons-material/UploadFileOutlined";

import { useAtom } from "jotai";
import { systemAtom, vesselsAtom } from "../App";

function SaveFileUploadButton() {
  const [, setVessels] = useAtom(vesselsAtom);
  const [system] = useAtom(systemAtom);

  const handleFile = (e: any) => {
    const content = e.target.result;
    setVessels(saveFileToVessels(content, system));
    console.log("...Orbits loaded from save data.")
  }
  
  const handleChangeFile = (file: any) => {
    ReactGA.event({
      category: "Button",
      action:   "Upload a save file"
    })
    console.log("Reading save file...")
    let fileData = new FileReader();
    fileData.onloadend = handleFile;
    fileData.readAsText(file);
  }
  
  return ( <>
    <input
      type="file"
      accept=".sfs"
      style={{ display: 'none' }}
      id="uploaded-save-file"
      // @ts-ignore
      onChange={e => handleChangeFile(e.target.files[0])}
    />
    <label htmlFor="uploaded-save-file">
      <Button variant="text" 
              color="inherit" 
              component="span" 
              startIcon={<UploadFileOutlined />}
      >
        Upload Save File
      </Button>
    </label>
  </>)
}

export default React.memo(SaveFileUploadButton, (prevProps, nextProps) => true);