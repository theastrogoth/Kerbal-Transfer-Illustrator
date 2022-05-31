import React from "react";
import Button from "@mui/material/Button";
import Vessel from "../../main/objects/vessel";
import saveFileToVessels from "../../main/utilities/loadSaveData";
import UploadFileOutlined from "@mui/icons-material/UploadFileOutlined";

function BodyConfigUploadButton({system, setVessels}: {system: ISolarSystem, setVessels: React.Dispatch<React.SetStateAction<Vessel[]>>}) {
  
  const handleFile = (e: any) => {
    const content = e.target.result;
    setVessels(saveFileToVessels(content, system));
    console.log("...Body loaded from config.")
  }
  
  const handleChangeFile = (file: any) => {
    console.log("Reading body config...")
    let fileData = new FileReader();
    fileData.onloadend = handleFile;
    fileData.readAsText(file);
  }
  
  return ( <>
    <input
      type="file"
      accept=".cfg"
      style={{ display: 'none' }}
      id="uploaded-body-config"
      // @ts-ignore
      onChange={e => handleChangeFile(e.target.files[0])}
      multiple={true}
    />
    <label htmlFor="uploaded-body-config">
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

export default React.memo(BodyConfigUploadButton, (prevProps, nextProps) => true);