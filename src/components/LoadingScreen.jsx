import { Box, CircularProgress, Typography, useTheme } from "@mui/material";
import { tokens } from "../theme";

const LoadingScreen = ({ message = "Warming up the server... Please wait about 45 seconds." }) => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);

    return (
        <Box
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            minHeight="60vh"
            textAlign="center"
            p={3}
        >
            <CircularProgress
                size={60}
                thickness={4}
                sx={{
                    color: colors.greenAccent[500],
                    mb: 3,
                }}
            />
            <Typography
                variant="h4"
                sx={{
                    color: colors.grey[100],
                    mb: 2,
                    fontWeight: "bold",
                }}
            >
                {message}
            </Typography>
            <Typography
                variant="h6"
                sx={{
                    color: colors.grey[400],
                    fontStyle: "italic",
                }}
            >
                Connecting to Render...
            </Typography>
        </Box>
    );
};

export default LoadingScreen;
