import React from "react";
import Button from "@mui/material/Button";
import Vessel from "../main/objects/vessel";
import saveFileToVessels from "../main/utilities/savedata";
import UploadFileOutlined from "@mui/icons-material/UploadFileOutlined";

function SaveFileUploadButton({system, setVessels}: {system: ISolarSystem, setVessels: React.Dispatch<React.SetStateAction<Vessel[]>>}) {
  
  const handleFile = (e: any) => {
    const content = e.target.result;
    setVessels(saveFileToVessels(content, system));
    console.log("...Orbits loaded from save data.")
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