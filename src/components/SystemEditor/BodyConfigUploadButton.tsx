import React from "react";
import Button from "@mui/material/Button";
import fileToBodyConfig from "../../main/utilities/loadPlanetConfig";
import UploadFileOutlined from "@mui/icons-material/UploadFileOutlined";

function BodyConfigUploadButton({editorBodies, setEditorBodies}: {editorBodies: OrbitingBodyConfig[], setEditorBodies: React.Dispatch<React.SetStateAction<OrbitingBodyConfig[]>>}) {
  
  const handleFile = (e: any) => {
    const content = e.target.result;
    const newEditorBodies = [...editorBodies, fileToBodyConfig(content)];
    setEditorBodies(newEditorBodies);
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