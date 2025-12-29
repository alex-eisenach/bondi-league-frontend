import { Box, MenuItem, Typography, useTheme } from '@mui/material';
import { DataGrid } from "@mui/x-data-grid";
import * as Plot from '@observablehq/plot';

import { useEffect, useRef, useState } from 'react';
import Header from "../components/header";
import AppSelect from '../components/select';
import StatBox from '../components/statsbox';
import { getAllData, getLeagueStats, weeksForYear } from "../data/data";
import { tokens } from "../theme";

const League = (props) => {

    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const action = useRef(null);

    const [data, setData] = useState({
        week: props.latestWeek,
        year: props.latestYear,
        allWeeks: [],
        allYears: [],
        allStrs: [],
        allNames: [],
        allData: [],
        flightMap: [],
        aWinner: '?',
        bWinner: '?',
        meanScore: '?',
        lowNet: '?',
    });

    const yearChangeCallback = () => {
        if (!data.week) { return '' }
        const wksForYr = weeksForYear(data.allData, data.year);
        if (!wksForYr.includes(data.week)) {
            setData({ ...data, 'week': wksForYr[0] })
            return wksForYr[0];
        } else {
            return data.week
        };
    };

    useEffect(() => {
        getAllData().then(
            (d) => dataHandler(d)
        ).then(console.log('Data is now loaded'));
    }, []);

    useEffect(() => {
        if (!data.week || !data.year) return;

        getLeagueStats(data.year, data.week).then(res => {
            const { flightMap, summary } = res;
            if (!flightMap || !summary || !Object.keys(flightMap).length) return;

            const fd = flightMap;

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

            const plot = Plot.plot({
                width: 1260, height: 400,
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

            setData(
                {
                    ...data,
                    'flightMap': fd,
                    'aWinner': summary.aWinner,
                    'bWinner': summary.bWinner,
                    'meanScore': summary.meanScore,
                    'lowNet': summary.lowNet,
                }
            );
            return () => plot.remove();
        });

    }, [data.allData, data.year, data.week]);

    const dataHandler = ((_allData) => {
        const [weeks, years, strs, names, _data] = _allData;
        setData({
            ...data,
            'allWeeks': [...weeks],
            'allYears': [...years],
            'allStrs': [...strs],
            'allNames': [...names],
            'allData': [..._data],
        })
    });

    const rows = (flight) => {
        let rows = [];
        for (const [nameKey, obj] of Object.entries(data.flightMap)) {
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

    const changeWeek = (week) => {
        setData({ ...data, 'week': week })
    }

    const changeYear = (year) => {
        setData({ ...data, 'year': year })
    }

    return (
        <Box
            mt='25px'
            textAlign='center'
            alignItems='center'
            justifyContent='center'
            sx={{ maxWidth: 'xl' }}
        >
            <Header title='League Stats Per Week' />

            <Box
                mt='20px'
                alignItems='center'
                justifyContent='center'
                display='flex'
            >
                <AppSelect
                    label='Year'
                    placeholder='year'
                    name='year'
                    onChange={e => { setData({ ...data, [e.target.name]: e.target.value }) }}
                    value={data.year}
                    sx={{
                        width: 200
                    }}
                    valuesFunc={
                        data.allYears.sort((a, b) => b - a).map((y, i) => {
                            return <MenuItem key={i} value={y}>{y}</MenuItem>
                        })
                    }
                />

                <AppSelect
                    label='Week'
                    placeholder='week'
                    name='week'
                    onChange={e => { setData({ ...data, [e.target.name]: e.target.value }) }}
                    value={yearChangeCallback()}
                    sx={{
                        width: 200
                    }}
                    valuesFunc={
                        (data.allData.length)
                            ? weeksForYear(data.allData, data.year).sort((a, b) => b - a).map((y, i) => {
                                return <MenuItem key={i} value={y}>{y}</MenuItem>
                            })
                            : [<MenuItem key={0} value={data.week}>{data.week}</MenuItem>]
                    }
                />
            </Box>

            <Box
                mt='40px'
                justifyContent='space-evenly'
                display='flex'
                sx={
                    {
                        minWidth: '125px'
                    }
                }
            >
                <StatBox title='Avg Score' subtitle={data.meanScore} />
                <StatBox title='A Flight Winner' subtitle={data.aWinner} />
                <StatBox title='B Flight Winner' subtitle={data.bWinner} />
                <StatBox title='Low Net' subtitle={data.lowNet} />

            </Box>

            <Box
                alignItems='center'
                mt='40px'
            >
                <Box>
                    <div ref={action} />
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