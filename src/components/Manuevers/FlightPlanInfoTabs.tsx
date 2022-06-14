import React, {useState, useEffect} from "react";
import Stack from "@mui/material/Stack";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Divider from "@mui/material/Divider";

import FlightPlanInfo from "./FlightPlanInfo";
import GetLinkButton from "./GetLinkButton";

import { useAtom } from "jotai";
import { flightPlansAtom } from "../../App";


const FlightPlanInfoPanel = React.memo(function WrappedFlightTabInfoPanel({value, index, flightPlan}: {value: number, index: number, flightPlan: FlightPlan}) {
    
    return (
        <div style={{ display: (value === index ? 'block' : 'none'), width: "100%", height: "100%" }}>
            <FlightPlanInfo flightPlan={flightPlan} />
        </div>
    )
});

function FlightPlanInfoTabs() {
    const [flightPlans] = useAtom(flightPlansAtom);
    const [value, setValue] = useState(0);
    
    useEffect(() => {
        if(flightPlans.length > 0 && value >= flightPlans.length) {
            setValue(flightPlans.length - 1);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [flightPlans.length])

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    }

    return (
        <>   
            <Stack justifyContent="center" alignItems="center" sx={{mx: 2, my: 2}}>
                <GetLinkButton />
            </Stack>
            <Divider />
            <Tabs value={value} onChange={handleChange} variant="scrollable" scrollButtons={true}>
                {flightPlans.map((fp, index) => <Tab key={index} value={index} label={fp.name} ></Tab>)}
            </Tabs>
            {flightPlans.map((fp, index) => <FlightPlanInfoPanel key={index} value={value} index={index} flightPlan={fp}/>)}
        </>
    )
}

export default React.memo(FlightPlanInfoTabs);