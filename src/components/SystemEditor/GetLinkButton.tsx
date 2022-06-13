import React, { useEffect, useRef, useState } from "react";
import Button from "@mui/material/Button";

import { useAtom } from "jotai";
import { atomWithHash } from "jotai/utils";
import { bodyConfigsAtom, systemScaleAtom, editorSelectedNameAtom } from "../../App";

const systemScaleHashAtom = atomWithHash<string | null>("systemScale", null);
const bodyConfigsHashAtom = atomWithHash<(SunConfig | OrbitingBodyConfig)[] | null>("bodyConfigs", null);

const userAgent = navigator.userAgent;
const usingIE = userAgent.indexOf("Trident") > -1;

function GetLinkButton() {
    const [systemScale, setSystemScale] = useAtom(systemScaleAtom);
    const [systemScaleHash, setSystemScaleHash] = useAtom(systemScaleHashAtom);
    const systemScaleRef = useRef(systemScale);

    const [bodyConfigs, setBodyConfigs] = useAtom(bodyConfigsAtom);
    const [bodyConfigsHash, setBodyConfigsHash] = useAtom(bodyConfigsHashAtom);
    const bodyConfigsRef = useRef(bodyConfigs);

    const [, setSelectedName] = useAtom(editorSelectedNameAtom);

    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if(systemScaleHash !== null && systemScaleRef.current !== systemScaleHash) {
            setSystemScale(systemScaleHash);
            systemScaleRef.current = systemScaleHash;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [systemScaleHash])
    
    useEffect(() => {
        if(systemScaleRef.current !== systemScale) {
            setCopied(false);
        }
    }, [systemScale])

    useEffect(() => {
        if(bodyConfigsHash !== null && bodyConfigsRef.current !== bodyConfigsHash) {
            setBodyConfigs(bodyConfigsHash);
            bodyConfigsRef.current = bodyConfigsHash;
            setSelectedName(bodyConfigsHash[0].name || bodyConfigsHash[0].templateName as string);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bodyConfigsHash])

    useEffect(() => {
        if(bodyConfigsRef.current !== bodyConfigs) {
            setCopied(false);
        }
    }, [bodyConfigs])

    const handleClick = () => {
        setCopied(true);
        setSystemScaleHash(systemScale);
        setBodyConfigsHash(bodyConfigs);
        if(!usingIE) {
            navigator.clipboard.writeText(window.location.href);
        }
    };

    return (
        <>
            <Button
                variant="text"
                onClick={handleClick}
            >
                {!usingIE ? (copied ? "Copied!" : "Copy link to this Custom System") :
                            (copied ? "URL updated!" : "Update URL for this Custom System")    
                }   
            </Button>
        </>
    )
}

export default React.memo(GetLinkButton);