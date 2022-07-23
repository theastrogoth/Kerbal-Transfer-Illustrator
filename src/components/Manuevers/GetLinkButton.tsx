import React, { useEffect, useRef, useState } from "react";
import ReactGA from 'react-ga';
import Button from "@mui/material/Button";

import SolarSystem from "../../main/objects/system";

import { useAtom } from "jotai";
import { atomWithHash } from "jotai/utils";
import { systemNameAtom, customSystemAtom, vesselPlansAtom } from "../../App";

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

const systemNameHashAtom = atomWithHash<string | null>("systemName", null, {replaceState: true});
const customSystemHashAtom = atomWithHash<ISolarSystem | null>("customSystem", null, hashOpts)
const vesselPlansHashAtom = atomWithHash<IVessel[] | null>("vesselPlans", null, hashOpts);

const userAgent = navigator.userAgent;
const usingIE = userAgent.indexOf("Trident") > -1;

function GetLinkButton() {
    const [vesselPlans, setVesselPlans] = useAtom(vesselPlansAtom);
    const [systemName, setSystemName] = useAtom(systemNameAtom);
    const [customSystem, setCustomSystem] = useAtom(customSystemAtom);

    const [vesselPlansHash, setVesselPlansHash] = useAtom(vesselPlansHashAtom);
    const [customSystemHash, setCustomSystemHash] = useAtom(customSystemHashAtom);
    const [systemNameHash, setSystemNameHash] = useAtom(systemNameHashAtom);

    const systemNameRef = useRef(systemName);
    const customSystemRef = useRef(customSystem);
    const vesselPlansRef = useRef(vesselPlans);

    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if(systemNameHash !== null && systemNameRef.current !== systemNameHash) {
            setSystemName(systemNameHash);
            systemNameRef.current = systemNameHash;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [systemNameHash])

    useEffect(() => {
        if(customSystemHash !== null && customSystemRef.current !== customSystemHash && systemNameHash === 'Custom System') {
            const newSystem = new SolarSystem(customSystemHash.sun, customSystemHash.orbiters)
            setCustomSystem(newSystem);
            customSystemRef.current = newSystem;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [customSystemHash])

    useEffect(() => {
        if(vesselPlansHash !== null && vesselPlansRef.current !== vesselPlansHash) {
            ReactGA.event({
                category: "Hash",
                action: 'Load flight plan(s) from hash'
            })
            setVesselPlans(vesselPlansHash);
            vesselPlansRef.current = vesselPlansHash;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [vesselPlansHash])

    useEffect(() => {
        if(vesselPlansRef.current !== vesselPlans || systemNameRef.current !== systemName || customSystemRef.current !== customSystem) {
            setCopied(false);
        }
    }, [systemName, vesselPlans, customSystem])

    const handleClick = () => {
        ReactGA.event({
            category: "Button",
            action: 'Click "Get Link" button for flight plan(s)'
        })
        setCopied(true);
        setSystemNameHash(systemName);
        setVesselPlansHash(vesselPlans);
        if(systemName === "Custom System") {
            setCustomSystemHash(customSystem);
        }
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
                {!usingIE ? (copied ? "Copied!" : "Copy link to these Flight Plans") :
                            (copied ? "URL updated!" : "Update URL for these Flight Plans")    
                }   
            </Button>
        </>
    )
}

export default React.memo(GetLinkButton);