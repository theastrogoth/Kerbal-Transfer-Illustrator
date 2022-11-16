import React, { useEffect } from "react";
import TextField from "@mui/material/TextField";

const toHHMMSS = (hours: string, minutes: string, seconds: string) => {
  return [hours, minutes, seconds]
    .map((val) => (Number(val) < 10 ? `0`+String(Number(val)) : val))
    // .filter((val, index) => val !== "00" || index > 0)
    .join(":")
    // .replace(/^0/, "");
};

type HourMinSecProps = {
  hour:       number,
  setHour:    React.Dispatch<React.SetStateAction<number | undefined>>,
  minute:     number,
  setMinute:  React.Dispatch<React.SetStateAction<number | undefined>>,
  second:     number,
  setSecond:  React.Dispatch<React.SetStateAction<number | undefined>>,
  error:      boolean,
  disabled?:  boolean,
}

function HourMinSecField({hour, setHour, minute, setMinute, second, setSecond, error = false, disabled}: HourMinSecProps) {
  const [value, setValue] = React.useState(toHHMMSS(String(hour), String(minute), String(second)));

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value);
  };

  const onBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const value = event.target.value;
    const [str1, str2, str3] = value.split(":");
    
    const val = toHHMMSS(str1, str2, str3);
    setValue(val);

    setHour(Number(str1));
    setMinute(Number(str2));
    setSecond(Number(str3));
  };

  useEffect(() => {
    const [str1, str2, str3] = value.split(":");
    if(Number(hour) !== Number(str1) || Number(minute) !== Number(str2) || Number(second) !== Number(str3)) {
      setValue(toHHMMSS(String(hour), String(minute), String(second)))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hour, minute, second])

  return (
    <TextField 
      label="h:mm:ss"
      type="text" 
      onChange={onChange} 
      onBlur={onBlur}
      error={error} 
      value={value} 
      disabled={disabled}
    />
  )
}

export default HourMinSecField;