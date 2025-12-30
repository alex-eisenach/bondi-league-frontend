import { Autocomplete, Box, MenuItem, TextField, useTheme, useMediaQuery } from '@mui/material';
import * as Plot from '@observablehq/plot';
import { useEffect, useRef, useState } from 'react';
import Header from "../components/header";
import AppSelect from '../components/select';
import StatBox from '../components/statsbox';
import { getGolferStats } from "../data/data";
import { useMetadata } from '../context/MetadataContext';
import { tokens } from "../theme";

const Individual = () => {

    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const action = useRef(null);
    const { allWeeks, allYears, allNames, latestWeek, latestYear, loading } = useMetadata();

    const [startWeek, setStartWeek] = useState('1');
    const [endWeek, setEndWeek] = useState('');
    const [startYear, setStartYear] = useState('2022');
    const [endYear, setEndYear] = useState('');
    const [golfer, setGolfer] = useState('');
    const [handicap, setHandicap] = useState(0.0);
    const [trend, setTrend] = useState(0.0);
    const [bestScore, setBestScore] = useState(0.0);
    const [avgScore, setAvgScore] = useState(0.0);

    // Initial defaults when metadata loads
    useEffect(() => {
        if (!loading) {
            setEndWeek(latestWeek);
            setEndYear(latestYear);
            setStartYear(latestYear);
        }
    }, [loading, latestWeek, latestYear]);

    function* tickCallbackTracker(_dates) {
        let yrTrack = null;
        for (const s of _dates) {
            const [yr, _, __] = s.split(' ');
            if (yr !== yrTrack) {
                yrTrack = yr;
                yield s
            }
            else {
                yield null
            }
        }
    }

    const changeHandler = e => {
        const { name, value } = e.target;
        if (name === 'startWeek') setStartWeek(value);
        if (name === 'endWeek') setEndWeek(value);
        if (name === 'startYear') setStartYear(value);
        if (name === 'endYear') setEndYear(value);
    };

    const changeGolfer = golfer => {
        setGolfer(golfer);
    };


    useEffect(() => {
        if (!allWeeks.length || !golfer) { return }

        getGolferStats(
            golfer,
            startYear,
            startWeek,
            endYear,
            endWeek
        ).then(stats => {
            if (!stats || !stats.scores || stats.scores.length < 2) return;

            const { handicap: _handicap, trend: _trend, avgScore: _avgScore, scores, dates } = stats;
            const intercept = Array.isArray(_trend[0]) ? _trend[0][0] : _trend[0];
            const slope = Array.isArray(_trend[1]) ? _trend[1][0] : _trend[1];

            // Handle plot update
            const genYearTicks = tickCallbackTracker([...dates]);
            let yrTicks = [];
            for (const _date of genYearTicks) {
                if (_date) { yrTicks.push(_date) }
            }

            const trendX = [...Array(scores.length).keys()];
            const trendY = trendX.map(x => x * slope + intercept);

            const plot = Plot.plot({
                width: isMobile ? (window.innerWidth - 60) : (window.innerWidth - 320),
                height: isMobile ? 300 : 500,
                marginBottom: 60,
                y: {
                    grid: true,
                    domain: [Math.min(...scores) - 5, Math.max(...scores) + 5],
                },
                x: {
                    domain: dates
                },
                marks: [
                    Plot.ruleY([Math.min(...scores) - 5]),
                    Plot.axisX({
                        tickSize: 8,
                        tickPadding: -4,
                        tickFormat: (s, i) => {
                            if (dates.length > 10) {
                                return ` ${dates[i].split(' ')[2]}`;
                            } else {
                                return ` WK ${dates[i].split(' ')[2]}`;
                            }
                        },
                        textAnchor: 'start',
                        fontSize: 10
                    }),
                    Plot.axisX({
                        ticks: yrTicks,
                        tickSize: 26,
                        tickPadding: -8,
                        tickFormat: (s, i) => ` ${(yrTicks[i]) ? yrTicks[i].split(' ')[0] : yrTicks[i]}`,
                        textAnchor: 'start',
                        fontSize: 12
                    }),
                    Plot.axisY({
                        fontSize: 12
                    }),
                    Plot.gridX(),
                    Plot.dot(
                        scores,
                        {
                            x: dates,
                            y: scores,
                            symbol: 'star',
                            fill: colors.grey[100],
                            r: 5
                        }
                    ),
                    Plot.dot(
                        scores,
                        Plot.pointer({
                            x: dates,
                            y: scores,
                            symbol: 'star',
                            fill: colors.greenAccent[400],
                            r: 8
                        }),
                    ),
                    Plot.text(
                        scores,
                        Plot.pointer({
                            x: dates,
                            y: scores,
                            dy: 15,
                            text: (d, i) => `Net Score: ${(scores[i] - _handicap).toFixed(1)}`,
                            fontSize: 14
                        }),
                    ),
                    Plot.line(
                        scores,
                        {
                            x: dates,
                            y: trendY,
                            stroke: slope > 0 ? colors.red[400] : colors.greenAccent[400],
                            strokeDasharray: '8,8',
                        }
                    )
                ]
            });
            if (action.current) action.current.innerHTML = '';
            action.current.append(plot);
            setHandicap(_handicap);
            setTrend(slope);
            setBestScore(Math.min(...scores));
            setAvgScore(_avgScore);

            return () => plot.remove();
        });

    },
        [golfer, endYear, endWeek, startYear, startWeek, isMobile, allWeeks]
    );

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
            <Header title='Individual Golfer' />

            <Box
                mt='20px'
                alignItems='center'
                justifyContent='center'
                display='flex'
            >
                <Autocomplete
                    renderInput={(params) =>
                        <TextField {...params} sx={{ input: { textAlign: 'center' } }} />}
                    options={allNames}
                    //style={{color: colors.greenAccent[400], fontSize: 16}}
                    selectOnFocus={false}
                    autoHighlight
                    autoComplete
                    blurOnSelect
                    onChange={(_, value, __) => changeGolfer(value)}
                    sx={{
                        width: 250
                    }}
                >
                </Autocomplete>
            </Box>

            {golfer !== '' && (
                <Box
                    mt='50px'
                    justifyContent='center'
                    alignItems='center'
                    display='flex'
                    flexWrap='wrap'
                >

                    <AppSelect
                        label="Start Week"
                        placeholder='startWeek'
                        name='startWeek'
                        onChange={changeHandler}
                        value={startWeek}
                        valuesFunc={
                            allWeeks.map((week, i) => {
                                if (parseInt(week) <= parseInt(endWeek)) {
                                    return <MenuItem key={i} value={week}>{week}</MenuItem>
                                }
                            })
                        }
                    />
                    <AppSelect
                        label="End Week"
                        placeholder='endWeek'
                        name='endWeek'
                        onChange={changeHandler}
                        value={endWeek}
                        valuesFunc={allWeeks.slice().sort((a, b) => parseInt(b) - parseInt(a)).map((week, i) => {
                            if (parseInt(week) >= parseInt(startWeek)) {
                                return <MenuItem key={i} value={week}>{week}</MenuItem>
                            }
                        })}
                    />
                    <AppSelect
                        label="Start Year"
                        placeholder='startYear'
                        name='startYear'
                        onChange={changeHandler}
                        value={startYear}
                        valuesFunc={allYears.map((year, i) => {
                            if (parseInt(year) <= parseInt(endYear)) {
                                return <MenuItem key={i} value={year}>{year}</MenuItem>
                            }
                        })}
                    />
                    <AppSelect
                        label="End Year"
                        placeholder='endYear'
                        name='endYear'
                        onChange={changeHandler}
                        value={endYear}
                        valuesFunc={allYears.map((year, i) => {
                            if (parseInt(year) >= parseInt(startYear)) {
                                return <MenuItem key={i} value={year}>{year}</MenuItem>
                            }
                        })}
                    />
                </Box>
            )}

            {golfer !== '' && (
                <Box
                    mt='15px'
                    //justifyContent='end'
                    alignItems='center'
                    display='flex'
                    flexDirection={isMobile ? 'column' : 'row'}
                    padding='10px 0'
                    ml={isMobile ? '0' : '20px'}
                >

                    <Box width={isMobile ? '100%' : 'auto'}>
                        <div ref={action} />
                    </Box>

                    <Box
                        display='flex'
                        flexDirection={isMobile ? 'row' : 'column'}
                        justifyContent='space-evenly'
                        mb='25px'
                        width={isMobile ? '100%' : 'auto'}
                        flexWrap={isMobile ? 'wrap' : 'nowrap'}
                    >
                        <StatBox
                            title='Avg Score'
                            subtitle={`${avgScore.toFixed(1)}`}
                        />
                        <StatBox
                            title='Handicap'
                            subtitle={`${handicap.toFixed(1)}`}
                        />
                        <StatBox
                            title='Trend'
                            subtitle={((trend > 0.0) ? "+" : "").concat(`${trend.toFixed(2)}`)}
                            statColor={(trend < 0.0) ? colors.greenAccent[400] : colors.red[400]}
                        />
                        <StatBox
                            title='Best Score'
                            subtitle={`${bestScore}`}
                        />
                    </Box>
                </Box>
            )}
        </Box>
    )
};

export default Individual;