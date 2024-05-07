import { Box, useTheme, Typography } from '@mui/material';
import { tokens } from '../theme';

const StatBox = ({ title, subtitle, statColor=null }) => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const borderColor = (!statColor) ? colors.greenAccent[400] : statColor;

    return (
        <Box >
            <Box
                display='flex'
                flexDirection='column'
                justifyContent='space-evenly'
                //width='200px'
                //minHeight='85px'
                padding='10px'
                m='0 10px'
                sx = {
                    {
                        border: 1,
                        borderColor: {borderColor},
                        borderRadius: '5%'
                    }
                }
            >
                <Box justifyContent='left'>
                    <Typography
                        variant='h6'
                        //fontWeight='bold'
                        sx = {{ color: colors.greenAccent[400] }}
                    >
                        {title}
                    </Typography>
                </Box>
                <Box display='flex' justifyContent='space-evenly'>
                    <Typography
                        variant='h4'
                        fontWeight='bold'
                        sx = {{ color: colors.grey[100] }}
                    >
                        {subtitle}
                    </Typography>
                </Box>
            </Box>
        </Box>
    )
}

export default StatBox;