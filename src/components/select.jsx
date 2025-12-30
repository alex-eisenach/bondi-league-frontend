import { useTheme, FormControl, InputLabel, Box, Select } from '@mui/material';
import { tokens } from "../theme";

const AppSelect = ({ label, valuesFunc, sx, ...params }) => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);

    return (
        <Box sx={{ m: '10px', ...sx }}>
            <FormControl fullWidth>
                <InputLabel
                    style={{ color: colors.greenAccent[400], fontSize: 16 }}
                >
                    {label}
                </InputLabel>
                <Select
                    sx={{ minWidth: 125 }}
                    blurOnSelect
                    label={label}
                    {...params}
                >
                    {valuesFunc || ''}
                </Select>
            </FormControl>
        </Box>
    )
};

export default AppSelect;
