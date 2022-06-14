import React, { useRef, useEffect } from "react";
import Button from "@mui/material/Button";
import UploadFileOutlined from "@mui/icons-material/UploadFileOutlined";
import { fileToSunConfig } from "../../main/utilities/loadPlanetConfig";

import { useAtom } from "jotai";
import { bodyConfigsAtom, editorSelectedNameAtom } from "../../App";

function SunConfigUploadButton() {
  const [bodyConfigs, setBodyConfigs] = useAtom(bodyConfigsAtom);
  const bodyConfigsRef = useRef(bodyConfigs);

  const [, setSelectedName] = useAtom(editorSelectedNameAtom);
  
  const handleFile = (e: any) => {
    const content = e.target.result;
    const newConfig = fileToSunConfig(content);
    console.log(newConfig);

    const newBodyConfigs = [newConfig, ...bodyConfigsRef.current.slice(1)];
    setBodyConfigs(newBodyConfigs);
    bodyConfigsRef.current = newBodyConfigs;
    setSelectedName(newConfig.name || newConfig.templateName as string);
    console.log("...Sun loaded from config.")
  }
  
  const handleChangeFile = (file: any) => {
    console.log("Reading sun config...")
    let fileData = new FileReader();
    fileData.onloadend = handleFile;
    fileData.readAsText(file);
  }

  useEffect(() => {
    bodyConfigsRef.current = bodyConfigs;
  }, [bodyConfigs])
  
  return ( <>
    <input
      type="file"
      accept=".cfg"
      style={{ display: 'none' }}
      id="uploaded-sun-config"
      onChange={e => handleChangeFile(e.target.files![0])}
      multiple={false}
    />
    <label htmlFor="uploaded-sun-config">
      <Button variant="text" 
              color="inherit" 
              component="span" 
              startIcon={<UploadFileOutlined />}
      >
        Upload Sun Config File
      </Button>
    </label>
  </>)
}

export default React.memo(SunConfigUploadButton, (prevProps, nextProps) => true);