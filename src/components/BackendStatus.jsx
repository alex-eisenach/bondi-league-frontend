import { Box, Typography, useTheme, keyframes } from "@mui/material";
import { useMetadata } from "../context/MetadataContext";
import { tokens } from "../theme";

const pulse = keyframes`
  0% { transform: scale(0.95); opacity: 0.7; }
  50% { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0.7; }
`;

const BackendStatus = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const { loading } = useMetadata();

    return (
        <Box
            display="flex"
            alignItems="center"
            backgroundColor={colors.primary[400]}
            p="5px 15px"
            borderRadius="20px"
            sx={{ border: `1px solid ${loading ? colors.red[500] : colors.greenAccent[500]}` }}
        >
            <Box
                sx={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    backgroundColor: loading ? colors.red[500] : colors.greenAccent[500],
                    marginRight: "10px",
                    animation: loading ? `${pulse} 1.5s infinite ease-in-out` : "none",
                }}
            />
            <Typography
                variant="h6"
                sx={{
                    color: loading ? colors.red[500] : colors.greenAccent[500],
                    fontWeight: "bold",
                }}
            >
                {loading ? "SERVER SPINNING UP..." : "SERVER LIVE"}
            </Typography>
        </Box>
    );
};

export default BackendStatus;
