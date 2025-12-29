import { Box, Typography, useTheme, Select, MenuItem, InputLabel, FormControl } from '@mui/material';
import { useState, useEffect, useRef } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { tokens } from '../theme';
import { getAllData, rangeWeeks, rangeYears, parseDateString } from '../data/data';
import Header from '../components/header';

const scoresComparator = (i, j) => {
    // Sorts a list of numbers containing empty strings to put empty strings at back
    if (i === '') {
        return 1;
    } else if (j === '') {
        return -1;
    } else {
        return parseInt(i) - parseInt(j);
    }
}

const Scorestable = () => {

    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const action = useRef(null);

    const changeHandler = e => {
        setAllValues({ ...allValues, [e.target.name]: e.target.value });
    };
    const allDataHandler = ((_allData) => {
        const [weeks, years, strs, names, data] = _allData;
        const sortedYears = [...years].sort((a, b) => parseInt(b) - parseInt(a));
        const sortedWeeks = [...weeks].sort((a, b) => parseInt(b) - parseInt(a));

        const latestYear = sortedYears.length > 0 ? sortedYears[0] : '2022';
        const minWeek = sortedWeeks.length > 0 ? sortedWeeks[sortedWeeks.length - 1] : '1';
        const maxWeek = sortedWeeks.length > 0 ? sortedWeeks[0] : '1';

        setAllValues(prevValues => ({
            ...prevValues,
            'allWeeks': [...weeks],
            'allYears': [...years],
            'allStrs': [...strs],
            'allNames': [...names],
            'allData': [...data],
            'startYear': latestYear,
            'endYear': latestYear,
            'startWeek': minWeek,
            'endWeek': maxWeek
        }));
    });

    const [allValues, setAllValues] = useState({
        startWeek: '1',
        endWeek: '2',
        startYear: '2022',
        endYear: '2023',
        allWeeks: [],
        allYears: [],
        allStrs: [],
        allNames: [],
        allData: []
    });

    useEffect(() => {
        getAllData().then(
            (allData) => allDataHandler(allData)
        );
    },
        []);

    const rows = () => {
        let rows = [];
        for (const obj of allValues.allData) {
            let params = {};
            for (const [key, val] of Object.entries(obj)) {
                const parsedData = parseDateString(key);
                if (parsedData) {
                    const [_, year, week] = parsedData;
                    if (
                        rangeWeeks(allValues.allWeeks, allValues.startWeek, allValues.endWeek)
                            .includes(week)
                        &&
                        rangeYears(allValues.allYears, allValues.startYear, allValues.endYear)
                            .includes(year)
                    ) {
                        params[key] = val;
                    }
                }
                else if (key === 'Names') {
                    params['Names'] = val;
                }
                else if (key === '_id') {
                    params['id'] = val;
                }
            }
            if (params) {
                rows.push(params)
            }
        }
        return rows;
    };

    const columns = () => {
        let columns = [];
        let weeks = new Set();
        columns.push({ field: 'Names', headerName: 'Golfers', width: 200 });
        for (const obj of rows()) {
            for (const [key, _] of Object.entries(obj)) {
                if (key !== 'Names' && key !== 'id') { weeks.add(key) }
            }
        }
        for (const weekName of weeks) {
            columns.push(
                {
                    field: weekName,
                    headerName: weekName,
                    width: 100,
                    headerAlign: 'center',
                    align: 'center',
                    sortComparator: scoresComparator
                })
        }
        //console.log(columns);
        return columns;
    }

    return (
        <Box
            mt='25px'
            ml='25px'
            textAlign='center'
            alignItems='center'
            sx={{ maxWidth: 'lg' }}
        >
            <Header title='Master Spreadsheet' />
            <Box
                mt='25px'
                justifyContent='space-evenly'
                alignItems='center'
                display='flex'
                padding='10px 0'
            >
                <FormControl>
                    <InputLabel
                        style={{ color: colors.greenAccent[400], fontSize: 16 }}
                    >
                        Start Week
                    </InputLabel>

                    {/* ----- START WEEK ----- */}
                    <Select
                        action={action}
                        value={allValues.startWeek}
                        placeholder='startWeek'
                        onChange={changeHandler}
                        name='startWeek'
                        sx={{ minWidth: 125 }}
                        label='Start Week'
                    >
                        {allValues.allWeeks.map((week, i) => {
                            if (parseInt(week) <= parseInt(allValues.endWeek)) {
                                return <MenuItem key={i} value={week}>{week}</MenuItem>
                            }
                        })
                        }
                    </Select>
                </FormControl>

                {/* ----- END WEEK ----- */}
                <FormControl>
                    <InputLabel
                        style={{ color: colors.greenAccent[400], fontSize: 16 }}
                    >
                        End Week
                    </InputLabel>
                    <Select
                        action={action}
                        value={allValues.endWeek}
                        placeholder='endWeek'
                        onChange={changeHandler}
                        name='endWeek'
                        sx={{ minWidth: 125 }}
                        label='End Week'
                    >
                        {allValues.allWeeks.map((week, i) => {
                            if (parseInt(week) >= parseInt(allValues.startWeek)) {
                                return <MenuItem key={i} value={week}>{week}</MenuItem>
                            }
                        }
                        )}
                    </Select>
                </FormControl>

                {/* ----- START YEAR ----- */}
                <FormControl>
                    <InputLabel
                        style={{ color: colors.greenAccent[400], fontSize: 16 }}
                    >
                        Start Year
                    </InputLabel>
                    <Select
                        action={action}
                        value={allValues.startYear}
                        placeholder='startYear'
                        onChange={changeHandler}
                        name='startYear'
                        label='Start Year'
                        sx={{ minWidth: 125 }}
                    >
                        {allValues.allYears.map((year, i) => {
                            if (parseInt(year) <= parseInt(allValues.endYear)) {
                                return <MenuItem key={i} value={year}>{year}</MenuItem>
                            }
                        })
                        }
                    </Select>
                </FormControl>

                {/* ----- END YEAR ----- */}
                <FormControl>
                    <InputLabel
                        style={{ color: colors.greenAccent[400], fontSize: 16 }}
                    >
                        End Year
                    </InputLabel>
                    <Select
                        action={action}
                        value={allValues.endYear}
                        placeholder='endYear'
                        onChange={changeHandler}
                        name='endYear'
                        label='End Year'
                        sx={{ minWidth: 125 }}
                    >
                        {allValues.allYears.map((year, i) => {
                            if (parseInt(year) >= parseInt(allValues.startYear)) {
                                return <MenuItem key={i} value={year}>{year}</MenuItem>
                            }
                        }
                        )}
                    </Select>
                </FormControl>

            </Box>

            <Box
                sx={{ width: '1' }}
            >
                <DataGrid
                    columns={columns()}
                    rows={rows()}
                    initialState={{
                        sorting: {
                            sortModel: [{ field: 'Golfers', sort: 'asc' }]
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
    );
};

export default Scorestable;