import * as React from 'react';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { Autocomplete, Box, Button, IconButton, MenuItem, TextField, useTheme } from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import { DataGrid } from "@mui/x-data-grid";
import { useEffect, useMemo, useState, useRef } from 'react';
import { postNewGolfer, postRemoveWeek, postUpdate } from '../backend/hooks';
import Header from '../components/header';
import AppSelect from '../components/select';
import { getAllData, weeksForYear } from "../data/data";
import { tokens } from "../theme";
import { Link } from 'react-router-dom';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

const NewWeek = () => {

    const isNonMobile = useMediaQuery('(min-width:600px)');
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);

    const [data, setData] = useState({
        week:         '',
        year:         '',
        score:        '',
        name:         '',
        rows:         [],
        weekOptions:  [],
        yearOptions:  [],
        allWeeks:     [],
        allYears:     [],
        allStrs:      [],
        allNames:     [],
        allData:      [],
        dialogOpen:   false,
        dialogSubmit: false,
        auth:         ''
    }); 

    const changeGolfer = golfer => {setData({...data, 'name'  : golfer})}
    const incrStr      = (str, incr=1) => {return (parseInt(str) + incr).toString()};

    useEffect(() => {getAllData().then((d) => dataHandler(d))}, []);

    const handleRemoveWeek = () => {
        console.log('Removing week: ', data.week);
        const removeStr = `${data.year} Wk ${data.week}`;
        postRemoveWeek({key: removeStr}).then((d) => {console.log('Response: ', d)});
        setData({...data, dialogOpen: false});
        return null;
    };

    const handleDialogClose = () => {
        setData({...data, dialogOpen: false})
    };

    const handleDialogOpen = () => {
        setData({...data, dialogOpen: true})
    };

    const handleSubmitClose = () => {
        setData({...data, dialogSubmit: false})
    };

    const handleAuth = event => {
        setData({...data, auth: event.target.value})
    };

    const handleCheckAuth = event => {
        return data.auth === 'suckwithpace' ? true : false;
    };

    const handleSubmit = (values) => {
        console.log('Posting values: ', data.rows);

        // If new golfer is part of the pareto, add him first
        for (const row of data.rows) {
            if (!data.allNames.includes(row.name)) {
                console.log(`Noticed ${row.name} is not currently in the database. Adding now...`);
                postNewGolfer({Names : row.name.toUpperCase()}).then((d) => {console.log('Response: ', d)});
            }
        };
        
        // Add the new week via aggregate pipeline
        for (const row of data.rows) {
            postUpdate(row)
            .then((d) => {
                console.log('Response: ', d);
            });
        }

        setData({...data, dialogSubmit: true});
    };
    
    const golferNames = useMemo(
        () => data.allNames.sort(),
        [data]
    );

    const weeks = useMemo(
        () => {
            return weeksForYear(data.allData, data.allYears.slice(-1)[0]);
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

    const handleAddRow = () => {
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
    };

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
                        <AppSelect
                            label="Year"
                            placeholder='year'
                            name='year'
                            onChange={e => {
                                setData({...data, [e.target.name]: e.target.value})}}
                            value={data.year}
                            disabled={data.rows.length ? true : false}
                            sx = {{
                                "& .MuiFormLabel-root": {
                                    color: colors.greenAccent[400]
                                },
                                width: 200,
                                textAlign: 'center'
                            }}
                            valuesFunc={years.map((y, i) => {
                                return <MenuItem key={i} value={y}>{y}</MenuItem>
                            })}
                        />

                        <AppSelect
                            label='Week'
                            placeholder='week'
                            name='week'
                            value={data.week}
                            selectOnFocus={false}
                            disabled={data.rows.length ? true : false}
                            onChange={e => {setData({...data, [e.target.name]: e.target.value})}}
                            valuesFunc={
                                weeks.map((w, i) => {
                                    return <MenuItem key={i} value={w}>{w}</MenuItem>
                                })
                            }
                            sx={
                                {
                                    "& .MuiFormLabel-root": {
                                        color: colors.greenAccent[400]
                                    },
                                    width: 200,
                                    textAlign: 'center'
                                }
                            }
                        />
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
                            selectOnFocus={false}
                            clearOnBlur
                            autoHighlight
                            autoComplete
                            blurOnSelect
                            freeSolo
                            disabled={data.week && data.year ? false : true}
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

                        <AppSelect
                            label='Score'
                            placeholder='score'
                            onChange={e => {setData({...data, ['score']: e.target.value})}}
                            name='score'
                            sx={{
                                textAlign: 'center',
                                width: 250 
                            }}
                            disabled={data.week && data.year ? false : true}
                            valuesFunc={[...Array(40).keys()].map((v, i) => {
                                const val = (i+20).toString();
                                return <MenuItem key={i} value={val}>{val}</MenuItem>
                            })}
                        />
                    </Box>

                    <Box
                        mt='40px'
                        alignItems='center'
                        justifyContent='space-evenly'
                        display='flex'
                        flexDirection='column'
                    >

                        <Button 
                            variant='contained' 
                            endIcon={<AddIcon />} 
                            sx={{minWidth: '250px'}} 
                            alignItems='center'
                            justifyContent='space-evenly'
                            onClick={handleAddRow}
                            disabled={data.week && data.year && data.name && data.score ? false : true}
                        >
                            Add
                        </Button>

                        <Button 
                            variant='contained' 
                            endIcon={<DeleteIcon />} 
                            sx={{minWidth: '250px', mt: '40px'}} 
                            alignItems='center'
                            justifyContent='space-evenly'
                            onClick={handleDialogOpen}
                            disabled={data.week && data.year && data.name && data.score ? false : true}
                        >
                            Remove Week
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

            <Dialog
                open={data.dialogOpen}
                onClose={handleDialogClose}
            >
                <DialogTitle>
                    {"Hey!"}
                </DialogTitle>

                <DialogContent>
                    <DialogContentText>
                        Do you really want to remove the current year/week?
                    </DialogContentText>
                </DialogContent>

                <DialogActions>
                    <Button
                        onClick={handleDialogClose}
                        sx={{color: colors.greenAccent[400]}}
                    >
                        No
                    </Button>
                    <Button 
                        onClick={handleRemoveWeek} 
                        autoFocus
                        sx={{color: colors.greenAccent[400]}}
                    >
                        Yes
                    </Button>
                </DialogActions>

            </Dialog>

            <Dialog
                open={data.dialogSubmit}
                onClose={handleSubmitClose}
            >
                <DialogTitle>
                    {"Hey!"}
                </DialogTitle>

                <DialogContent>
                    <DialogContentText>
                        Score submission was successful.
                    </DialogContentText>
                </DialogContent>

                <DialogActions>
                    <Button
                        sx={{color: colors.greenAccent[400]}}
                        component={Link}
                        to='/league'
                        reloadDocument
                    >
                        Go to scoreboard
                    </Button>
                </DialogActions>

            </Dialog>

            <Dialog
                open={data.auth === 'suckwithpace' ? false : true}
            >
                <DialogTitle>
                    {"Hey!"}
                </DialogTitle>

                <DialogContent>
                    <DialogContentText>
                        Type in the secret password...
                    </DialogContentText>
                    <TextField
                        autoFocus
                        required
                        error={handleCheckAuth}
                        margin='dense'
                        id='name'
                        name='auth'
                        label='Password'
                        type='auth'
                        fullWidth
                        variant='standard'
                        value={data.auth}
                        onChange={handleAuth}
                    />
                </DialogContent>
            </Dialog>
        </Box>
    )
}

export default NewWeek;