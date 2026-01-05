import { Typography, Box, useTheme, useMediaQuery } from '@mui/material';
import { tokens } from '../theme';

const Header = ({ title, subtitle }) => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    return (
        <Box mb='30px'>
            <Typography
                variant={isMobile ? 'h3' : 'h2'}
                color={colors.grey[100]}
                fontWeight='bold'
            >
                {title}
            </Typography>
            <Typography
                variant={isMobile ? 'h6' : 'h5'}
                color={colors.greenAccent[400]}
            >
                {subtitle}
            </Typography>
        </Box>
    );
};

export default Header;