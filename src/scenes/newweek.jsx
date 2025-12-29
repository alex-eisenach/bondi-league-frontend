import * as React from 'react';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { Autocomplete, Box, Button, IconButton, MenuItem, TextField, useTheme, Slider } from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import { DataGrid } from "@mui/x-data-grid";
import { useEffect, useMemo, useState, useRef } from 'react';
import { postNewGolfer, postRemoveWeek, postUpdate } from '../backend/hooks';
import Header from '../components/header';
import AppSelect from '../components/select';
import { getMetadata } from "../data/data";
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

    const [week, setWeek] = useState('');
    const [year, setYear] = useState('');
    const [score, setScore] = useState('');
    const [name, setName] = useState('');
    const [rowsState, setRowsState] = useState([]);
    const [allWeeks, setAllWeeks] = useState([]);
    const [allYears, setAllYears] = useState([]);
    const [allNames, setAllNames] = useState([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogSubmit, setDialogSubmit] = useState(false);
    const [auth, setAuth] = useState('');
    const [yearsToWeeks, setYearsToWeeks] = useState({});

    const changeGolfer = golfer => { setName(golfer) }
    const incrStr = (str, incr = 1) => { return (parseInt(str) + incr).toString() };

    useEffect(() => {
        getMetadata().then(meta => {
            setAllWeeks(meta.weeks);
            setAllYears(meta.years);
            setAllNames(meta.names);
            setYearsToWeeks(meta.yearsToWeeks);

            // Set defaults for new week (next week after latest)
            const ly = meta.latestYear;
            const lw = meta.latestWeek;
            if (parseInt(lw) < 15) {
                setYear(ly);
                setWeek(incrStr(lw));
            } else {
                setYear(incrStr(ly));
                setWeek('1');
            }
        });
    }, []);

    const handleRemoveWeek = () => {
        console.log('Removing week: ', week);
        const removeStr = `${year} Wk ${week}`;
        postRemoveWeek({ key: removeStr }).then((d) => { console.log('Response: ', d) });
        setDialogOpen(false);
        return null;
    };

    const handleDialogClose = () => {
        setDialogOpen(false);
    };

    const handleDialogOpen = () => {
        setDialogOpen(true);
    };

    const handleSubmitClose = () => {
        setDialogSubmit(false);
    };

    const handleAuth = event => {
        setAuth(event.target.value);
    };

    const handleSubmit = (values) => {
        console.log('Posting values: ', rowsState);

        // If new golfer is part of the pareto, add him first
        for (const row of rowsState) {
            if (!allNames.includes(row.name)) {
                console.log(`Noticed ${row.name} is not currently in the database. Adding now...`);
                console.log(row);
                postNewGolfer(
                    {
                        'Names': row.name,
                        [row.date]: row.score[0]

                    })
                    .then((d) => { console.log('Response: ', d) })
            }
        };

        // Add the new week via aggregate pipeline
        for (const row of rowsState) {
            console.log(row);
            if (allNames.includes(row.name)) {
                postUpdate(row)
                    .then((d) => {
                        console.log('Response: ', d);
                    });
            }
        }

        setDialogSubmit(true);
    };

    const golferNames = useMemo(
        () => allNames.sort(),
        [allNames]
    );

    const weeks = useMemo(
        () => {
            return yearsToWeeks[allYears.slice(-1)[0]] || [];
        },
        [yearsToWeeks, allYears]
    );

    const years = useMemo(
        () => {
            if (!allYears.length) return [];
            const lastYear = allYears.slice(-1)[0];
            const wksForYr = yearsToWeeks[lastYear] || [];
            const nextYear = incrStr(lastYear);
            return wksForYr.slice(-1)[0] === '15' ? [nextYear, incrStr(nextYear)] : [lastYear, nextYear];
        },
        [allYears, yearsToWeeks]
    );

    const rows = useMemo(
        () => {
            let _rows = [];
            for (const datum of rowsState) {
                _rows.push({
                    'name': datum.name,
                    'score': datum.score,
                    'id': datum.name
                });
            }
            return _rows;
        }, [rowsState]);

    const columns = [
        {
            field: 'name',
            headerName: 'Golfer',
            width: 200
        },
        {
            field: 'score',
            headerName: 'Gross Score',
            width: 150
        },
        {
            field: 'delete',
            headerName: '',
            renderCell: (params) => {
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
        let newRows = [...rowsState];
        const datum = {
            'date': `${year} Wk ${week}`,
            'name': `${name.toUpperCase()}`,
            'score': score
        };
        const datumExisting = newRows.filter(e => e.name === name);
        if (datumExisting.length) {
            newRows[newRows.indexOf(datumExisting[0])] = datum;
        }
        else { newRows.push(datum) };
        setRowsState(newRows);
    };

    const handleDeleteRow = (e, row) => {
        let newRows = [...rowsState];
        const datumExisting = newRows.filter(e => e.name === row.name);
        newRows.splice(newRows.indexOf(datumExisting[0]), 1);
        setRowsState(newRows);
    };


    return (
        <Box
            m='20px'
        >
            <Header title='Add New Week' />
            <Box
                display='flex'
                flexDirection={isNonMobile ? 'row' : 'column'}
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
                            onChange={e => setYear(e.target.value)}
                            value={year}
                            disabled={rowsState.length ? true : false}
                            sx={{
                                "& .MuiFormLabel-root": {
                                    color: colors.greenAccent[400]
                                },
                                width: isNonMobile ? 200 : 150,
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
                            value={week}
                            selectOnFocus={false}
                            disabled={rowsState.length ? true : false}
                            onChange={e => setWeek(e.target.value)}
                            valuesFunc={
                                allWeeks.map((w, i) => {
                                    return <MenuItem key={i} value={w}>{w}</MenuItem>
                                })
                            }
                            sx={
                                {
                                    "& .MuiFormLabel-root": {
                                        color: colors.greenAccent[400]
                                    },
                                    width: isNonMobile ? 200 : 150,
                                    textAlign: 'center'
                                }
                            }
                        />
                    </Box>

                    <Box
                        mt='40px'
                        alignItems='center'
                        //justifyContent='center'
                        display='flex'
                        flexDirection='column'
                        sx={{ minWidth: isNonMobile ? 400 : '100%' }}
                    >
                        <Autocomplete
                            renderInput={(params) => (
                                <TextField {...params} sx={{ input: { textAlign: 'center' } }} label='Golfer' />
                            )}
                            options={golferNames}
                            value={name}
                            selectOnFocus={false}
                            clearOnBlur
                            autoHighlight
                            autoComplete
                            blurOnSelect
                            freeSolo
                            disabled={week && year ? false : true}
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
                                    width: isNonMobile ? 400 : '100%'
                                }
                            }
                        >
                        </Autocomplete>

                        <Slider
                            mt='40px'
                            minWidth='150px'
                            valueLabelDisplay='on'
                            step={1}
                            marks={[
                                {
                                    value: 20,
                                    label: '20',
                                },
                                {
                                    value: 30,
                                    label: '30',
                                },
                                {
                                    value: 40,
                                    label: '40',
                                },
                                {
                                    value: 50,
                                    label: '50',
                                },
                                {
                                    value: 60,
                                    label: '60',
                                },
                                {
                                    value: 70,
                                    label: '70',
                                },
                            ]}
                            min={30}
                            max={70}
                            defaultValue={[45]}
                            onChange={e => setScore(e.target.value)}
                            sx={{ color: colors.greenAccent[400], mt: '50px' }}
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
                            sx={{ minWidth: '250px' }}
                            alignItems='center'
                            justifyContent='space-evenly'
                            onClick={handleAddRow}
                            disabled={week && year && name && score ? false : true}
                        >
                            Add
                        </Button>

                        <Button
                            variant='contained'
                            endIcon={<DeleteIcon />}
                            sx={{ minWidth: '250px', mt: '40px' }}
                            alignItems='center'
                            justifyContent='space-evenly'
                            onClick={handleDialogOpen}
                            disabled={week && year && name && score ? false : true}
                        >
                            Remove Week
                        </Button>
                    </Box>
                </Box>

                <Box
                    mt='40px'
                    ml={isNonMobile ? '125px' : '0px'}
                    alignItems='center'
                    justifyContent='space-evenly'
                    display='flex'
                    flexDirection='column'
                    width={isNonMobile ? 'auto' : '100%'}
                >
                    <DataGrid
                        columns={columns}
                        rows={rows}
                        autoHeight
                        hideFooter={true}
                        initialState={{
                            sorting: {
                                sortModel: [{ field: 'name', sort: 'asc' }]
                            }
                        }}
                        //onRowDoubleClick={handleRowDoubleClick}
                        sx={{
                            '& .MuiDataGrid-columnHeaders': {
                                color: `${colors.greenAccent[400]}`,
                                fontWeight: 800
                            },
                            width: '100%',
                            minHeight: 300
                        }}
                    />

                    {rowsState.length ? (
                        <Button
                            variant='contained'
                            endIcon={<AddIcon />}
                            sx={{ minWidth: '250px' }}
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
                open={dialogOpen}
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
                        sx={{ color: colors.greenAccent[400] }}
                    >
                        No
                    </Button>
                    <Button
                        onClick={handleRemoveWeek}
                        autoFocus
                        sx={{ color: colors.greenAccent[400] }}
                    >
                        Yes
                    </Button>
                </DialogActions>

            </Dialog>

            <Dialog
                open={dialogSubmit}
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
                        sx={{ color: colors.greenAccent[400] }}
                        component={Link}
                        to='/league'
                        reloadDocument
                    >
                        Go to scoreboard
                    </Button>
                </DialogActions>

            </Dialog>

            <Dialog
                open={false} //{auth === 'suckwithpace' ? false : true}
                hideBackdrop={true}
                disableEnforceFocus={true}
                disableScrollLock={true}
                sx={{
                    "& .MuiDialog-container": {
                        alignItems: "flex-start",
                        paddingTop: "100px"
                    }
                }}
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
                        margin='dense'
                        id='name'
                        name='auth'
                        label='Password'
                        type='auth'
                        fullWidth
                        variant='standard'
                        value={auth}
                        onChange={handleAuth}
                    />
                </DialogContent>
            </Dialog>
        </Box>
    )
}

export default NewWeek;