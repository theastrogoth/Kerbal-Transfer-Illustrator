import React, { useEffect, useRef, useState } from "react";
import Button from "@mui/material/Button";

import MultiFlyby from "../../main/objects/multiflyby";

import { useAtom } from "jotai";
import { atomWithHash } from "jotai/utils";
import { multiFlybyAtom } from "../../App";

const multiFlybyHashAtom = atomWithHash<IMultiFlyby | null>("multiFlyby", null);

const userAgent = navigator.userAgent;
const usingIE = userAgent.indexOf("Trident") > -1;

function GetLinkButton() {
    const [multiFlyby, setMultiFlyby] = useAtom(multiFlybyAtom);
    const [multiFlybyHash, setMultiFlybyHash] = useAtom(multiFlybyHashAtom);
    const multiFlybyRef = useRef(multiFlyby);

    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if(multiFlybyHash !== null && multiFlybyRef.current !== multiFlybyHash) {
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