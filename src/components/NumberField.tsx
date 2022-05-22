import React from "react";
import TextField from "@mui/material/TextField";

const RequiredNumberField = React.memo(function WrappedRequiredNumberField(props: any) {
    return (
        <TextField
            type="number"
            {...props}
            InputLabelProps={{ shrink: props.value !== ''}}
            error={isNaN(Number(props.value)) || props.value === '' || props.error} />
    )
}, (prevProps, nextProps) => prevProps.value === nextProps.value && prevProps.error === nextProps.error);

export const NumberField = React.memo(function WrappedNumberField(props: any) {
    return (
        <TextField
            type="number"
            {...props}
            InputLabelProps={{ shrink: true }}
            error={isNaN(Number(props.value)) || props.error} />
    )
}, (prevProps, nextProps) => prevProps.value === nextProps.value && prevProps.error === nextProps.error);

export default RequiredNumberField; 