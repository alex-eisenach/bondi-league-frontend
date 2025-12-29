import { useState } from 'react';
import { ColorModeContext, useMode } from "./theme";
import { CssBaseline, ThemeProvider, useMediaQuery } from '@mui/material';
import { Routes, Route } from "react-router-dom";

import Topbar from './scenes/global/topbar';
import Sidebar from './scenes/global/sidebar';
import Dashboard from './scenes/dashboard';
import Scorestable from './scenes/scorestable';
import League from './scenes/league';
import Individual from './scenes/individual';
import NewWeek from './scenes/newweek';

function App() {

    const [theme, colorMode] = useMode();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const [isSidebarToggled, setIsSidebarToggled] = useState(false);

    console.log('Beginning the app...')

    const latestWeek = '15';
    const latestYear = '2023';

    return (
        <ColorModeContext.Provider value={colorMode}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <div className='app'>
                    <Sidebar
                        isToggled={isSidebarToggled}
                        setIsToggled={setIsSidebarToggled}
                    />
                    <main className='content'>
                        <Topbar setIsSidebarToggled={setIsSidebarToggled} />
                        <Routes>
                            <Route path='/' element={<Dashboard />} />
                            <Route path='/league' element={<League latestWeek={latestWeek} latestYear={latestYear} />} />
                            <Route path='/individual' element={<Individual latestWeek={latestWeek} latestYear={latestYear} />} />
                            <Route path='/scorestable' element={<Scorestable />} />
                            <Route path='/addScores' element={<NewWeek />} />
                        </Routes>
                    </main>
                </div>
            </ThemeProvider>
        </ColorModeContext.Provider>
    )
}

export default App;
