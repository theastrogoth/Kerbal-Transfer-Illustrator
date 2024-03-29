import React, { useRef, useEffect, useState } from "react";
import TextField from "@mui/material/TextField";
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

import { clamp } from "../main/libs/math";

type NumberFieldProps = {
    label:          string,
    value:          number | undefined,
    setValue:       React.Dispatch<React.SetStateAction<number | undefined>> | Function,
    step?:          number,
    max?:           number,
    min?:           number,
    error?:         boolean,
    sx?:            any,
    disabled?:      boolean,
    shift?:         number,
    useSetState?:   boolean,
}

type IncrementButtonProps = {
    value:          number | undefined,
    setValue:       React.Dispatch<React.SetStateAction<number | undefined>> | Function,
    step?:          number,
    max?:           number,
    min?:           number,
    text?:          string,
    style?:         any,
    disabled?:      boolean,
    useSetState?:   boolean,
}

function IncrementButton({value, setValue, step = 1, max = Infinity, min = -Infinity, text="+", disabled = false, useSetState = true, style={}}: IncrementButtonProps) {
    const counterRef = useRef(0);
    const intervalRef = useRef<null | NodeJS.Timer>(null);
    const prevValueRef = useRef(value);

    const handleIncrement = (event: React.MouseEvent | React.TouchEvent, count = 0) => {
        const numVal = Number(value);
        if(!isNaN(numVal)) {
            let increment = step;
            if(event.shiftKey) {
                increment *= 100;
            }
            if(event.ctrlKey || event.metaKey) {
                increment *= 10;
            }
            if(event.altKey) {
                increment *= 0.1;
            }
            if (useSetState) {
                setValue((prevValue) => clamp(Number(prevValue) + increment, min, max));
            } else {
                const newVal = clamp(Number(prevValueRef.current) + increment, min, max);
                setValue(newVal)
                prevValueRef.current = newVal;
            }
        } else if(value === undefined || isNaN(value)) {
            setValue(step)
            prevValueRef.current = step;
        }
    }

    const startIncrement = (event: React.MouseEvent | React.TouchEvent) => {
        if (intervalRef.current) return;
        prevValueRef.current = value;
        intervalRef.current = setInterval(() => {
            if(counterRef.current === 0) {
                counterRef.current += 1;
                handleIncrement(event);
            }else if(counterRef.current < 20) {
                counterRef.current += 1;
            } else {
                handleIncrement(event);
            }
        }, 20);
    };

    const stopIncrement = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            counterRef.current = 0;
        }
    };

    useEffect(() => {
        return () => stopIncrement(); // when App is unmounted we should stop counter
    }, []);

    return (
        <Button 
            id={text}
            variant='outlined'
            onMouseDown={startIncrement} 
            onMouseUp={stopIncrement}
            onMouseLeave={stopIncrement}
            onTouchStart={startIncrement}
            onTouchEnd={stopIncrement}
            // onTouchMove={stopIncrement}
            disabled={disabled}
            style={{    
                    mx: 0,
                    my: 0,
                    minWidth: '20px',
                    maxWidth: '25px',
                    padding: '0px 0px',
                    ...style,
                    }}
        >
            {text}
        </Button>
    )
}

const RequiredNumberField = React.memo(function WrappedRequiredNumberField({label, value, setValue, step = 1, max = Infinity, min = -Infinity, error = false, disabled = false, shift = 0, useSetState = true, sx = {}}: NumberFieldProps) {
    const [strVal, setStrVal] = useState((value === undefined || isNaN(value)) ? '' : String((value + shift)));
    const preventUpdate = useRef(false);
    useEffect(() => {
        if (preventUpdate.current) {
            preventUpdate.current = false;
        } else if (value === undefined || isNaN(value)) {
            setStrVal('');
        } else if(Number(strVal) !== (value + shift)) {
            setStrVal(String((value + shift)));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value])
    return (
    <Stack direction='row' spacing={0} sx={{marginBottom: 1}}>
        <IncrementButton 
            value={value} 
            setValue={setValue} 
            step={-step} 
            min={min}
            max={max}
            text="-"
            style={{borderRadius: "8px 0 0 8px"}} 
            disabled={disabled}
            useSetState={useSetState}
        />
        <TextField
            type="text"
            spellCheck={false}
            label={label}
            value={strVal}
            InputLabelProps={{ shrink: true }}
            error={error || value === undefined || isNaN(value) || value < min || value > max}
            onChange={(e) => {const str=e.target.value; setStrVal(str); setValue(str === '' ? undefined : Number(str) - shift); preventUpdate.current = true; }}
            sx={sx}
            disabled={disabled}
        />
        <IncrementButton 
            value={value} 
            setValue={setValue} 
            step={step} 
            min={min}
            max={max}
            text="+"
            style={{borderRadius: "0 8px 8px 0", marginRight: "8px" }} 
            disabled={disabled}
            useSetState={useSetState}
        />
    </Stack>

    )
}, (prevProps, nextProps) => prevProps.value === nextProps.value && prevProps.error === nextProps.error && prevProps.disabled === nextProps.disabled && prevProps.label === nextProps.label);

export const NumberField = React.memo(function WrappedNumberField({label, value, setValue, step = 1, max = Infinity, min = -Infinity, error = false, disabled=false, shift = 0, useSetState = true, sx = {}}: NumberFieldProps) {
    const [strVal, setStrVal] = useState((value === undefined || isNaN(value)) ? '' : String((value + shift)));
    const preventUpdate = useRef(false);
    useEffect(() => {
        if (preventUpdate.current) {
            preventUpdate.current = false;
        } else if (value === undefined || isNaN(value)) {
            setStrVal('');
        } else if(Number(strVal) !== (value + shift)) {
            setStrVal(String((value + shift)));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value])
    return (
        <Stack direction='row' spacing={0} sx={{marginBottom: 1}}>
            <IncrementButton 
                key={label + "-"}
                value={value} 
                setValue={setValue} 
                step={-step} 
                min={min}
                max={max}
                text="-"
                style={{borderRadius: "8px 0 0 8px"}}
                disabled={disabled}
                useSetState={useSetState}
            />
            <TextField
                type="text"
                spellCheck={false}
                label={label}
                value={strVal}
                InputLabelProps={{ shrink: true }}
                error={error || (!(value === undefined || isNaN(value)) && (value < min || value > max))}
                onChange={(e) => {const str=e.target.value; setStrVal(str); setValue(str === '' ? undefined : Number(str) - shift); preventUpdate.current = true; }}
                sx={sx}
                disabled={disabled}
            />
            <IncrementButton 
                key={label + "+"}
                value={value} 
                setValue={setValue} 
                step={step} 
                min={min}
                max={max}
                text="+"
                style={{borderRadius: "0 8px 8px 0", marginRight: "8px" }} 
                disabled={disabled}
                useSetState={useSetState}
            />
        </Stack>
    )
}, (prevProps, nextProps) => prevProps.value === nextProps.value && prevProps.error === nextProps.error && prevProps.disabled === nextProps.disabled && prevProps.label === nextProps.label);

export default RequiredNumberField; 