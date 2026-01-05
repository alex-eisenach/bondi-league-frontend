import { Box, MenuItem, Typography, useTheme, useMediaQuery, Button, IconButton } from '@mui/material';
import { DataGrid } from "@mui/x-data-grid";
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import * as Plot from '@observablehq/plot';

import { useEffect, useRef, useState } from 'react';
import Header from "../components/header";
import AppSelect from '../components/select';
import StatBox from '../components/statsbox';
import LoadingScreen from '../components/LoadingScreen';
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
    const [excludedGolfers, setExcludedGolfers] = useState(new Set());
    const [rawStats, setRawStats] = useState(null);

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
            setRawStats(res);
        });
    }, [year, week]);

    useEffect(() => {
        if (!rawStats) return;

        const { flightMap: resFlightMap } = rawStats;
        if (!resFlightMap || !Object.keys(resFlightMap).length) return;

        // Filter and re-flight
        let activeGolfers = [];
        for (const [name, obj] of Object.entries(resFlightMap)) {
            if (!excludedGolfers.has(name)) {
                activeGolfers.push({ ...obj, name });
            }
        }

        // Re-calculate flights
        activeGolfers.sort((a, b) => a.handicap - b.handicap);
        const midpoint = Math.ceil(activeGolfers.length / 2);

        let newFlightMap = { ...resFlightMap };
        activeGolfers.forEach((g, i) => {
            newFlightMap[g.name] = {
                ...resFlightMap[g.name],
                flight: i < midpoint ? 'A' : 'B'
            };
        });

        const fd = newFlightMap;
        let grossScores = [];
        let netScores = [];
        let testData = [];

        activeGolfers.forEach(g => {
            grossScores.push(g.gross);
            netScores.push(g.net);
            testData.push({ name: g.name, gross: g.gross, net: g.net });
        });

        const xMin = activeGolfers.length ? Math.min(...netScores) : 0;
        const xMax = activeGolfers.length ? Math.max(...grossScores) : 100;

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

        if (action.current) {
            action.current.innerHTML = '';
            action.current.append(plot);
        }

        // Recalculate summary
        let aWinner = { name: '?', net: Infinity };
        let bWinner = { name: '?', net: Infinity };
        let totalGross = 0;
        let lowNet = { name: '?', net: Infinity };

        activeGolfers.forEach(g => {
            totalGross += g.gross;
            if (newFlightMap[g.name].flight === 'A' && g.net < aWinner.net) aWinner = { name: g.name, net: g.net };
            if (newFlightMap[g.name].flight === 'B' && g.net < bWinner.net) bWinner = { name: g.name, net: g.net };
            if (g.net < lowNet.net) lowNet = { name: g.name, net: g.net };
        });

        setFlightMap(fd);
        setAWinner(aWinner.name);
        setBWinner(bWinner.name);
        setMeanScore(activeGolfers.length > 0 ? (totalGross / activeGolfers.length).toFixed(1) : '?');
        setLowNet(lowNet.name !== '?' ? `${lowNet.name} (${lowNet.net.toFixed(2)})` : '?');

        return () => plot.remove();
    }, [rawStats, excludedGolfers, colors.greenAccent, isMobile]);


    const rows = (flight) => {
        let rows = [];
        for (const [nameKey, obj] of Object.entries(flightMap)) {
            const isExcluded = excludedGolfers.has(nameKey);
            if ((flight === 'Excluded' && isExcluded) || (obj.flight == flight && !isExcluded)) {
                rows.push({
                    'Names': nameKey,
                    'Gross Score': obj.gross,
                    'Net Score': obj.net.toFixed(2),
                    'Handicap': obj.handicap.toFixed(1),
                    'id': `${flight}-${nameKey}`,
                });
            }
        }
        return rows;
    };

    const handleToggleExclusion = (name) => {
        setExcludedGolfers(prev => {
            const next = new Set(prev);
            if (next.has(name)) next.delete(name);
            else next.add(name);
            return next;
        });
    };

    const columns = (isExcludedTable = false) => {
        let columns = [];
        columns.push({ field: 'Names', headerName: 'Golfers', width: 200 });
        columns.push({ field: 'Net Score', headerName: 'Net Score' });
        columns.push({ field: 'Gross Score', headerName: 'Gross Score' });
        columns.push({ field: 'Handicap', headerName: '9-Hole Handicap', width: 150 });
        columns.push({
            field: 'Action',
            headerName: '',
            width: 100,
            renderCell: (params) => (
                <IconButton
                    onClick={(e) => {
                        e.stopPropagation();
                        handleToggleExclusion(params.row.Names);
                    }}
                    color={isExcludedTable ? "success" : "error"}
                    size="medium"
                    sx={{ p: 1 }}
                >
                    {isExcludedTable ? <AddCircleOutlineIcon /> : <RemoveCircleOutlineIcon />}
                </IconButton>
            )
        });

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
            p={isMobile ? '10px' : '20px'}
            textAlign='center'
            display="flex"
            flexDirection="column"
            sx={{
                width: '100%',
                minHeight: 'calc(100vh - 80px)',
                overflowX: 'auto',
                '& > *': { minWidth: 'fit-content' }
            }}
        >
            <Header title='League Stats Per Week' />

            {loading ? (
                <LoadingScreen />
            ) : (
                <>
                    <Box
                        mt='20px'
                        alignItems='center'
                        justifyContent='center'
                        display='flex'
                        flexWrap='wrap'
                        sx={{ gap: '10px' }}
                    >
                        <AppSelect
                            label='Year'
                            placeholder='year'
                            name='year'
                            onChange={e => changeYear(e.target.value)}
                            value={year}
                            sx={{ width: 200 }}
                            valuesFunc={allYears.sort((a, b) => b - a).map((y, i) => (
                                <MenuItem key={i} value={y}>{y}</MenuItem>
                            ))}
                        />

                        <AppSelect
                            label='Week'
                            placeholder='week'
                            name='week'
                            onChange={e => changeWeek(e.target.value)}
                            value={week}
                            sx={{ width: 200 }}
                            valuesFunc={yearsToWeeks[year]
                                ? [...yearsToWeeks[year]].sort((a, b) => parseInt(b) - parseInt(a)).map((y, i) => (
                                    <MenuItem key={i} value={y}>{y}</MenuItem>
                                ))
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
                            <div ref={action} style={{ width: '100%', display: 'flex', justifyContent: 'center', minHeight: '400px' }} />
                        </Box>

                        <Box
                            display='flex'
                            flexDirection={isMobile ? 'column' : 'row'}
                            mt='20px'
                            width='100%'
                            gap='30px'
                        >
                            <Box flex={1} display='flex' flexDirection='column' alignItems='center' width='100%' gap='10px'>
                                <Typography
                                    variant='h2'
                                    fontWeight='bold'
                                    padding='10px'
                                    sx={{
                                        border: 1,
                                        borderColor: colors.greenAccent[400],
                                        borderRadius: '5%',
                                        width: isMobile ? '80%' : '100%',
                                        textAlign: 'center',
                                        mb: '10px'
                                    }}
                                >
                                    A Flight
                                </Typography>
                                <Box width='100%' sx={{ minWidth: 0, overflow: 'auto' }}>
                                    <DataGrid
                                        id="a-flight-grid"
                                        columns={columns()}
                                        rows={rows('A')}
                                        hideFooter={true}
                                        initialState={{
                                            sorting: {
                                                sortModel: [{ field: 'Net Score', sort: 'asc' }]
                                            }
                                        }}
                                        autoHeight
                                        sx={{
                                            '& .MuiDataGrid-columnHeaders': {
                                                color: `${colors.greenAccent[400]}`,
                                                fontWeight: 800
                                            }
                                        }}
                                    />
                                </Box>
                            </Box>

                            <Box flex={1} display='flex' flexDirection='column' alignItems='center' width='100%' gap='10px'>
                                <Typography
                                    variant='h2'
                                    fontWeight='bold'
                                    padding='10px'
                                    sx={{
                                        border: 1,
                                        borderColor: colors.greenAccent[400],
                                        borderRadius: '5%',
                                        width: isMobile ? '80%' : '100%',
                                        textAlign: 'center',
                                        mb: '10px'
                                    }}
                                >
                                    B Flight
                                </Typography>
                                <Box width='100%' sx={{ minWidth: 0, overflow: 'auto' }}>
                                    <DataGrid
                                        id="b-flight-grid"
                                        columns={columns(false)}
                                        rows={rows('B')}
                                        hideFooter={true}
                                        initialState={{
                                            sorting: {
                                                sortModel: [{ field: 'Net Score', sort: 'asc' }]
                                            }
                                        }}
                                        autoHeight
                                        sx={{
                                            '& .MuiDataGrid-columnHeaders': {
                                                color: `${colors.greenAccent[400]}`,
                                                fontWeight: 800
                                            }
                                        }}
                                    />
                                </Box>
                            </Box>
                        </Box>

                        <Box mt='40px' width='100%' display='flex' flexDirection='column' alignItems='center' gap='10px'>
                            <Typography
                                variant='h2'
                                fontWeight='bold'
                                padding='10px'
                                sx={{
                                    border: 1,
                                    borderColor: colors.red[500],
                                    borderRadius: '5%',
                                    width: isMobile ? '80%' : '50%',
                                    textAlign: 'center',
                                    mb: '10px'
                                }}
                            >
                                Not In League
                            </Typography>
                            <Box width={isMobile ? '100%' : '80%'} sx={{ minWidth: 0, overflow: 'auto' }}>
                                <DataGrid
                                    id="excluded-flight-grid"
                                    columns={columns(true)}
                                    rows={rows('Excluded')}
                                    hideFooter={true}
                                    initialState={{
                                        sorting: {
                                            sortModel: [{ field: 'Net Score', sort: 'asc' }]
                                        }
                                    }}
                                    autoHeight
                                    sx={{
                                        '& .MuiDataGrid-columnHeaders': {
                                            color: `${colors.red[500]}`,
                                            fontWeight: 800
                                        }
                                    }}
                                />
                            </Box>
                        </Box>
                    </Box>
                </>
            )}
        </Box>
    );
};

export default League;