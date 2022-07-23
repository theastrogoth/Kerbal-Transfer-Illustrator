import React, { useEffect, useRef, useState } from "react";
import ReactGA from 'react-ga';
import Button from "@mui/material/Button";

import Transfer from "../../main/objects/transfer";

import { useAtom } from "jotai";
import { atomWithHash } from "jotai/utils";
import { transferAtom, unrefinedTransferAtom } from "../../App";

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

const transferHashAtom = atomWithHash<ITransfer | null>("transfer", null, hashOpts);

const userAgent = navigator.userAgent;
const usingIE = userAgent.indexOf("Trident") > -1;

function GetLinkButton() {
    const [transfer, setTransfer] = useAtom(transferAtom);
    const [, setUnrefinedTransfer] = useAtom(unrefinedTransferAtom);
    const [transferHash, setTransferHash] = useAtom(transferHashAtom);
    const transferRef = useRef(transfer);

    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if(transferHash !== null && transferRef.current !== transferHash) {
            ReactGA.event({
                category: "Hash",
                action: 'Load transfer from hash'
            })
            const newTransfer = new Transfer(transferHash)
            setTransfer(newTransfer);
            setUnrefinedTransfer(newTransfer);
            transferRef.current = newTransfer;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [transferHash])
    useEffect(() => {
        if(transferRef.current !== transfer) {
            setCopied(false);
        }
    }, [transfer])

    const handleClick = () => {
        ReactGA.event({
            category: "Button",
            action: 'Click "Get Link" button for transfer'
        })
        setCopied(true);
        setTransferHash(transfer.data);
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
                {!usingIE ? (copied ? "Copied!" : "Copy link to this Transfer") :
                            (copied ? "URL updated!" : "Update URL for this Transfer")    
                }   
            </Button>
        </>
    )
}

export default React.memo(GetLinkButton);