import { Box } from '@mui/material';
import Header from '../../components/header';
const Dashboard = () => {
    return (
        <Box m='75px' alignItems='center'>
            <Box display='flex' justifyContent='space-between' alignItems='center'>
                <Header title='Choose an item on the left' subtitle="and don't forget to suck with pace" />
            </Box>
            <Box display='flex' justifyContent='space-evenly' alignItems='center' mt='100px'>
                <img
                    alt='profile-user'
                    width='90%'
                    height='90%'
                    src={`../../assets/bondi_splash.jpg`}
                    style={{cursor: 'pointer', borderRadius: '1%'}}
                />
            </Box>
        </Box>
    );
};

export default Dashboard;