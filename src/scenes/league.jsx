import { Box, MenuItem, Typography, useTheme, useMediaQuery } from '@mui/material';
import { DataGrid } from "@mui/x-data-grid";
import * as Plot from '@observablehq/plot';

import { useEffect, useRef, useState } from 'react';
import Header from "../components/header";
import AppSelect from '../components/select';
import StatBox from '../components/statsbox';
import { getLeagueStats } from "../data/data";
import { useMetadata } from '../context/MetadataContext';
import { tokens } from "../theme";

const League = () => {

    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const action = useRef(null);
    const { allWeeks, allYears, yearsToWeeks, latestWeek, latestYear, loading } = useMetadata();

    const [week, setWeek] = useState('');
    const [year, setYear] = useState('');
    const [flightMap, setFlightMap] = useState({});
    const [aWinner, setAWinner] = useState('?');
    const [bWinner, setBWinner] = useState('?');
    const [meanScore, setMeanScore] = useState('?');
    const [lowNet, setLowNet] = useState('?');

    // Initial defaults when metadata loads
    useEffect(() => {
        if (!loading) {
            setWeek(latestWeek);
            setYear(latestYear);
        }
    }, [loading, latestWeek, latestYear]);

    useEffect(() => {
        if (!week || !year) return;

        getLeagueStats(year, week).then(res => {
            const { flightMap: resFlightMap, summary } = res;
            if (!resFlightMap || !summary || !Object.keys(resFlightMap).length) return;

            const fd = resFlightMap;

            let grossScores = [];
            Object.keys(fd).forEach(e => { grossScores.push(fd[e].gross) })
            let netScores = [];
            Object.keys(fd).forEach(e => { netScores.push(fd[e].net) })
            const xMin = Math.min(...netScores);
            const xMax = Math.max(...grossScores);

            let testData = [];
            for (const [golfer, golferObj] of Object.entries(fd)) {
                let t = {};
                t['name'] = golfer;
                t['gross'] = golferObj.gross;
                t['net'] = golferObj.net;
                testData.push(t);
            }

            const containerWidth = action.current ? action.current.offsetWidth : (isMobile ? window.innerWidth - 60 : window.innerWidth - 320);

            const plot = Plot.plot({
                width: containerWidth,
                height: 400,
                marginBottom: 60,
                axis: null,
                grid: true,
                x: {
                    domain: [xMin - 5, xMax + 2]
                },
                marks: [
                    Plot.axisX({ fontSize: 14, anchor: 'top', tickPadding: 10, tickSize: 6 }),
                    Plot.gridX({ strokeOpacity: 0.25 }),
                    Plot.dot(testData, { x: 'gross', y: 'name', r: 5 }),
                    Plot.dot(testData, { x: 'net', y: 'name', r: 5, symbol: 'asterisk' }),
                    Plot.dot(testData, Plot.pointer({ x: 'net', y: 'name', r: 8, fill: colors.greenAccent[400], symbol: 'star', maxRadius: 10 })),
                    Plot.dot(testData, Plot.pointer({ x: 'gross', y: 'name', r: 8, fill: colors.greenAccent[400], maxRadius: 10 })),
                    Plot.ruleY(testData, Plot.groupY({ x1: 'min', x2: 'max' }, { x1: 'net', x2: 'gross', y: 'name', sort: { y: 'x1' }, strokeWidth: 3 })),
                    Plot.text(testData, { x: 'net', y: 'name', text: 'name', textAnchor: 'end', dx: -15, stroke: colors.greenAccent[400], strokeWidth: 0.5 }),
                    Plot.ruleX(testData, Plot.pointer({ x: 'net', py: 'name', stroke: colors.greenAccent[400], maxRadius: 10 })),
                    Plot.ruleX(testData, Plot.pointer({ x: 'gross', py: 'name', stroke: colors.greenAccent[400], maxRadius: 10 })),
                    Plot.text(testData, Plot.pointer({ x: 'net', py: 'name', frameAnchor: 'bottom', dy: 15, text: (d) => `${d.name} Net Score: ${d.net.toFixed(2)}`, fontSize: 14, maxRadius: 10 })),
                    Plot.text(testData, Plot.pointer({ x: 'gross', py: 'name', frameAnchor: 'bottom', dy: 15, text: (d) => `${d.name} Gross Score: ${d.gross.toFixed(0)}`, fontSize: 14, maxRadius: 10 })),
                ]
            });

            if (action.current) action.current.innerHTML = '';
            action.current.append(plot);

            setFlightMap(fd);
            setAWinner(summary.aWinner);
            setBWinner(summary.bWinner);
            setMeanScore(summary.meanScore);
            setLowNet(summary.lowNet);
            return () => plot.remove();
        });

    }, [year, week]);


    const rows = (flight) => {
        let rows = [];
        for (const [nameKey, obj] of Object.entries(flightMap)) {
            if (obj.flight == flight) {
                rows.push({
                    'Names': nameKey,
                    'Gross Score': obj.gross,
                    'Net Score': obj.net.toFixed(2),
                    'Handicap': obj.handicap.toFixed(1),
                    'id': nameKey,
                });
            }
        }
        return rows;
    };

    const columns = () => {
        let columns = [];
        columns.push({ field: 'Names', headerName: 'Golfers', width: 200 });
        columns.push({ field: 'Gross Score', headerName: 'Gross Score' });
        columns.push({ field: 'Handicap', headerName: '9-Hole Handicap', width: 150 });
        columns.push({ field: 'Net Score', headerName: 'Net Score' });

        return columns;
    }

    const changeWeek = (newWeek) => {
        setWeek(newWeek);
    }

    const changeYear = (newYear) => {
        setYear(newYear);
        // Automatically select first week of next year if current week not available
        if (yearsToWeeks[newYear] && !yearsToWeeks[newYear].includes(week)) {
            setWeek(yearsToWeeks[newYear][0]);
        }
    }

    return (
        <Box
            p='20px'
            textAlign='center'
            display="flex"
            flexDirection="column"
            sx={{ width: '100%', minHeight: 'calc(100vh - 80px)' }}
        >
            <Header title='League Stats Per Week' />

            <Box
                mt='20px'
                alignItems='center'
                justifyContent='center'
                display='flex'
                flexWrap='wrap'
            >
                <AppSelect
                    label='Year'
                    placeholder='year'
                    name='year'
                    onChange={e => changeYear(e.target.value)}
                    value={year}
                    sx={{
                        width: 200
                    }}
                    valuesFunc={
                        allYears.sort((a, b) => b - a).map((y, i) => {
                            return <MenuItem key={i} value={y}>{y}</MenuItem>
                        })
                    }
                />

                <AppSelect
                    label='Week'
                    placeholder='week'
                    name='week'
                    onChange={e => changeWeek(e.target.value)}
                    value={week}
                    sx={{
                        width: 200
                    }}
                    valuesFunc={
                        (yearsToWeeks[year])
                            ? [...yearsToWeeks[year]].sort((a, b) => parseInt(b) - parseInt(a)).map((y, i) => {
                                return <MenuItem key={i} value={y}>{y}</MenuItem>
                            })
                            : [<MenuItem key={0} value={week}>{week}</MenuItem>]
                    }
                />
            </Box>

            <Box
                mt='40px'
                justifyContent='center'
                display='flex'
                flexWrap='wrap'
                gap='20px'
            >
                <StatBox title='Avg Score' subtitle={meanScore} />
                <StatBox title='A Flight Winner' subtitle={aWinner} />
                <StatBox title='B Flight Winner' subtitle={bWinner} />
                <StatBox title='Low Net' subtitle={lowNet} />

            </Box>

            <Box
                alignItems='center'
                mt='40px'
                display='flex'
                flexDirection='column'
                width='100%'
            >
                <Box width='100%' display='flex' justifyContent='center'>
                    <div ref={action} style={{ width: '100%', display: 'flex', justifyContent: 'center' }} />
                </Box>

                <Box
                    display='flex'
                    flexDirection='row'
                    justifyContent='space-around'
                    mt='20px'
                >
                    <Typography
                        variant='h2'
                        fontWeight='bold'
                        padding='10px'
                        sx={
                            {
                                border: 1,
                                borderColor: colors.greenAccent[400],
                                borderRadius: '5%'
                            }
                        }
                    //sx = {{ color: colors.greenAccent[400] }}
                    >
                        A Flight
                    </Typography>

                    <Typography
                        variant='h2'
                        fontWeight='bold'
                        padding='10px'
                        sx={
                            {
                                border: 1,
                                borderColor: colors.greenAccent[400],
                                borderRadius: '5%'
                            }
                        }
                    //sx = {{ color: colors.greenAccent[400] }}
                    >
                        B Flight
                    </Typography>
                </Box>

                <Box
                    display='flex'
                    flexDirection='row'
                    mt='10px'
                >
                    <DataGrid
                        columns={columns()}
                        rows={rows('A')}
                        hideFooter={true}
                        initialState={{
                            sorting: {
                                sortModel: [{ field: 'Net Score', sort: 'asc' }]
                            }
                        }}
                        sx={{
                            flex: 1,
                            '& .MuiDataGrid-columnHeaders': {
                                color: `${colors.greenAccent[400]}`,
                                fontWeight: 800
                            }
                        }}
                    />
                    <DataGrid
                        columns={columns()}
                        rows={rows('B')}
                        hideFooter={true}
                        initialState={{
                            sorting: {
                                sortModel: [{ field: 'Net Score', sort: 'asc' }]
                            }
                        }}
                        sx={{
                            flex: 1,
                            marginLeft: '10px',
                            '& .MuiDataGrid-columnHeaders': {
                                color: `${colors.greenAccent[400]}`,
                                fontWeight: 800
                            }
                        }}
                    />
                </Box>
            </Box>
        </Box>
    )
}

export default League;