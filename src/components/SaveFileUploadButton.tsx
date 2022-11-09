import React from "react";
import Button from "@mui/material/Button";
import saveFileToVessels from "../main/utilities/loadSaveData";
import UploadFileOutlined from "@mui/icons-material/UploadFileOutlined";

import { useAtom } from "jotai";
import { systemAtom, vesselsAtom, landedVesselsAtom } from "../App";

function SaveFileUploadButton() {
  const [, setVessels] = useAtom(vesselsAtom);
  const [, setLandedVessels] = useAtom(landedVesselsAtom);
  const [system] = useAtom(systemAtom);

  const handleFile = (e: any) => {
    const content = e.target.result;
    const {vessels, landedVessels} = saveFileToVessels(content, system);
    setVessels(vessels);
    setLandedVessels(landedVessels);
    console.log("...Vessels loaded from save data.")
  }
  
  const handleChangeFile = (file: any) => {
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