import React, { useEffect, useRef, useState } from "react";
import Button from "@mui/material/Button";

import MultiFlyby from "../../main/objects/multiflyby";

import { useAtom } from "jotai";
import { atomWithHash } from "jotai/utils";
import { multiFlybyAtom } from "../../App";

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
    } catch(err) {
        obj = JSON.parse(str);
    }
    return obj;
}

const hashOpts = {
    serialize,
    deserialize,
    replaceState:   true,
};

const multiFlybyHashAtom = atomWithHash<IMultiFlyby | null>("multiFlyby", null, hashOpts);

const userAgent = navigator.userAgent;
const usingIE = userAgent.indexOf("Trident") > -1;

function GetLinkButton() {
    const [multiFlyby, setMultiFlyby] = useAtom(multiFlybyAtom);
    const [multiFlybyHash, setMultiFlybyHash] = useAtom(multiFlybyHashAtom);
    const multiFlybyRef = useRef(multiFlyby);
    const multiFlybyHashRef = useRef(multiFlyby.data);

    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if(multiFlybyHash !== null && multiFlybyHashRef.current !== multiFlybyHash) {
            multiFlybyHashRef.current = multiFlybyHash;
            const newMultiFlyby = new MultiFlyby(multiFlybyHash)
            setMultiFlyby(newMultiFlyby);
            multiFlybyRef.current = newMultiFlyby;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [multiFlybyHash])
    useEffect(() => {
        if(multiFlybyRef.current !== multiFlyby) {
            setCopied(false);
        }
    }, [multiFlyby])

    const handleClick = () => {
        setCopied(true);
        setMultiFlybyHash(multiFlyby.data);
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
                {!usingIE ? (copied ? "Copied!" : "Copy link to this Multi-Flyby") :
                            (copied ? "URL updated!" : "Update URL for this Multi-Flyby")    
                }   
            </Button>
        </>
    )
}

export default React.memo(GetLinkButton);