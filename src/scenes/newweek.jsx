import {Box, TextField, Autocomplete, useTheme, Button, IconButton} from '@mui/material';
import {useState, useEffect, useRef, useMemo} from 'react';
import {tokens} from "../theme";
import useMediaQuery from '@mui/material/useMediaQuery';
import * as yup from 'yup';
import Header from '../components/header';
import {getAllData, weeksForYear} from "../data/data";
import {postNewGolfer, postNewWeek, postUpdate, postRemoveWeek} from '../backend/hooks';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import {DataGrid} from "@mui/x-data-grid";

const scoreSchema = yup.object().shape({
    score: yup.number().required('required')
});

const initialValues = {
    score: ''
}

const NewWeek = () => {
    const isNonMobile = useMediaQuery('(min-width:600px)');
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const action = useRef(null);

    const [data, setData] = useState({
        week:        '',
        year:        '',
        score:       '',
        name:        '',
        rows:        [],
        weekOptions: [],
        yearOptions: [],
        allWeeks:    [],
        allYears:    [],
        allStrs:     [],
        allNames:    [],
        allData:     []
    }); 

    const changeWeek   = week   => {setData({...data, 'week'  : week})}
    const changeYear   = year   => {setData({...data, 'year'  : year})}
    const changeScore  = score  => {setData({...data, 'score' : score})}
    const changeGolfer = golfer => {setData({...data, 'name'  : golfer})}
    const incrStr      = (str, incr=1) => {return (parseInt(str) + incr).toString()};

    useEffect(() => {getAllData().then((d) => dataHandler(d))}, []);

    const handleSubmit = (values) => {
        console.log('Posting values: ', data.rows);

        const remove = true;
        if (remove) {
            //debug
            postRemoveWeek({key: '2024 Wk 1'}).then((d) => {console.log('Response: ', d)});
            return null;
        }

        // If new golfer is part of the pareto, add him first
        for (const row of data.rows) {
            if (!data.allNames.includes(row.name)) {
                console.log(`Noticed ${row.name} is not currently in the database. Adding now...`);
                postNewGolfer({Names : row.name.toUpperCase()}).then((d) => {console.log('Response: ', d)});
            }
        };
        // Add the new week via aggregate pipeline
        const newDate = [`${data.year} Wk ${data.week}`];

        for (const row of data.rows) {
            postUpdate(row)
            .then((d) => {
                console.log('Response: ', d);
            });
        }
    }
    
    const golferNames = useMemo(
        () => data.allNames.sort(),
        [data]
    );

    const weeks = useMemo(
        () => {
            const wksForYr = weeksForYear(data.allData, data.allYears.slice(-1)[0])
            const nextWeek = wksForYr.slice(-1)[0] === '15' ? '1' : incrStr(data.allWeeks.slice(-1)[0]);
            const weeks = [nextWeek, incrStr(nextWeek), incrStr(nextWeek, 2)];  // pad 2 weeks in case of rainouts
            return weeks;
        },
        [data]
    );

    const years = useMemo(
        () => {
            const wksForYr = weeksForYear(data.allData, data.allYears.slice(-1)[0]);
            const nextYear = incrStr(data.allYears.slice(-1)[0]);
            return wksForYr.slice(-1)[0] === '15' ? [nextYear, incrStr(nextYear)] : [data.allYears.slice(-1)[0], nextYear];
        },
        [data]
    );

    const rows = useMemo(
        () => {
            let _rows = [];
            for (const datum of data.rows) {
                _rows.push({
                    'name'  : datum.name,
                    'score' : datum.score,
                    'id'    : datum.name
                });
            }
            return _rows;
        }, [data.rows]);

    const columns = [
        {
            field     : 'name',
            headerName: 'Golfer',
            width     : 200
        },
        {
            field      : 'score',
            headerName : 'Gross Score',
            width      : 150
        },
        {
            field      : 'delete',
            headerName : '',
            renderCell : (params) => {
                return (
                    <>
                    <IconButton
                        onClick={(e) => handleDeleteRow(e, params.row)}
                    >
                    <DeleteIcon />
                    </IconButton>
                    </>
                )
            },
            width: 100
        }
    ];

    const handleOnClick = () => {
        let newRows = [...data.rows];
        const datum = {
            'date'  : `${data.year} Wk ${data.week}`,
            'name'  : `${data.name}`,
            'score' : data.score
        };
        const datumExisting = newRows.filter(e => e.name === data.name);
        if (datumExisting.length) {
            newRows[newRows.indexOf(datumExisting[0])] = datum;
        }
        else {newRows.push(datum)};
        setData({...data, 'rows' : newRows});
    };

    const handleDeleteRow = (e, row) => {
        let newRows = [...data.rows];
        const datumExisting = newRows.filter(e => e.name === row.name);
        newRows.splice(newRows.indexOf(datumExisting[0]), 1);
        setData({...data, 'rows' : newRows});
    }

    const dataHandler = ( (_allData) => {
        const [[...weeks], [...years], [...strs], [...names], [..._data]] = _allData;
        setData({
            ...data,
            'allWeeks'    : weeks,
            'allYears'    : years,
            'allStrs'     : strs,
            'allNames'    : names,
            'allData'     : _data,
        })
    });

    return (
        <Box
            m='20px'
        >
            <Header title='Add New Week' />
            <Box
                display='flex'
                flexDirection='row'
            >
                <Box
                    mt='20px'
                    alignItems='center'
                    //justifyContent='center'
                    display='flex'
                    flexDirection='column'
                >
                    <Box
                        mt='20px'
                        alignItems='left'
                        justifyContent='left'
                        display='flex'
                        //flexDirection='left'
                    >
                        <Autocomplete
                            renderInput={(params) =>
                                <TextField {...params} 
                                    sx={
                                        {
                                            input: {
                                                textAlign: 'center'
                                            },
                                        }
                                    } label='Year'/>}
                            options={years}
                            value={data.year}
                            selectOnFocus={false}
                            autoHighlight
                            autoComplete
                            blurOnSelect
                            disabled={data.rows.length ? true : false}
                            onChange={(_, value, __) => changeYear(value)}
                            sx = {{
                                width: 200,
                                "& .MuiFormLabel-root": {
                                    color: colors.greenAccent[400]
                                }
                            }}
                        >
                        </Autocomplete>

                        <Autocomplete
                            renderInput={(params) =>
                                <TextField {...params} sx={{input: {textAlign: 'center'}}} label='Week'/>}
                            options={weeks}
                            value={data.week}
                            //style={{color: colors.greenAccent[400], fontSize: 16}}
                            selectOnFocus={false}
                            autoHighlight
                            autoComplete
                            blurOnSelect
                            disabled={data.rows.length ? true : false}
                            onChange={(_, value, __) => changeWeek(value)}
                            sx={
                                {
                                    input: {
                                        textAlign: 'center'
                                    },
                                    "& .MuiFormLabel-root": {
                                        color: colors.greenAccent[400]
                                    },
                                    width: 200
                                }
                            }
                        >
                        </Autocomplete>
                    </Box>

                    <Box
                        mt='40px'
                        alignItems='center'
                        justifyContent='center'
                        display='flex'
                    >
                        <Autocomplete
                            renderInput={(params) => (
                                <TextField {...params} sx={{input: {textAlign: 'center'}}} label='Golfer'/>
                            )}
                            options={golferNames}
                            value={data.name}
                            //style={{color: colors.greenAccent[400], fontSize: 16}}
                            selectOnFocus={false}
                            clearOnBlur
                            autoHighlight
                            autoComplete
                            blurOnSelect
                            freeSolo
                            onInputChange={(_, value, __) => {
                                changeGolfer(value)
                            }}
                            sx={
                                {
                                    input: {
                                        textAlign: 'center'
                                    },
                                    "& .MuiFormLabel-root": {
                                        color: colors.greenAccent[400]
                                    },
                                    width: 250
                                }
                            }
                        >
                        </Autocomplete>

                        <Autocomplete
                            renderInput={(params) => (
                                <TextField {...params} sx={{input: {textAlign: 'center'}}} label='Gross Score'/>
                            )}
                            options={[...Array(40).keys()].map(i => (i + 20).toString())}
                            value={data.score}
                            selectOnFocus={false}
                            autoHighlight
                            autoComplete
                            blurOnSelect
                            onChange={(_, value, __) => changeScore(value)}
                            sx={
                                {
                                    input: {
                                        textAlign: 'center'
                                    },
                                    "& .MuiFormLabel-root": {
                                        color: colors.greenAccent[400]
                                    },
                                    width: 250
                                }
                            }
                        >
                        </Autocomplete>

                    </Box>

                    <Box
                        mt='40px'
                        alignItems='center'
                        justifyContent='space-evenly'
                        display='flex'
                    >

                        <Button 
                            variant='contained' 
                            endIcon={<AddIcon />} 
                            sx={{minWidth: '250px'}} 
                            alignItems='center'
                            justifyContent='space-evenly'
                            onClick={handleOnClick}
                        >
                            Add
                        </Button>

                    </Box>
                </Box>

                <Box
                    mt='40px'
                    ml='125px'
                    alignItems='center'
                    justifyContent='space-evenly'
                    display='flex'
                    flexDirection='column'
                    //maxWidth='400px'
                    //width='85%'
                > 
                    <DataGrid
                        columns={columns}
                        rows={rows}
                        hideFooter={true}
                        initialState = {{
                            sorting: {
                                sortModel: [{field: 'name', sort: 'asc'}]
                            }
                        }}
                        //onRowDoubleClick={handleRowDoubleClick}
                        sx = {{
                            '& .MuiDataGrid-columnHeaders' : {
                                color: `${colors.greenAccent[400]}`,
                                fontWeight: 800
                            }
                        }}
                    />

                    {data.rows.length ? (
                        <Button 
                            variant='contained' 
                            endIcon={<AddIcon />} 
                            sx={{minWidth: '250px'}} 
                            alignItems='center'
                            justifyContent='space-evenly'
                            onClick={handleSubmit}
                        >
                            Submit
                        </Button>
                    ) : ''}

                </Box>

            </Box>

        </Box>
    )
}

export default NewWeek;