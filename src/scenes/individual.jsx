import { Autocomplete, Box, MenuItem, TextField, useTheme } from '@mui/material';
import * as Plot from '@observablehq/plot';
import { useEffect, useRef, useState } from 'react';
import Header from "../components/header";
import AppSelect from '../components/select';
import StatBox from '../components/statsbox';
import { getAllData, rangeWeeks, rangeYears, selectData } from "../data/data";
import { avgScore, handicap, trend } from '../data/stats';
import { tokens } from "../theme";

const Individual = (props) => {

    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const action = useRef(null);
    const [data, setData] = useState({
        startWeek: '1',
        endWeek:   props.latestWeek,
        startYear: '2022',
        endYear:   props.latestYear,
        golfer:    '',
        allWeeks:  [],
        allYears:  [],
        allStrs:   [],
        allNames:  [],
        allData:   [],
        handicap:  0.0,
        trend:     0.0,
        bestScore: 0.0,
        avgScore:  0.0
    });

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
        setData({...data, [e.target.name]: e.target.value});
    };

    const changeGolfer = golfer => {
        const [scores, _] = selectData(
            golfer,
            data.allData,
            rangeWeeks(data.allWeeks, data.startWeek, data.endWeek),
            rangeYears(data.allYears, data.startYear, data.endYear)
        );
        if (scores.length > 0) {
            const _handicap = handicap(scores);
            const [_, _trendSlope] = trend(scores);
            setData({...data, 'handicap': _handicap, 'trend' : _trendSlope, 'golfer' : golfer});
        } else {
            setData({...data, 'golfer': golfer});
        }
    };

    const dataHandler = ( (_allData) => {
        const [weeks, years, strs, names, _data] = _allData;
        setData({
            ...data,
            'allWeeks'   : [...weeks],
            'allYears'   : [...years],
            'allStrs'    : [...strs],
            'allNames'   : [...names],
            'allData'    : [..._data],
        })
    });

    useEffect( () => {
            getAllData().then(
                (d) => dataHandler(d)
            );
        },
        []
    );

    useEffect( () => {

        if (!data.allWeeks.length || !data.golfer) {return}
        // On change of any input box data, reselect scores and dates
        const [scores, dates] = selectData(
            data.golfer,
            data.allData,
            rangeWeeks(data.allWeeks, data.startWeek, data.endWeek),
            rangeYears(data.allYears, data.startYear, data.endYear)
        );
        if (scores.length < 2) {return}

        // Handle updates to golfer metrics
        const _handicap = handicap(scores);
        const [_, _trendSlope] = trend(scores);

        // Handle plot update
        const genYearTicks = tickCallbackTracker([...dates]);
        let yrTicks = [];
        for (const _date of genYearTicks) {
            if (_date) {yrTicks.push(_date)}
        }

        const [trendIntercept, trendSlope] = trend(scores);
        const trendX = [...Array(scores.length).keys()];
        const trendY = trendX.map(x => x*trendSlope[0] + trendIntercept[0]);

        const plot = Plot.plot({
            width: 1080, height: 400,
            marginBottom: 60,
            y: {
                grid: true,
                domain: [Math.min(...scores)-5, Math.max(...scores)+5],
            },
            x : {
                domain: dates
            },
            marks: [
                Plot.ruleY([Math.min(...scores)-5]),
                Plot.axisX({
                    // Axis ticks for the Week
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
                    //sort: { order: null }
                }),
                Plot.axisX({
                    x: yrTicks,
                    tickSize: 26,
                    tickPadding: -8,
                    tickFormat: (s,i) => ` ${(yrTicks[i]) ? yrTicks[i].split(' ')[0] : yrTicks[i]}`,
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
                        text: (d, i) => `Net Score: ${(d-_handicap).toFixed(1)}`,
                        fontSize: 12
                    }),
                ),
                Plot.lineX(
                    trendY,
                    {
                        x: dates,
                        y: trendY,
                        stroke: trendSlope[0] > 0 ? colors.red[400] : colors.greenAccent[400],
                        strokeDasharray: '8,8',
                    }
                )
            ]
        });
        action.current.append(plot);
        setData(
            {
                ...data,
                'handicap'  : _handicap.toFixed(1),
                'trend'     : _trendSlope[0].toFixed(2),
                'bestScore' : Math.min(...scores),
                'avgScore'  : avgScore(scores).toFixed(1)
            }
        );

        return () => plot.remove();

    }, 
    [data.golfer, data.endYear, data.endWeek, data.startYear, data.startWeek]
);

    return (
        <Box
            mt='25px'
            textAlign='center'
            alignItems='center'
            justifyContent='center'
            sx={{maxWidth: 'xl'}}
        >
            <Header title='Individual Golfer'/>

            <Box
                mt='20px'
                alignItems='center'
                justifyContent='center'
                display='flex'
            >
                <Autocomplete
                    renderInput={(params) =>
                        <TextField {...params} sx={{input: {textAlign: 'center'}}} />}
                    options={data.allNames.sort()}
                    //style={{color: colors.greenAccent[400], fontSize: 16}}
                    selectOnFocus={false}
                    autoHighlight
                    autoComplete
                    blurOnSelect
                    onChange={(_, value, __) => changeGolfer(value)}
                    sx = {{
                        width: 250
                    }}
                >
                </Autocomplete>
            </Box>

            {data.golfer !== '' && (
                <Box
                    mt='50px'
                    justifyContent='center'
                    alignItems='center'
                    display='flex'
                    //padding='10px 10px'
                    //sx = {{ m: 4}}
                >

                    <AppSelect
                        label="Start Week"
                        placeholder='startWeek'
                        name='startWeek'
                        onChange={changeHandler}
                        value={data.startWeek}
                        valuesFunc={
                            data.allWeeks.map((week, i) => {
                                if (parseInt(week) <= parseInt(data.endWeek)) {
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
                        value={data.endWeek}
                        valuesFunc={data.allWeeks.map((week, i) => {
                            if (parseInt(week) >= parseInt(data.startWeek)) {
                                return <MenuItem key={i} value={week}>{week}</MenuItem>
                            }
                        })}
                    />
                    <AppSelect
                        label="Start Year"
                        placeholder='startYear'
                        name='startYear'
                        onChange={changeHandler}
                        value={data.startYear}
                        valuesFunc={data.allYears.map((year, i) => {
                            if (parseInt(year) <= parseInt(data.endYear)) {
                                return <MenuItem key={i} value={year}>{year}</MenuItem>
                            }
                        })}
                    />
                    <AppSelect
                        label="End Year"
                        placeholder='endYear'
                        name='endYear'
                        onChange={changeHandler}
                        value={data.endYear}
                        valuesFunc={data.allYears.map((year, i) => {
                            if (parseInt(year) >= parseInt(data.startYear)) {
                                return <MenuItem key={i} value={year}>{year}</MenuItem>
                            }
                        })}
                    />
                </Box>
            )}

            {data.golfer !== '' && (
                <Box
                    mt='15px'
                    //justifyContent='end'
                    alignItems='left'
                    display='flex'
                    padding='10px 0'
                    ml='20px'
                >

                    <Box>
                        <div ref={action} />
                    </Box>

                    <Box
                        display='flex'
                        flexDirection='column'
                        justifyContent='space-evenly'
                        mb='25px'
                    >
                        <StatBox
                            title='Avg Score'
                            subtitle={`${data.avgScore}`}
                        />
                        <StatBox
                            title='Handicap'
                            subtitle={`${data.handicap}`}
                        />
                        <StatBox
                            title='Trend'
                            subtitle={((data.trend > 0.0) ? "+" : "").concat(`${data.trend}`)}
                            statColor={(data.trend < 0.0) ? colors.greenAccent[400] : colors.red[400]}
                        />
                        <StatBox
                            title='Best Score'
                            subtitle={`${data.bestScore}`}
                        />
                    </Box>
                </Box>
            )}
        </Box>
    )
};

export default Individual;