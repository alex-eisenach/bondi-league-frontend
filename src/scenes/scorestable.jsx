import { Box, MenuItem, useTheme, useMediaQuery } from '@mui/material';
import { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { tokens } from '../theme';
import { getAllData } from '../backend/hooks';
import AppSelect from '../components/select';
import { rangeWeeks, rangeYears, parseDateString } from '../data/data';
import { useMetadata } from '../context/MetadataContext';
import Header from '../components/header';
import LoadingScreen from '../components/LoadingScreen';

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
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

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
        return columns;
    }

    return (
        <Box
            p={isMobile ? '10px' : '20px'}
            textAlign='center'
            display="flex"
            flexDirection="column"
            sx={{
                width: '100%',
                height: 'calc(100vh - 80px)',
            }}
        >
            <Header title='Master Spreadsheet' />

            {loading ? (
                <LoadingScreen />
            ) : (
                <>
                    <Box
                        mt='25px'
                        justifyContent='center'
                        alignItems='center'
                        display='flex'
                        flexWrap='wrap'
                        padding='10px 0'
                        gap='20px'
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
                            valuesFunc={allYears.slice().sort((a, b) => b - a).map((year, i) => {
                                if (parseInt(year) >= parseInt(startYear)) {
                                    return <MenuItem key={i} value={year}>{year}</MenuItem>
                                }
                                return null;
                            })}
                        />
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
                </>
            )}
        </Box>
    );
};

export default Scorestable;