import React, { useEffect, useRef, useState } from "react";
import Button from "@mui/material/Button";

import Transfer from "../../main/objects/transfer";

import { useAtom } from "jotai";
import { atomWithHash } from "jotai/utils";
import { transferAtom } from "../../App";

const transferHashAtom = atomWithHash<ITransfer | null>("transfer", null);

const userAgent = navigator.userAgent;
const usingIE = userAgent.indexOf("Trident") > -1;

function GetLinkButton() {
    const [transfer, setTransfer] = useAtom(transferAtom);
    const [transferHash, setTransferHash] = useAtom(transferHashAtom);
    const transferRef = useRef(transfer);

    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if(transferHash !== null && transferRef.current !== transferHash) {
            const newTransfer = new Transfer(transferHash)
            setTransfer(newTransfer);
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