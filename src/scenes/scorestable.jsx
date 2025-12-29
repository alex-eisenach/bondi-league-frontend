import { Box, Typography, useTheme, Select, MenuItem, InputLabel, FormControl } from '@mui/material';
import { useState, useEffect, useRef } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { tokens } from '../theme';
import { getAllData } from '../backend/hooks';
import { rangeWeeks, rangeYears, parseDateString } from '../data/data';
import { useMetadata } from '../context/MetadataContext';
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

    const { allWeeks, allYears, latestYear, latestWeek, loading } = useMetadata();

    const [startWeek, setStartWeek] = useState('1');
    const [endWeek, setEndWeek] = useState('');
    const [startYear, setStartYear] = useState('2022');
    const [endYear, setEndYear] = useState('');
    const [allData, setAllData] = useState([]);

    useEffect(() => {
        if (!loading) {
            setStartYear(latestYear);
            setEndYear(latestYear);
            setStartWeek(allWeeks[0] || '1');
            setEndWeek(latestWeek);
        }
    }, [loading, allWeeks, latestYear, latestWeek]);

    useEffect(() => {
        getAllData().then(data => setAllData(data));
    }, []);

    const changeHandler = e => {
        const { name, value } = e.target;
        if (name === 'startWeek') setStartWeek(value);
        if (name === 'endWeek') setEndWeek(value);
        if (name === 'startYear') setStartYear(value);
        if (name === 'endYear') setEndYear(value);
    };

    const rows = () => {
        let rows = [];
        for (const obj of allData) {
            let params = {};
            let hasRecord = false;
            for (const [key, val] of Object.entries(obj)) {
                const parsedData = parseDateString(key);
                if (parsedData) {
                    const [_, year, week] = parsedData;
                    if (
                        rangeWeeks(allWeeks, startWeek, endWeek)
                            .includes(week)
                        &&
                        rangeYears(allYears, startYear, endYear)
                            .includes(year)
                    ) {
                        params[key] = val;
                        if (val !== '' && val !== null) {
                            hasRecord = true;
                        }
                    }
                }
                else if (key === 'Names') {
                    params['Names'] = val;
                }
                else if (key === '_id') {
                    params['id'] = val;
                }
            }
            if (hasRecord) {
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
            p='20px'
            textAlign='center'
            display="flex"
            flexDirection="column"
            sx={{ width: '100%', height: 'calc(100vh - 80px)' }}
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
                        value={startWeek}
                        placeholder='startWeek'
                        onChange={changeHandler}
                        name='startWeek'
                        sx={{ minWidth: 125 }}
                        label='Start Week'
                    >
                        {allWeeks.map((week, i) => {
                            if (parseInt(week) <= parseInt(endWeek)) {
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
                        value={endWeek}
                        placeholder='endWeek'
                        onChange={changeHandler}
                        name='endWeek'
                        sx={{ minWidth: 125 }}
                        label='End Week'
                    >
                        {allWeeks.slice().sort((a, b) => parseInt(b) - parseInt(a)).map((week, i) => {
                            if (parseInt(week) >= parseInt(startWeek)) {
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
                        value={startYear}
                        placeholder='startYear'
                        onChange={changeHandler}
                        name='startYear'
                        label='Start Year'
                        sx={{ minWidth: 125 }}
                    >
                        {allYears.map((year, i) => {
                            if (parseInt(year) <= parseInt(endYear)) {
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
                        value={endYear}
                        placeholder='endYear'
                        onChange={changeHandler}
                        name='endYear'
                        label='End Year'
                        sx={{ minWidth: 125 }}
                    >
                        {allYears.map((year, i) => {
                            if (parseInt(year) >= parseInt(startYear)) {
                                return <MenuItem key={i} value={year}>{year}</MenuItem>
                            }
                        }
                        )}
                    </Select>
                </FormControl>

            </Box>

            <Box
                sx={{
                    flex: 1,
                    width: '1',
                    '& .MuiDataGrid-cell[data-field="Names"]': {
                        position: 'sticky',
                        left: 0,
                        backgroundColor: theme.palette.mode === 'dark' ? colors.primary[600] : colors.primary[400],
                        zIndex: 1,
                        borderRight: `1px solid ${colors.grey[700]}`,
                    },
                    '& .MuiDataGrid-columnHeader[data-field="Names"]': {
                        position: 'sticky',
                        left: 0,
                        backgroundColor: theme.palette.mode === 'dark' ? colors.primary[600] : colors.primary[400],
                        zIndex: 2,
                        borderRight: `1px solid ${colors.grey[700]}`,
                    },
                }}
            >
                <DataGrid
                    columns={columns()}
                    rows={rows()}
                    initialState={{
                        sorting: {
                            sortModel: [{ field: 'Names', sort: 'asc' }]
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