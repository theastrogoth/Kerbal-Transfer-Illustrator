import React, { useEffect, useRef, useState } from "react";
import Button from "@mui/material/Button";

import { useAtom } from "jotai";
import { atomWithHash } from "jotai/utils";
import { bodyConfigsAtom, systemScaleAtom, editorSelectedNameAtom } from "../../App";

import CJSON from "../../main/utilities/cjson";
import{ compress, decompress } from "../../main/utilities/shrinkString"; 

const serialize = (obj: any) => {
    const str = CJSON.stringify(obj);
    const compressedStr = compress(str);
    return compressedStr;
}

const deserialize = (str: string) => {
    let obj: any;
    try {
        const decompressedStr = decompress(str);
        obj = CJSON.parse(decompressedStr);
    } catch {
        obj = JSON.parse(str);
    }
    return obj;
}

const hashOpts = {
    serialize,
    deserialize,
    replaceState:   true,
};

const systemScaleHashAtom = atomWithHash<number | null>("systemScale", null, {replaceState: true});
const bodyConfigsHashAtom = atomWithHash<(SunConfig | OrbitingBodyConfig)[] | null>("bodyConfigs", null, hashOpts);

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