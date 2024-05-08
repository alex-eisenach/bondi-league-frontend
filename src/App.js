import './App.css';

import {useState}                   from 'react';
import {ColorModeContext, useMode}  from "./theme";
import {CssBaseline, ThemeProvider} from '@mui/material';
import {Routes, Route}              from "react-router-dom";

//import Topbar      from './scenes/global/topbar';
import Sidebar     from './scenes/global/sidebar';
import Dashboard   from './scenes/dashboard';
import Scorestable from './scenes/scorestable';
import League      from './scenes/league';
import Individual  from './scenes/individual';
import NewWeek     from './scenes/newweek';

function App() {

    const [theme, colorMode] = useMode();
    const [isSidebar, setIsSidebar] = useState(true);

    console.log('Beginning the app...')

    const latestWeek = '15';
    const latestYear = '2023';
        
    return (
        <ColorModeContext.Provider value={colorMode}>
            <ThemeProvider theme={theme}>
                <CssBaseline/>
                <div className='app'>
                    <Sidebar isSidebar={isSidebar}/>
                    <main className='content'>
                        {/* <Topbar setIsSidebar={setIsSidebar}/> */}
                        <Routes>
                            <Route path='/'            element={<Dashboard />} />
                            <Route path='/league'      element={<League  latestWeek={latestWeek} latestYear={latestYear}   />} />
                            <Route path='/individual'  element={<Individual latestWeek={latestWeek} latestYear={latestYear}/>} />
                            <Route path='/scorestable' element={<Scorestable />} />
                            <Route path='/addScores'   element={<NewWeek    />} />
                        </Routes>
                    </main>
                    {/*<svg ref={svgRef}></svg>*/}
                </div>
            </ThemeProvider>
        </ColorModeContext.Provider>
    )
}

export default App;
