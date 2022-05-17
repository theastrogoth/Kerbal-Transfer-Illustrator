import React, { useEffect } from "react";
import TextField from "@mui/material/TextField";

const toHHMMSS = (secs: number) => {
  const secNum = isNaN(secs) ? 0 : secs;
  const hours = Math.floor(secNum / 3600);
  const minutes = Math.floor(secNum / 60) % 60;
  const seconds = secNum % 60;

  return [hours, minutes, seconds]
    .map((val) => (val < 10 ? `0${val}` : val))
    // .filter((val, index) => val !== "00" || index > 0)
    .join(":")
    // .replace(/^0/, "");
};

const getSecondsFromHHMMSS = (value: string) => {
  const [str1, str2, str3] = value.split(":");

  const val1 = Number(str1);
  const val2 = Number(str2);
  const val3 = Number(str3);

  if (!isNaN(val1) && isNaN(val2) && isNaN(val3)) {
    return val1;
  }

  if (!isNaN(val1) && !isNaN(val2) && isNaN(val3)) {
    return val1 * 60 + val2;
  }

  if (!isNaN(val1) && !isNaN(val2) && !isNaN(val3)) {
    return val1 * 60 * 60 + val2 * 60 + val3;
  }

  return NaN;
};

function HourMinSecField({sec, setSec, error = false}: {sec: string, setSec: React.Dispatch<React.SetStateAction<string>>, error: boolean}) {
  const [value, setValue] = React.useState(toHHMMSS(Number(sec)));

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value);
  };

  const onBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const value = event.target.value;
    const seconds = getSecondsFromHHMMSS(value);
    const time = toHHMMSS(seconds);
    setValue(time);

    const secString = isNaN(seconds) ? '' : String(seconds);
    setSec(secString);
  };

  useEffect(() => {
    if(sec !== value) {
      setValue(toHHMMSS(Number(sec)))
    }
  }, [sec])

  return (
    <TextField 
      label="h:mm:ss"
      type="text" 
      onChange={onChange} 
      onBlur={onBlur}
      error={error} 
      value={value} />
  )
}

export default HourMinSecField;