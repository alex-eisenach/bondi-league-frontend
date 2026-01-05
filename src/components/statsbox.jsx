import { Box, useTheme, Typography } from '@mui/material';
import { tokens } from '../theme';

const StatBox = ({ title, subtitle, statColor = null }) => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const borderColor = (!statColor) ? colors.greenAccent[400] : statColor;

    return (
        <Box sx={{ flex: '1 1 150px', maxWidth: '300px' }}>
            <Box
                display='flex'
                flexDirection='column'
                justifyContent='space-evenly'
                padding='15px'
                m='5px'
                sx={
                    {
                        border: 1,
                        borderColor: borderColor,
                        borderRadius: '8px',
                        height: '100%',
                        minHeight: '80px',
                        transition: 'transform 0.2s',
                        '&:hover': { transform: 'scale(1.02)' }
                    }
                }
            >
                <Box justifyContent='left'>
                    <Typography
                        variant='h6'
                        sx={{ color: borderColor, fontSize: '0.9rem', opacity: 0.9 }}
                    >
                        {title}
                    </Typography>
                </Box>
                <Box display='flex' justifyContent='center' mt='5px'>
                    <Typography
                        variant='h4'
                        fontWeight='bold'
                        sx={{ color: colors.grey[100], wordBreak: 'break-word', textAlign: 'center' }}
                    >
                        {subtitle}
                    </Typography>
                </Box>
            </Box>
        </Box>
    )
}

export default StatBox;