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

  const handleSfsFile = (e: any) => {
    const content = e.target.result;
    const {vessels, landedVessels} = saveFileToVessels(content, system, "sfs");
    setVessels(vessels);
    setLandedVessels(landedVessels);
    console.log("...Vessels loaded from KSP1 save data.")
  }

  const handleJsonFile = (e: any) => {
    const content = e.target.result;
    const {vessels, landedVessels} = saveFileToVessels(content, system, "json");
    setVessels(vessels);
    setLandedVessels(landedVessels);
    console.log("...Vessels loaded from KSP2 save data.")
  }
  
  const handleChangeFile = (file: any) => {
    console.log("Reading save file " + file.name + "...")
    const extension = file.name.split('.').pop();
    let fileData = new FileReader();
    fileData.onloadend = extension === "json" ? handleJsonFile : handleSfsFile;
    fileData.readAsText(file);
  }
  
  return ( <>
    <input
      type="file"
      accept=".sfs,.json"
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
        Load Save File
      </Button>
    </label>
  </>)
}

export default React.memo(SaveFileUploadButton, (prevProps, nextProps) => true);