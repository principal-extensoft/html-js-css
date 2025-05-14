// calendar.mjs
import Common from './common.mjs';
import DATES from './dates.mjs';
import TOASTER from './toaster.mjs';

const state = {
    now: new Date(),
    currentMonth: null
};

const settings = {
    elements: { container: null },
    elementIds: { container: 'calendar' },
    canSelect: false,
    canSelectAll: false,
    handlers: {
        changeMonth: () => { },
        toggleAll: () => { },
        toggleDay: () => { }
    }
};

function init(calendarSettings = {}) {
    state.now.setHours(0, 0, 0, 0);
    Common.merge(settings, calendarSettings);
    state.currentMonth = new Date(state.now);
    settings.elements.container = document.getElementById(settings.elementIds.container);
    renderMonth();
}

function previousMonth() {
    state.currentMonth.setMonth(state.currentMonth.getMonth() - 1);
    _afterMonthChange();
}

function nextMonth() {
    state.currentMonth.setMonth(state.currentMonth.getMonth() + 1);
    _afterMonthChange();
}

function _afterMonthChange() {
    renderMonth();
    settings.handlers.changeMonth(state.currentMonth);
}

function beginMonth() {
    return DATES.format(DATES.getFirstDayOfMonth(state.currentMonth));
}

function endMonth() {
    return DATES.format(DATES.getLastDayOfMonth(state.currentMonth));
}

function assembleMonth(first, last) {
    const y = first.getFullYear(),
        m = first.getMonth(),
        display = `${y} ${DATES.getMonth(m)}`,
        month = { display, weeks: [] };

    let working = new Date(first),
        started = false;

    while (working <= last) {
        const week = { days: [] };
        for (let i = 0; i < 7; i++) {
            if (started) working.setDate(working.getDate() + 1);
            const dayObj = { dayOfWeek: i, id: null };
            if ((started && working <= last) || (!started && i === first.getDay())) {
                started = true;
                dayObj.date = new Date(working);
                dayObj.id = DATES.format(dayObj.date);
            }
            week.days.push(dayObj);
        }
        month.weeks.push(week);
    }
    return month;
}

function clear() {
    document
        .querySelectorAll('.day-content')
        .forEach(c => c.innerHTML = '');
}

function clearSelections() {
    document
        .querySelectorAll('.day-selector')
        .forEach(cb => cb.checked = false);
}

function toggleAll(isSelect) {
    document
        .querySelectorAll('.day-selector')
        .forEach(cb => {
            cb.checked = isSelect;
            const day = cb.closest('.day-cell').dataset.date;
            settings.handlers.toggleDay(isSelect, day);
        });
}

function renderMonth() {
    const container = settings.elements.container;
    const first = DATES.getFirstDayOfMonth(state.currentMonth);
    const last = DATES.getLastDayOfMonth(state.currentMonth);
    const data = assembleMonth(first, last);
    const nowId = DATES.format(state.now);

    container.innerHTML = '';
    container.className = 'calendar-container';
    if (settings.canSelectAll && state.now <= last) {
        container.classList.add('select-all');
    }
    if (settings.canSelect) {
        container.classList.add('select-day');
    }

    // --- header ---
    const header = document.createElement('header');
    header.className = settings.canSelectAll ? 'calendar-header-select-all' : 'calendar-header';

    if (settings.canSelectAll) {
        const chk = document.createElement('input');
        chk.type = 'checkbox';
        chk.addEventListener('click', () => selectAll(chk.checked));
        header.appendChild(chk);
    }

    const prevBtn = Object.assign(document.createElement('button'), { textContent: 'Previous' });
    prevBtn.addEventListener('click', previousMonth);
    header.append(prevBtn);

    const title = Object.assign(document.createElement('div'), {
        textContent: data.display,
        className: 'month-title'
    });
    header.append(title);

    const nextBtn = Object.assign(document.createElement('button'), { textContent: 'Next' });
    nextBtn.addEventListener('click', nextMonth);
    header.append(nextBtn);

    container.append(header);

    // --- weekday labels ---
    const grid = document.createElement('div');
    grid.className = 'calendar-grid';
    const weekHdr = document.createElement('div');
    weekHdr.className = 'week-row';
    for (let i = 0; i < 7; i++) {
        weekHdr.append(Object.assign(document.createElement('div'), {
            textContent: DATES.getDay(i)
        }));
    }
    grid.append(weekHdr);

    // --- days ---
    data.weeks.forEach(week => {
        const row = document.createElement('div');
        row.className = 'week-row';
        week.days.forEach(day => {
            const cell = document.createElement('div');
            cell.className = 'day-cell';
            if (day.id) {
                cell.id = day.id;
                cell.dataset.date = day.id;
                if (day.id === nowId) cell.classList.add('today');
                if (new Date(day.id) > state.now) cell.classList.add('bingo');

                const hdr = document.createElement('div');
                hdr.className = 'day-header';

                const num = Object.assign(document.createElement('span'), {
                    className: 'date',
                    textContent: day.date.getDate()
                });
                hdr.append(num);

                if (settings.canSelect && day.date >= state.now) {
                    const box = document.createElement('input');
                    box.type = 'checkbox';
                    box.className = 'day-selector';
                    box.addEventListener('click', e => selectDay(box.checked, day.id));
                    hdr.append(box);
                }

                const content = Object.assign(document.createElement('div'), {
                    className: 'day-content',
                    id: `${day.id}-content`
                });

                cell.append(hdr, content);
            }
            row.append(cell);
        });
        grid.append(row);
    });

    container.append(grid);
    return container;
}

function selectAll(isSelected) {
    toggleAll(isSelected);
    settings.handlers.toggleAll(isSelected, state.currentMonth);
}

function selectDay(isSelected, day) {
    settings.handlers.toggleDay(isSelected, day);
}

function setSelected(days = []) {
    days.forEach(d => {
        const cb = document.getElementById(`${d}-selector`);
        if (cb) cb.checked = true;
    });
}

export default {
    init,
    previousMonth,
    nextMonth,
    beginMonth,
    endMonth,
    renderMonth,
    clear,
    clearSelections,
    setSelected,
    assembleMonth
};



/*
        import Calendar from './calendar.mjs';

        Calendar.init({
            elementIds: { container: 'my-calendar-div' },
            canSelect: true,
            canSelectAll: true,
            handlers: {
                changeMonth: m => console.log('month changed to', m),
                toggleAll: (sel, m) => console.log('all toggled', sel, m),
                toggleDay: (sel, d) => console.log('day toggled', sel, d)
            }
        });
*/
