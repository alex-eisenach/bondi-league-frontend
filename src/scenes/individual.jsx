import { Autocomplete, Box, MenuItem, TextField, Typography, useTheme, useMediaQuery } from '@mui/material';
import * as Plot from '@observablehq/plot';
import { useEffect, useRef, useState } from 'react';
import Header from "../components/header";
import AppSelect from '../components/select';
import StatBox from '../components/statsbox';
import LoadingScreen from '../components/LoadingScreen';
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

    const [hcapDetails, setHcapDetails] = useState(null);

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
        if (!golfer) return;

        getGolferStats(golfer).then(stats => {
            if (!stats || !stats.scores || stats.scores.length === 0) {
                setHcapDetails({ notEnough: true });
                return;
            }

            const { scores, dates, handicap: _handicap } = stats;
            const nRounds = 8;
            const slopeGlobal = 113;
            const uteSlope = 124;
            const slopeUteCreek = slopeGlobal / uteSlope;
            const rating = 69.3 / 2.0;

            if (scores.length <= 2) {
                setHcapDetails({ notEnough: true, totalScores: scores.length });
            } else {
                // Pick last 20 scores from ALL-TIME history
                const lastTwenty = scores.length > 20 ? scores.slice(-20) : scores;
                const lastTwentyDates = dates.length > 20 ? dates.slice(-20) : dates;

                // Sort and slice to find best scores
                const sorted = [...lastTwenty].sort((a, b) => a - b);
                const bestScores = sorted.slice(0, Math.min(nRounds, sorted.length));
                const meanBest = bestScores.reduce((a, b) => a + b, 0) / bestScores.length;

                // Mark which scores are "best" (handling duplicates)
                const bestCounts = {};
                bestScores.forEach(s => bestCounts[s] = (bestCounts[s] || 0) + 1);

                const detailedScores = lastTwenty.map((s, i) => {
                    let isBest = false;
                    if (bestCounts[s] > 0) {
                        isBest = true;
                        bestCounts[s]--;
                    }
                    return {
                        score: s,
                        date: lastTwentyDates[i],
                        isBest
                    };
                });

                setHcapDetails({
                    scores: detailedScores,
                    meanBest,
                    slopeUteCreek,
                    rating,
                    nRoundsUsed: bestScores.length,
                    totalInWindow: lastTwenty.length,
                    handicap: _handicap,
                    notEnough: false
                });
            }
        });
    }, [golfer]);


    useEffect(() => {
        if (!allWeeks.length || !golfer) { return }

        getGolferStats(
            golfer,
            startYear,
            startWeek,
            endYear,
            endWeek
        ).then(stats => {
            if (!stats || !stats.scores || stats.scores.length === 0) {
                return;
            }

            const { handicap: _handicap, trend: _trend, avgScore: _avgScore, scores, dates } = stats;
            const intercept = Array.isArray(_trend[0]) ? _trend[0][0] : _trend[0];
            const slope = Array.isArray(_trend[1]) ? _trend[1][0] : _trend[1];

            if (scores.length < 2) return;
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
                        fontSize: isMobile ? 10 : 15
                    }),
                    Plot.axisX({
                        ticks: yrTicks,
                        tickSize: 26,
                        tickPadding: -8,
                        tickFormat: (s, i) => ` ${(yrTicks[i]) ? yrTicks[i].split(' ')[0] : yrTicks[i]}`,
                        textAnchor: 'start',
                        fontSize: isMobile ? 12 : 18
                    }),
                    Plot.axisY({
                        fontSize: isMobile ? 12 : 18
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
                            fontSize: isMobile ? 14 : 21
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
        [golfer, endYear, endWeek, startYear, startWeek, isMobile, allWeeks, colors.greenAccent, colors.grey, colors.red]
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

            {loading ? (
                <LoadingScreen />
            ) : (
                <>
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
                            selectOnFocus={false}
                            autoHighlight
                            autoComplete
                            blurOnSelect
                            onChange={(_, value) => changeGolfer(value)}
                            sx={{
                                width: 250
                            }}
                        />
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
                                        return null;
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
                                    return null;
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
                                    return null;
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
                                    return null;
                                })}
                            />
                        </Box>
                    )}

                    {golfer !== '' && (
                        <Box
                            mt='15px'
                            alignItems='center'
                            display='flex'
                            flexDirection='column'
                            padding='10px 0'
                            width='100%'
                        >
                            <Box width='100%' display='flex' justifyContent='center'>
                                <div ref={action} />
                            </Box>

                            <Box
                                display='flex'
                                flexDirection='row'
                                justifyContent='space-evenly'
                                mt='30px'
                                width='100%'
                                flexWrap='wrap'
                                gap='20px'
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

                    {golfer !== '' && hcapDetails && (
                        <Box
                            mt='50px'
                            p={isMobile ? '20px' : '40px'}
                            mb='40px'
                            sx={{
                                bgcolor: colors.primary[400],
                                borderRadius: '12px',
                                width: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center'
                            }}
                        >
                            <Typography variant='h3' fontWeight='bold' mb='30px' color={colors.greenAccent[400]}>
                                Handicap Verification
                            </Typography>

                            {hcapDetails.notEnough ? (
                                <Box p='20px' sx={{ border: 1, borderColor: colors.red[400], borderRadius: '8px' }}>
                                    <Typography variant='h5' color={colors.red[500]} fontWeight='bold'>
                                        INSUFFICIENT DATA
                                    </Typography>
                                    <Typography variant='body1' mt='10px'>
                                        A minimum of 3 scores is required to calculate a handicap. Currently recorded: {hcapDetails.totalScores || 0}
                                    </Typography>
                                </Box>
                            ) : (
                                <>
                                    <Typography variant='h5' mb='25px' color={colors.grey[200]}>
                                        Recent Score History (Last {hcapDetails.totalInWindow})
                                    </Typography>

                                    <Box width='100%' display='flex' justifyContent='center' mb='40px'>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '30px', width: 'fit-content' }}>
                                            {(() => {
                                                const groupedByYear = {};
                                                hcapDetails.scores.forEach(s => {
                                                    const year = s.date.split(' ')[0];
                                                    if (!groupedByYear[year]) groupedByYear[year] = [];
                                                    groupedByYear[year].push(s);
                                                });
                                                const sortedYears = Object.keys(groupedByYear).sort((a, b) => b - a);

                                                return sortedYears.map(year => (
                                                    <Box key={year} display='flex' flexDirection='row' alignItems='center'>
                                                        {/* Year Label */}
                                                        <Box sx={{ minWidth: '80px', textAlign: 'right', mr: '20px' }}>
                                                            <Typography variant='h5' fontWeight='bold' color={colors.grey[300]}>
                                                                {year}
                                                            </Typography>
                                                        </Box>

                                                        {/* Scores Row */}
                                                        <Box display='flex' flexWrap='wrap' justifyContent='flex-start' gap='10px'>
                                                            {groupedByYear[year].map((s, i) => (
                                                                <Box
                                                                    key={i}
                                                                    p='12px'
                                                                    sx={{
                                                                        border: 2,
                                                                        borderColor: s.isBest ? colors.greenAccent[400] : 'transparent',
                                                                        bgcolor: s.isBest ? 'rgba(76, 175, 80, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                                                                        borderRadius: '8px',
                                                                        minWidth: '70px',
                                                                        textAlign: 'center',
                                                                        transition: 'transform 0.2s',
                                                                        '&:hover': { transform: 'scale(1.05)' }
                                                                    }}
                                                                >
                                                                    <Typography variant='h6' fontWeight={s.isBest ? 'bold' : 'normal'} color={s.isBest ? colors.greenAccent[400] : colors.grey[100]}>
                                                                        {s.score}
                                                                    </Typography>
                                                                    <Typography variant='caption' sx={{ display: 'block', mt: '4px', opacity: 0.7 }}>
                                                                        Wk {s.date.split(' ')[2]}
                                                                    </Typography>
                                                                </Box>
                                                            ))}
                                                        </Box>
                                                    </Box>
                                                ));
                                            })()}
                                        </Box>
                                    </Box>

                                    <Box
                                        p='25px'
                                        sx={{
                                            bgcolor: 'rgba(0,0,0,0.2)',
                                            borderRadius: '12px',
                                            width: isMobile ? '100%' : 'fit-content',
                                            border: '1px dashed',
                                            borderColor: colors.grey[600]
                                        }}
                                    >
                                        <Typography variant='h5' mb='20px' fontWeight='bold' sx={{ letterSpacing: '1px' }}>
                                            Handicap Formula
                                        </Typography>

                                        <Box sx={{ fontFamily: '"Roboto Mono", monospace', fontSize: isMobile ? '0.9rem' : '1.1rem' }}>
                                            <Typography sx={{ mb: '10px', color: colors.grey[300] }}>
                                                <i>Handicap = slope_ute × (mean(best_{hcapDetails.nRoundsUsed}) - rating)</i>
                                            </Typography>

                                            <Box display='flex' alignItems='center' justifyContent='center' flexWrap='wrap' gap='8px'>
                                                <Typography variant='h4' color={colors.greenAccent[500]} fontWeight='bold'>
                                                    {hcapDetails.handicap.toFixed(1)}
                                                </Typography>
                                                <Typography variant='h4'>=</Typography>
                                                <Typography variant='h5' color={colors.grey[100]}>
                                                    {hcapDetails.slopeUteCreek.toFixed(3)}
                                                </Typography>
                                                <Typography variant='h4'>×</Typography>
                                                <Box sx={{ borderBottom: 1, borderColor: colors.grey[100], display: 'inline-block', px: 1 }}>
                                                    <Typography variant='h5' component='span'>({hcapDetails.meanBest.toFixed(2)} - {hcapDetails.rating.toFixed(2)})</Typography>
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Box>

                                    <Box mt='25px' display='flex' alignItems='center' gap='10px'>
                                        <Box sx={{ width: 12, height: 12, bgcolor: 'rgba(76, 175, 80, 0.4)', border: 1, borderColor: colors.greenAccent[400], borderRadius: '2px' }} />
                                        <Typography variant='caption' color={colors.grey[400]}>Indicates score used in best {hcapDetails.nRoundsUsed} calculation</Typography>
                                    </Box>
                                </>
                            )}
                        </Box>
                    )}
                </>
            )}
        </Box>
    );
};

export default Individual;