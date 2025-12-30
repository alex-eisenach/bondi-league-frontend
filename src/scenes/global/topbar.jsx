import { Box, IconButton, useTheme, useMediaQuery } from '@mui/material';
import { useContext } from "react";
import { ColorModeContext } from "../../theme";
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import BackendStatus from '../../components/BackendStatus';

const Topbar = ({ setIsSidebarToggled }) => {
    const theme = useTheme();
    const colorMode = useContext(ColorModeContext);
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    return (
        <Box display='flex'
            justifyContent='space-between'
            alignItems='center'
            p={2}
        >
            <Box display="flex">
                {isMobile && (
                    <IconButton
                        onClick={() => setIsSidebarToggled(true)}
                        sx={{ mr: 1 }}
                    >
                        <MenuOutlinedIcon />
                    </IconButton>
                )}
            </Box>
            <Box display='flex' alignItems='center' gap="15px">
                {!isMobile && <BackendStatus />}
                <IconButton onClick={colorMode.toggleColorMode}>
                    {theme.palette.mode === 'dark' ? (
                        <DarkModeOutlinedIcon />
                    ) : (
                        <LightModeOutlinedIcon />
                    )}
                </IconButton>
            </Box>
        </Box>
    );
};

export default Topbar;