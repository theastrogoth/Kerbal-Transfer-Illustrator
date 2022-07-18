import React from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import Tooltip from "@mui/material/Tooltip";


function WarpButtons({speed, setSpeed, intervalRef, startWarp, stopWarp}: {speed: number, setSpeed: React.Dispatch<React.SetStateAction<number>>, intervalRef: React.MutableRefObject<null | NodeJS.Timer>, startWarp: (() => void), stopWarp: (() => void)}) {

    return (
        <Stack spacing={0.1} direction="row">
            <Tooltip title="Pause">
                <IconButton size="small" disableRipple color={speed === 0 ? "success" : "inherit"} onClick={() => {setSpeed(0); stopWarp();}} sx={{width: '20px', height: '20px'}} >
                    <PauseIcon />
                </IconButton>
            </Tooltip>
            <Tooltip title="1x">
                <IconButton size="small" disableRipple color={speed >= 1 ? "success" : "inherit"} onClick={() => {setSpeed(1); if(!intervalRef.current) startWarp();}} sx={{width: '20px', height: '20px'}} >
                    <PlayArrowIcon />
                </IconButton>
            </Tooltip>
            <Tooltip title="10x">
                <IconButton size="small" disableRipple color={speed >= 10 ? "success" : "inherit"} onClick={() => {setSpeed(10); if(!intervalRef.current) startWarp();}} sx={{width: '20px', height: '20px'}} >
                    <PlayArrowIcon />
                </IconButton>
            </Tooltip>
            <Tooltip title="50x">
                <IconButton size="small" disableRipple color={speed >= 50 ? "success" : "inherit"} onClick={() => {setSpeed(50); if(!intervalRef.current) startWarp();}} sx={{width: '20px', height: '20px'}} >
                    <PlayArrowIcon />
                </IconButton>
            </Tooltip>
            <Tooltip title="100x">
                <IconButton size="small" disableRipple color={speed >= 100 ? "success" : "inherit"} onClick={() => {setSpeed(100); if(!intervalRef.current) startWarp();}} sx={{width: '20px', height: '20px'}} >
                    <PlayArrowIcon />
                </IconButton>
            </Tooltip>
            <Tooltip title="500x">
                <IconButton size="small" disableRipple color={speed >= 500 ? "success" : "inherit"} onClick={() => {setSpeed(500); if(!intervalRef.current) startWarp();}} sx={{width: '20px', height: '20px'}} >
                    <PlayArrowIcon />
                </IconButton>
            </Tooltip>
            <Tooltip title="1,000x">
                <IconButton size="small" disableRipple color={speed >= 1000 ? "success" : "inherit"} onClick={() => {setSpeed(1000); if(!intervalRef.current) startWarp();}} sx={{width: '20px', height: '20px'}} >
                    <PlayArrowIcon />
                </IconButton>
            </Tooltip>
            <Tooltip title="10,000x">
                <IconButton size="small" disableRipple color={speed >= 10000 ? "success" : "inherit"} onClick={() => {setSpeed(10000); if(!intervalRef.current) startWarp();}} sx={{width: '20px', height: '20px'}} >
                    <PlayArrowIcon />
                </IconButton>
            </Tooltip>
            <Tooltip title="100,000x">
                <IconButton size="small" disableRipple color={speed >= 100000 ? "success" : "inherit"} onClick={() => {setSpeed(100000); if(!intervalRef.current) startWarp();}} sx={{width: '20px', height: '20px'}} >
                    <PlayArrowIcon />
                </IconButton>
            </Tooltip>
            <Tooltip title={<Box component="div" textAlign="center">1,000,000x<br />Photosensitivity Warning!</Box>} >
                <IconButton size="small" disableRipple color={speed >= 1000000 ? "success" : "inherit"} onClick={() => {setSpeed(1000000); if(!intervalRef.current) startWarp();}} sx={{width: '20px', height: '20px'}} >
                    <PlayArrowIcon />
                </IconButton>
            </Tooltip>
            <Tooltip title={<Box component="div" textAlign="center">10,000,000x<br />Photosensitivity Warning!</Box>} >
                <IconButton size="small" disableRipple color={speed >= 10000000 ? "success" : "inherit"} onClick={() => {setSpeed(10000000); if(!intervalRef.current) startWarp();}} sx={{width: '20px', height: '20px'}} >
                    <PlayArrowIcon />
                </IconButton>
            </Tooltip>
            <Tooltip title={<Box component="div" textAlign="center">100,000,000x<br />Photosensitivity Warning!</Box>} >
                <IconButton size="small" disableRipple color={speed >= 100000000 ? "success" : "inherit"} onClick={() => {setSpeed(100000000); if(!intervalRef.current) startWarp();}} sx={{width: '20px', height: '20px'}}>
                    <PlayArrowIcon />
                </IconButton>
            </Tooltip>
        </Stack>
    )
}

export default WarpButtons;