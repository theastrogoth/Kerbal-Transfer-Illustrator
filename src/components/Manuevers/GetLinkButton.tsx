import React, { useEffect, useRef, useState } from "react";
import Button from "@mui/material/Button";

import SolarSystem from "../../main/objects/system";

import { useAtom } from "jotai";
import { atomWithHash } from "jotai/utils";
import { systemNameAtom, customSystemAtom, flightPlansAtom, vesselPlansAtom } from "../../App";
import { flightPlanToVessel } from "../../main/libs/propagate";

const systemNameHashAtom = atomWithHash<string | null>("systemName", null);
const customSystemHashAtom = atomWithHash<ISolarSystem | null>("customSystem", null)
const flightPlansHashAtom = atomWithHash<FlightPlan[] | null>("flightPlans", null);

const userAgent = navigator.userAgent;
const usingIE = userAgent.indexOf("Trident") > -1;

function GetLinkButton() {
    const [flightPlans, setFlightPlans] = useAtom(flightPlansAtom);
    const [, setVesselPlans] = useAtom(vesselPlansAtom);
    const [systemName, setSystemName] = useAtom(systemNameAtom);
    const [customSystem, setCustomSystem] = useAtom(customSystemAtom);

    const [flightPlansHash, setFlightPlansHash] = useAtom(flightPlansHashAtom);
    const [customSystemHash, setCustomSystemHash] = useAtom(customSystemHashAtom);
    const [systemNameHash, setSystemNameHash] = useAtom(systemNameHashAtom);

    const systemNameRef = useRef(systemName);
    const customSystemRef = useRef(customSystem);
    const flightPlansRef = useRef(flightPlans);

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
        if(flightPlansHash !== null && flightPlansRef.current !== flightPlansHash) {
            setFlightPlans(flightPlansHash);
            flightPlansRef.current = flightPlansHash;
            
            const newVesselPlans = flightPlansHash.map(fp => flightPlanToVessel(fp));
            setVesselPlans(newVesselPlans);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [flightPlansHash])

    useEffect(() => {
        if(flightPlansRef.current !== flightPlans || systemNameRef.current !== systemName || customSystemRef.current !== customSystem) {
            setCopied(false);
        }
    }, [systemName, flightPlans, customSystem])

    const handleClick = () => {
        setCopied(true);
        setSystemNameHash(systemName);
        setFlightPlansHash(flightPlans);
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