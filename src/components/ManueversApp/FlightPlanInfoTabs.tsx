import React, {useState, useEffect} from "react";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";

import SolarSystem from "../../main/objects/system";

import FlightPlanInfo, { FlightPlanInfoProps } from "./FlightPlanInfo";

type FlightPlanInfoTabsProps = {
    flightPlans:         FlightPlan[],
    timeSettings:        TimeSettings,
    system:              SolarSystem,
    copiedOrbit:         IOrbit, 
    setCopiedOrbit:      React.Dispatch<React.SetStateAction<IOrbit>>, 
    copiedManeuver:      ManeuverComponents, 
    setCopiedManeuver:   React.Dispatch<React.SetStateAction<ManeuverComponents>>, 
    copiedFlightPlan:    IVessel, 
    setCopiedFlightPlan: React.Dispatch<React.SetStateAction<IVessel>>
}

const FlightPlanInfoPanel = React.memo(function WrappedFlightTabInfoPanel({value, index, props}: {value: number, index: number, props: FlightPlanInfoProps}) {
    const [infoProps, setInfoProps] = useState(props);

    useEffect(() => {
        setInfoProps(props);
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [props]);

    return (
        <div style={{ display: (value === index ? 'block' : 'none'), width: "100%", height: "100%" }}>
            <FlightPlanInfo {...infoProps}/>
        </div>
    )
});

function FlightPlanInfoTabs({flightPlans, system, timeSettings, copiedOrbit, setCopiedOrbit, copiedManeuver, setCopiedManeuver, copiedFlightPlan, setCopiedFlightPlan}: FlightPlanInfoTabsProps) {
    const [value, setValue] = useState(0);

    const [allInfoProps, setAllInfoProps] = useState([] as FlightPlanInfoProps[]);

    useEffect(() => {
        const newProps = flightPlans.map((f) => { return {flightPlan: f, system, timeSettings, copiedOrbit, setCopiedOrbit, copiedManeuver, setCopiedManeuver, copiedFlightPlan, setCopiedFlightPlan}});
        setAllInfoProps(newProps);
      // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [flightPlans]);
    
    useEffect(() => {
        if(allInfoProps.length > 0 && value >= allInfoProps.length) {
            setValue(allInfoProps.length - 1);
        }
    }, [allInfoProps.length])

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    }

    return (
        <>
            <Tabs value={value} onChange={handleChange} variant="scrollable" scrollButtons={true}>
                {allInfoProps.map((props, index) => <Tab key={index} value={index} label={props.flightPlan.name} ></Tab>)}
            </Tabs>
            {allInfoProps.map((props, index) => <FlightPlanInfoPanel key={index} value={value} index={index} props={props}/>)}
        </>
    )
}

export default FlightPlanInfoTabs;