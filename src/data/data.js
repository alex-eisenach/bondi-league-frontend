import {handicap} from "./stats";
import {data} from '../backend/hooks';

const reDate = /(\d{4}) \w{2} (\d+)/;


export const allGolfers = async () => {

    const names = [];
    for (const dataKey of await data) {
        names.push(dataKey['Names'])
    }
    return names;
}

export const parseDateString = (str) => {
    const regEx = reDate.exec(str);
    if (regEx) { return regEx}
    else       { return null }
}

export const rangeWeeks = (weeks, start, end) => {
    return weeks.slice(weeks.indexOf(start), weeks.indexOf(end)+1)
}

export const rangeYears = (years, start, end) => {
    return years.slice(years.indexOf(start), years.indexOf(end)+1)
}

export const stringForDate = (year, week) => {
    const wkStr = (['2017', '2018', '2019', '2020'].includes(year)) ? 'WK' : 'Wk';
    return `${year} ${wkStr} ${week}`;
}

export const getFlightsForDate = (allData, year, week) => {
    console.log(year, week);
    let result = {};
    let grossScores = {};
    let handicaps = {};
    let scores = [];

    if (year == '2017' && week == '1') {return {}}

    for (const obj of allData) {
        let handicapScores = [];
        console.log(obj);
        console.log(stringForDate(year, week));
        // get all scores up to year/week for handicap calc
        for (const [key, val] of Object.entries(obj)) {
            if (key == stringForDate(year, week)) {
                if (val) grossScores[obj['Names']] = val;
            }
            if (parseDateString(key)) {
                if (val) handicapScores.push(val);
            }
        }
        console.log(handicapScores);
        handicaps[obj['Names']] = handicap(handicapScores);
        if (grossScores[obj['Names']]) {
            scores.push([obj['Names'], handicaps[obj['Names']]]);
        }
    }
    scores.sort( (a,b) => a[1]-b[1]);
    const midpoint = Math.ceil(scores.length / 2);

    for (const i in scores) {
        const name = scores[i][0];
        result[name] = {
            'flight'   : (i < midpoint) ? 'A' : 'B',
            'gross'    : grossScores[name],
            'net'      : grossScores[name] - handicaps[name],
            'handicap' : handicaps[name]
        }
    }
    return result;
}

export const weeksForYear = (allData, year) => {
    let allWeeks = new Set();
    for (const [_, golfer] of Object.entries(allData)) {
        const keys = Object.keys(golfer);
        for (const date of keys) {
            const parsedData = parseDateString(date);
            if (parsedData) {
                const [_, _year, _week] = parsedData;
                if (year === _year) {allWeeks.add(_week)};
            }
        }
    }
    return [...allWeeks];
}

export const yearsForWeek = (allData, week) => {
    let allYears = new Set();
    for (const [_, golfer] of Object.entries(allData)) {
        const keys = Object.keys(golfer);
        for (const date of keys) {
            const parsedData = parseDateString(date);
            if (parsedData) {
                const [_, _year, _week] = parsedData;
                if (_week === week) {allYears.add(_year)}
            }
        }
    }
    return [...allYears];
}

export const getDatesForGolfer = async (golfer) => {

    let allWeeks   = new Set();
    let allYears   = new Set();
    let allStrings = new Set();

    const d = await data;
    let dataFilt = d.filter( (d) => { return d['Names'] === golfer } )
    if (dataFilt) {dataFilt = dataFilt[0]}

    for (const [key, _] of Object.entries(dataFilt)) {

        const parsedData = parseDateString(key);
        if (parsedData) {
            const [str, year, week] = parsedData;
            allStrings.add(str);
            allWeeks.add(week);
            allYears.add(year);
        }
    }
    return [allWeeks, allYears, allStrings];
}

export const getScoresForGolfer = async (golfer) => {

    let scores = [];

    const d = await data;
    let dataFilt = d.filter( (d) => { return d['Names'] === golfer } )
    if (dataFilt) {dataFilt = dataFilt[0]}

    for (const [key, score] of Object.entries(dataFilt)) {
        const parsedData = parseDateString(key);
        if (parsedData) {
            scores.push(score)
        }
    }
    const _handicap = handicap(scores);
    return [scores, _handicap];
}

export const getAllData = async () => {

    let allWeeks   = new Set();
    let allYears   = new Set();
    let allStrings = new Set();
    let allNames   = new Set();

    const allData = await data;

    for (const [_, golfer] of Object.entries(allData)) {

        allNames.add(golfer['Names'])
        const [weeks, years, strings] = await getDatesForGolfer(golfer['Names']);

        allWeeks   = allWeeks.union(weeks);
        allYears   = allYears.union(years);
        allStrings = allStrings.union(strings);
    }

    return [allWeeks, allYears, allStrings, allNames, allData];
}

export const selectData = (
    golfer,
    allData,
    weeks,
    years,
    skipMissing=true
) => {

    let scores = [];
    let dates  = [];
    const golferObj = allData.filter( i => i.Names === golfer)[0];
    for (const [key, val] of Object.entries(golferObj)) {
        // parse the str by splitting and looking at first/last entries
        const splitStr = key.split(' ');
        if (splitStr.length === 3) {
            const [yr, _, wk] = splitStr;
            if (years.includes(yr) && weeks.includes(wk)) {
                if (!(skipMissing && val === '')) {
                    scores.push(val);
                    dates.push(key);
                }
            }
        }
    }
    return [scores, dates];
}