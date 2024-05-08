import {useTheme, FormControl, InputLabel, Box, Select} from '@mui/material';
import {tokens} from "../theme";

const AppSelect = ({...params}) => { 
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);

    return (
        <Box>
            <FormControl>
            <InputLabel
                style={{color: colors.greenAccent[400], fontSize: 16}}
            >
                {params.label}
            </InputLabel>
            <Select
                sx={{ minWidth: 125 }}
                blurOnSelect
                {...params}
            >
                {params.valuesFunc ? params.valuesFunc : ''}
            </Select>
            </FormControl>
        </Box>
    )
};

export default AppSelect;
