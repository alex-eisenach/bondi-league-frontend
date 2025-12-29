import { getGolferStats, getLeagueStats, getMetadata } from "../backend/hooks";

export { getGolferStats, getLeagueStats, getMetadata };

export const rangeWeeks = (allWeeks, start, end) => {
    return allWeeks.filter(week => (parseInt(week) >= parseInt(start) && parseInt(week) <= parseInt(end)));
}

export const rangeYears = (allYears, start, end) => {
    return allYears.filter(year => (parseInt(year) >= parseInt(start) && parseInt(year) <= parseInt(end)));
}

export const parseDateString = (dateStr) => {
    const reDate = /(\d{4}) \w{2} (\d+)/;
    const match = reDate.exec(dateStr);
    return match;
}