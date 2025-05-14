// dates.mjs

/**
 * Parse a Date or string ("yyyy-MM-dd" or "MM/dd/yyyy") into a JS Date
 */
export function parseDate(input) {
    let year, month, day;
    if (input instanceof Date) {
        year = input.getFullYear();
        month = input.getMonth();
        day = input.getDate();
    } else if (typeof input === 'string') {
        if (input.includes('-')) {
            [year, month, day] = input.split('-').map(n => parseInt(n, 10));
            month -= 1;
        } else if (input.includes('/')) {
            [month, day, year] = input.split('/').map(n => parseInt(n, 10));
            month -= 1;
        } else {
            throw new Error(`Invalid date format: ${input}`);
        }
    } else {
        throw new Error(`Invalid date input: ${input}`);
    }
    return new Date(year, month, day);
}

export function getMonthLater(beginDate, numberOfMonths = 1) {
    const d = parseDate(beginDate);
    const year = d.getFullYear();
    const mon = d.getMonth() + numberOfMonths;
    const day = d.getDate();

    const daysInTarget = new Date(year, mon + 1, 0).getDate();
    const targetDay = (day > daysInTarget ? daysInTarget : day);
    return new Date(year, mon, targetDay);
}

export function getDaysLater(beginDate, numberOfDays = 30) {
    const d = parseDate(beginDate);
    d.setDate(d.getDate() + numberOfDays);
    return d;
}

export function format(date, option = 'yyyy-MM-dd') {
    const d = parseDate(date);
    const yyyy = d.getFullYear();
    const MM = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');

    switch (option) {
        case 'yyyy-MM-dd': return `${yyyy}-${MM}-${dd}`;
        case 'MM/dd/yyyy': return `${MM}/${dd}/${yyyy}`;
        case 'MM-dd-yyyy': return `${MM}-${dd}-${yyyy}`;
        default:
            throw new Error(`Invalid format option: ${option}`);
    }
}

export function reFormat(date, option) {
    return format(parseDate(date), option);
}

const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];
export function getMonth(index) {
    return monthNames[index];
}

const dayNames = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday',
    'Thursday', 'Friday', 'Saturday'
];
export function getDay(dayIndex) {
    return dayNames[dayIndex];
}

export function getDayOfWeek(date) {
    return getDay(parseDate(date).getDay());
}

export function getWeekOfYear(date) {
    const d = parseDate(date);
    const oneJan = new Date(d.getFullYear(), 0, 1);
    const diff = (d - oneJan) / 86400000;               // days since Jan 1
    return Math.ceil((diff + oneJan.getDay() + 1) / 7);
}

export function getFirstDayOfMonth(date) {
    const d = parseDate(date);
    return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function getLastDayOfMonth(date) {
    const d = parseDate(date);
    return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

export function getNextDay(date) {
    const d = parseDate(date);
    d.setDate(d.getDate() + 1);
    return d;
}

export function getPreviousDay(date) {
    const d = parseDate(date);
    d.setDate(d.getDate() - 1);
    return d;
}

function _shiftWeekday(date, offset) {
    const d = parseDate(date);
    const dir = offset > 0 ? 1 : -1;
    let steps = Math.abs(offset);
    while (steps--) {
        d.setDate(d.getDate() + dir);
        if (d.getDay() === 0 || d.getDay() === 6) {
            steps++; // don't count weekends
        }
    }
    return d;
}

//export function getNextWeekday(date) { return _shiftWeekday(date, 1); }
//export function getPreviousWeekday(date) { return _shiftWeekday(date, -1); }

// default export if you prefer an object:
export default {
    parseDate,
    getMonthLater,
    getDaysLater,
    format,
    reFormat,
    getMonth,
    getDayOfWeek,
    getDay,
    getWeekOfYear,
    getFirstDayOfMonth,
    getLastDayOfMonth,
    getNextDay,
    getPreviousDay,
    getNextWeekday,
    getPreviousWeekday
};
