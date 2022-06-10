import React, { useRef, useEffect } from "react";
import Button from "@mui/material/Button";
import fileToBodyConfig from "../../main/utilities/loadPlanetConfig";
import UploadFileOutlined from "@mui/icons-material/UploadFileOutlined";

import { useAtom } from "jotai";
import { bodyConfigsAtom } from "../../App";

function BodyConfigUploadButton() {
  const [bodyConfigs, setBodyConfigs] = useAtom(bodyConfigsAtom);
  const bodyConfigsRef = useRef(bodyConfigs);
  
  const handleFile = (e: any) => {
    const content = e.target.result;
    const newConfig = fileToBodyConfig(content);

    let newName = newConfig.name || newConfig.templateName as string;
    const existingNames = bodyConfigsRef.current.map(c => c.name || c.templateName as string);        
    const newNameIsDuplicate = (name: string) => {
        return existingNames.find(existing => existing === name) !== undefined;
    }
    let counter = 1;
    while(newNameIsDuplicate(newName)) {
        newName = newConfig.name + "("+String(counter)+")";
    }
    console.log(newConfig.name, newName)
    newConfig.name = newName;

    const newBodyConfigs = [...bodyConfigsRef.current, newConfig];
    setBodyConfigs(newBodyConfigs);
    bodyConfigsRef.current = newBodyConfigs;
    console.log("...Body loaded from config.")
  }
  
  const handleChangeFile = (file: any) => {
    console.log("Reading body config...")
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
      id="uploaded-body-config"
      onChange={e => {
        for(let i=0; i<e.target.files!.length; i++) {
          handleChangeFile(e.target.files![i])
        }
      }}
      multiple={true}
    />
    <label htmlFor="uploaded-body-config">
      <Button variant="text" 
              color="inherit" 
              component="span" 
              startIcon={<UploadFileOutlined />}
      >
        Upload Kopernicus Configs
      </Button>
    </label>
  </>)
}

export default React.memo(BodyConfigUploadButton, (prevProps, nextProps) => true);