import * as React from 'react';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { Autocomplete, Box, Button, IconButton, MenuItem, TextField, useTheme, Slider } from '@mui/material';
import ArrowLeftIcon from '@mui/icons-material/ArrowLeft';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import useMediaQuery from '@mui/material/useMediaQuery';
import { DataGrid } from "@mui/x-data-grid";
import { useEffect, useMemo, useState, useRef } from 'react';
import { postNewGolfer, postRemoveWeek, postUpdate } from '../backend/hooks';
import Header from '../components/header';
import AppSelect from '../components/select';
import { useMetadata } from '../context/MetadataContext';
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

    const { allWeeks, allYears, allNames, yearsToWeeks, latestYear, latestWeek, loading } = useMetadata();

    const [week, setWeek] = useState('');
    const [year, setYear] = useState('');
    const [score, setScore] = useState(45);
    const [name, setName] = useState('');
    const [rowsState, setRowsState] = useState([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogSubmit, setDialogSubmit] = useState(false);
    const [auth, setAuth] = useState('');
    const [authDialogOpen, setAuthDialogOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);

    const changeGolfer = golfer => { setName(golfer) }
    const incrStr = (str, incr = 1) => { return (parseInt(str) + incr).toString() };

    useEffect(() => {
        if (!loading) {
            const currentYear = new Date().getFullYear().toString();
            setYear(currentYear);

            // If we're already working in the current year, predict the next week
            if (currentYear === latestYear) {
                if (parseInt(latestWeek) < 15) {
                    setWeek(incrStr(latestWeek));
                } else {
                    setWeek('1');
                }
            } else {
                // If it's a new year with no data yet, or we're jumping to current, start at wk 1
                setWeek('1');
            }
        }
    }, [loading, latestYear, latestWeek]);

    const performRemoveWeek = () => {
        console.log('Removing week: ', week);
        const removeStr = `${year} Wk ${week}`;
        postRemoveWeek({ key: removeStr }).then((d) => {
            console.log('Response: ', d);
            // Optionally redirect after deletion
            window.location.href = '/#/league';
            window.location.reload();
        });
    };

    const handleRemoveWeek = () => {
        setDialogOpen(false);
        if (auth !== 'suckwithpace') {
            setPendingAction(() => performRemoveWeek);
            setAuthDialogOpen(true);
            return;
        }
        performRemoveWeek();
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
        const val = event.target.value;
        setAuth(val);
        if (val === 'suckwithpace') {
            setAuthDialogOpen(false);
            if (pendingAction) {
                pendingAction();
                setPendingAction(null);
            }
        }
    };


    const performSubmit = () => {
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

    const handleSubmit = (values) => {
        if (auth !== 'suckwithpace') {
            setPendingAction(() => performSubmit);
            setAuthDialogOpen(true);
            return;
        }
        performSubmit();
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
            const lastYear = allYears[allYears.length - 1];
            const wksForYr = yearsToWeeks[lastYear] || [];
            const nextYear = incrStr(lastYear);

            // Combine all existing years with the predicted "New" year
            let yearOptions = [...allYears];
            if (wksForYr.slice(-1)[0] === '15') {
                if (!yearOptions.includes(nextYear)) yearOptions.push(nextYear);
            }

            // Also ensure current calendar year is present if it's not already
            const currentCalendarYear = new Date().getFullYear().toString();
            if (!yearOptions.includes(currentCalendarYear)) {
                yearOptions.push(currentCalendarYear);
            }

            return Array.from(new Set(yearOptions)).sort((a, b) => b - a);
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
            p={isNonMobile ? '20px' : '10px'}
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

                        <Box
                            sx={{
                                width: isNonMobile ? 400 : '100%',
                                mt: '40px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center'
                            }}
                        >
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    width: '100%',
                                    mb: '-20px',
                                    zIndex: 1
                                }}
                            >
                                <IconButton
                                    onClick={() => setScore(prev => Math.max(30, prev - 1))}
                                    sx={{ color: colors.greenAccent[400] }}
                                >
                                    <ArrowLeftIcon sx={{ fontSize: '2.5rem' }} />
                                </IconButton>
                                <IconButton
                                    onClick={() => setScore(prev => Math.min(70, prev + 1))}
                                    sx={{ color: colors.greenAccent[400] }}
                                >
                                    <ArrowRightIcon sx={{ fontSize: '2.5rem' }} />
                                </IconButton>
                            </Box>
                            <Slider
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
                                value={score}
                                onChange={e => setScore(e.target.value)}
                                sx={{
                                    color: colors.greenAccent[400],
                                    mt: '30px',
                                    '& .MuiSlider-thumb': {
                                        height: 24,
                                        width: 24,
                                    },
                                    '& .MuiSlider-valueLabel': {
                                        fontSize: '1.1rem',
                                    },
                                    '& .MuiSlider-markLabel': {
                                        fontSize: '1.1rem',
                                    }
                                }}
                            />
                        </Box>
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
                            disabled={week && year && name ? false : true}
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
                            disabled={week && year ? false : true}
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
                    sx={{ flex: 1 }}
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
                PaperProps={{
                    sx: {
                        bgcolor: colors.primary[400],
                        backgroundImage: 'none',
                        borderRadius: "12px",
                        padding: "10px"
                    }
                }}
            >
                <DialogTitle sx={{ color: colors.red[500], fontWeight: 'bold', fontSize: "1.5rem" }}>
                    Confirm Deletion
                </DialogTitle>

                <DialogContent>
                    <DialogContentText sx={{ color: colors.grey[100], fontSize: "1.1rem" }}>
                        You are about to delete the entire week of <strong>{week}</strong> from Year <strong>{year}</strong> and this cannot be undone. Are you sure you want to proceed?
                    </DialogContentText>
                </DialogContent>

                <DialogActions sx={{ p: '20px' }}>
                    <Button
                        onClick={handleDialogClose}
                        sx={{
                            color: colors.grey[100],
                            fontSize: "1rem",
                            px: 3,
                            '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.08)' }
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleRemoveWeek}
                        autoFocus
                        variant="contained"
                        sx={{
                            bgcolor: colors.red[600],
                            color: colors.grey[100],
                            fontSize: "1rem",
                            px: 3,
                            borderRadius: "8px",
                            '&:hover': {
                                bgcolor: colors.red[700]
                            }
                        }}
                    >
                        Proceed
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
                        onClick={() => {
                            window.location.href = '/#/league';
                            window.location.reload();
                        }}
                    >
                        Go to scoreboard
                    </Button>
                </DialogActions>

            </Dialog>

            <Dialog
                open={authDialogOpen}
                hideBackdrop={true}
                disableEnforceFocus={true}
                disableScrollLock={true}
                sx={{
                    "& .MuiDialog-container": {
                        alignItems: "flex-start",
                        paddingTop: "100px"
                    }
                }}
                PaperProps={{
                    sx: {
                        bgcolor: colors.primary[400],
                        backgroundImage: 'none',
                        borderRadius: "12px",
                        padding: "10px",
                        minWidth: "400px"
                    }
                }}
            >
                <DialogTitle sx={{ color: colors.greenAccent[500], fontWeight: 'bold', fontSize: "1.5rem" }}>
                    {"I'm going to need to see some ID"}
                </DialogTitle>

                <DialogContent>
                    <DialogContentText sx={{ color: colors.grey[100], fontSize: "1.1rem", mb: 2 }}>
                        Type in the secret password to proceed...
                    </DialogContentText>
                    <TextField
                        autoFocus
                        required
                        margin='dense'
                        id='name'
                        name='auth'
                        label='Password'
                        type='password'
                        fullWidth
                        variant='outlined'
                        value={auth}
                        onChange={handleAuth}
                        sx={{
                            "& .MuiOutlinedInput-root": {
                                "& fieldset": { borderColor: colors.grey[100] },
                                "&:hover fieldset": { borderColor: colors.greenAccent[400] },
                                "&.Mui-focused fieldset": { borderColor: colors.greenAccent[500] },
                            },
                            "& .MuiInputLabel-root": { color: colors.grey[100] },
                            "& .MuiInputLabel-root.Mui-focused": { color: colors.greenAccent[500] },
                            "& .MuiInputBase-input": { color: colors.grey[100] }
                        }}
                    />
                </DialogContent>
                <DialogActions sx={{ p: '20px' }}>
                    <Button
                        onClick={() => {
                            setAuth('');
                            setAuthDialogOpen(false);
                        }}
                        sx={{
                            color: colors.grey[100],
                            fontSize: "1rem",
                            px: 3,
                            '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.08)' }
                        }}
                    >
                        Cancel
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}

export default NewWeek;