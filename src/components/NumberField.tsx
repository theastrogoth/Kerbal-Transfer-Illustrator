import React, { useRef, useEffect } from "react";
import TextField from "@mui/material/TextField";
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

import { clamp } from "../main/libs/math";

type NumberFieldProps = {
    label:      string,
    value:      string,
    setValue:   React.Dispatch<React.SetStateAction<string>> | Function,
    step?:      number,
    max?:       number,
    min?:       number,
    error?:     boolean,
    onChange?:  (event: React.ChangeEvent<HTMLInputElement>) => void,
    sx?:        any,
}

type IncrementButtonProps = {
    value:      string,
    setValue:   React.Dispatch<React.SetStateAction<string>> | Function,
    step?:      number,
    max?:       number,
    min?:       number,
    text?:      string,
    style?:     any,
}

function IncrementButton({value, setValue, step = 1, max = Infinity, min = -Infinity, text="+", style={}}: IncrementButtonProps) {
    const counterRef = useRef(0);
    const intervalRef = useRef<null | NodeJS.Timer>(null);

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
            setValue((prevValue) => String(clamp(Number(prevValue) + increment, min, max)))
        } else if(value === '') {
            setValue('1')
        }
    }

    const startIncrement = (event: React.MouseEvent | React.TouchEvent) => {
        if (intervalRef.current) return;
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
            onTouchMove={stopIncrement}
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

const RequiredNumberField = React.memo(function WrappedRequiredNumberField({label, value, setValue, step = 1, max = Infinity, min = -Infinity, error = false, onChange = (e) => {}, sx = {}}: NumberFieldProps) {
    const numValue = Number(value);
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
        />
        <TextField
            type="text"
            spellCheck={false}
            label={label}
            value={value}
            InputLabelProps={{ shrink: true }}
            error={isNaN(numValue) || numValue < min || numValue > max || error}
            onChange={onChange}
            sx={sx}
        />
        <IncrementButton 
            value={value} 
            setValue={setValue} 
            step={step} 
            min={min}
            max={max}
            text="+"
            style={{borderRadius: "0 8px 8px 0", marginRight: "8px" }} 
        />
    </Stack>

    )
}, (prevProps, nextProps) => prevProps.value === nextProps.value && prevProps.error === nextProps.error);

export const NumberField = React.memo(function WrappedNumberField({label, value, setValue, step = 1, max = Infinity, min = -Infinity, error = false, onChange = (e) => {}, sx = {}}: NumberFieldProps) {
    const numValue = Number(value);
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
                style={{borderRadius: "8px 0 0 8px"}
            } 
            />
            <TextField
                type="text"
                spellCheck={false}
                label={label}
                value={value}
                InputLabelProps={{ shrink: true }}
                error={isNaN(numValue) || numValue < min || numValue > max || error}
                onChange={onChange}
                sx={sx}
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
            />
        </Stack>
    )
}, (prevProps, nextProps) => prevProps.value === nextProps.value && prevProps.error === nextProps.error);

export default RequiredNumberField; 