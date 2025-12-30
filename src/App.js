import { useState, useEffect } from 'react';
import { ColorModeContext, useMode } from "./theme";
import { CssBaseline, ThemeProvider, useMediaQuery } from '@mui/material';
import { Routes, Route, Navigate } from "react-router-dom";

import { MetadataProvider } from './context/MetadataContext';
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

    return (
        <ColorModeContext.Provider value={colorMode}>
            <ThemeProvider theme={theme}>
                <MetadataProvider>
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
                                <Route path='/league' element={<League />} />
                                <Route path='/individual' element={<Individual />} />
                                <Route path='/scorestable' element={<Scorestable />} />
                                <Route path='/addScores' element={<NewWeek />} />
                                <Route path='*' element={<Navigate to="/" replace />} />
                            </Routes>
                        </main>
                    </div>
                </MetadataProvider>
            </ThemeProvider>
        </ColorModeContext.Provider>
    )
}

export default App;
