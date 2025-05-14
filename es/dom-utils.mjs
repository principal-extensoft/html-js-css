// domUtils.mjs

/**
 * A small DOM-helper library.
 */

export function removeClass(selector, className) {
    const el = document.querySelector(selector);
    if (el) el.classList.remove(className);
}

export function addClass(selector, className) {
    const el = document.querySelector(selector);
    if (el) el.classList.add(className);
}

export function clearOptions(selectElement) {
    for (let i = selectElement.options.length - 1; i >= 0; i--) {
        selectElement.remove(i);
    }
}

export function makeOption(value, text) {
    const option = document.createElement('option');
    option.value = value;
    option.text = text;
    return option;
}

export function populate(selectElement, value, text) {
    selectElement.add(makeOption(value, text));
}

export function selectedValue(selector) {
    const opt = document.querySelector(`${selector} option:checked`);
    return opt ? opt.value : null;
}

export function selectedValueInt(selector) {
    const val = selectedValue(selector);
    return val != null ? parseInt(val, 10) : 0;
}

export function setSelectValue(selector, value) {
    const el = document.querySelector(selector);
    if (el) el.value = value;
}

export function selectedDate(elementId) {
    const el = document.getElementById(elementId);
    if (el && el.value) {
        const d = new Date(el.value);
        return isNaN(d.getTime()) ? null : d;
    }
    return null;
}

export function selectedValues(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return [];
    return Array.from(el.options)
        .filter(o => o.selected)
        .map(o => o.value);
}

export function getSelectedValues(selectEl) {
    return Array.from(selectEl.options)
        .filter(o => o.selected)
        .map(o => o.value);
}

export function getSelectedKvps(selectEl) {
    return Array.from(selectEl.options)
        .filter(o => o.selected)
        .map(o => ({ key: o.text, value: o.value }));
}

export function getSelectedValue(selectEl) {
    const opt = Array.from(selectEl.options).find(o => o.selected);
    return opt ? opt.value : '';
}

export function resetSelect(selectEl, { disable = false, selectDefault = false } = {}) {
    Array.from(selectEl.options).forEach(o => {
        o.selected = (o.value === '-1') ? selectDefault : false;
    });
    selectEl.disabled = disable;
}

export function splitString(str, delimiters = [' ', '-', ':']) {
    const parts = [];
    let current = '';
    for (const ch of str) {
        if (delimiters.includes(ch)) {
            if (current) { parts.push(current); current = ''; }
        } else {
            current += ch;
        }
    }
    if (current) parts.push(current);
    return parts;
}

export function buildTable(data = [], columns = []) {
    const table = document.createElement('table');
    table.classList.add('table', 'table-striped', 'table-hover');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');
    const tfoot = document.createElement('tfoot');

    // auto-derive columns if not provided
    if (!columns.length && data.length) {
        columns = Object.keys(data[0]).map(field => ({ field, header: field }));
    }

    // header row
    const hdrRow = document.createElement('tr');
    columns.forEach((col, idx) => {
        const th = document.createElement('th');
        th.textContent = col.header;
        if (col.isSortable) {
            const a = document.createElement('a');
            a.href = '#';
            a.classList.add('sort-field');
            a.dataset.sortField = col.field;
            a.dataset.sortIndex = idx;
            const icon = document.createElement('i');
            icon.classList.add('fas', 'fa-lg', 'fa-sort');
            a.append(icon);
            setupSorting(a, table);
            th.append(a);
        }
        hdrRow.append(th);
    });
    thead.append(hdrRow);

    // body rows
    data.forEach(item => {
        const tr = document.createElement('tr');
        columns.forEach(col => {
            const td = document.createElement('td');
            const val = item[col.field];
            td.textContent = col.formatData
                ? formatDate(val, col.formatData)
                : val;
            tr.append(td);
        });
        tbody.append(tr);
    });

    // footer spacer row
    const footer = document.createElement('tr');
    const left = document.createElement('td');
    const mid = document.createElement('td');
    mid.colSpan = columns.length - 2;
    const right = document.createElement('td');
    footer.append(left, mid, right);
    tfoot.append(footer);

    table.append(thead, tbody, tfoot);
    return table;
}

function setupSorting(anchor, table) {
    anchor.addEventListener('click', e => {
        e.preventDefault();
        const idx = Number(anchor.dataset.sortIndex);
        const asc = !anchor.classList.toggle('sort-asc');
        anchor.classList.toggle('sort-desc', !asc);
        sortTable(table, idx, asc);
        // reset other headers
        document.querySelectorAll('.sort-field')
            .forEach(a => { if (a !== anchor) a.classList.remove('sort-asc', 'sort-desc'); });
    });
}

function sortTable(table, colIdx, ascending) {
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.rows);
    rows.sort((a, b) =>
        ascending
            ? a.cells[colIdx].textContent.localeCompare(b.cells[colIdx].textContent)
            : b.cells[colIdx].textContent.localeCompare(a.cells[colIdx].textContent)
    );
    tbody.innerHTML = '';
    rows.forEach(r => tbody.append(r));
}

export function buildTr(...cells) {
    const tr = document.createElement('tr');
    cells.forEach(txt => {
        const td = document.createElement('td');
        td.textContent = txt;
        tr.append(td);
    });
    return tr;
}

export function htmlSelect(facet, onSelect) {
    const sel = document.createElement('select');
    sel.id = facet.id;
    sel.disabled = !facet.isEnabled;
    if (facet.isMultiselect) {
        sel.multiple = true;
        sel.classList.add('multiselect-listbox');
    }
    facet.items.forEach(item => {
        const opt = document.createElement('option');
        opt.value = item.value;
        opt.textContent = item.display;
        opt.disabled = !item.isEnabled;
        opt.selected = item.isSelected;
        sel.append(opt);
    });
    if (onSelect) sel.addEventListener('change', e => onSelect(e, sel));
    return sel;
}

export function htmlFieldset(legendText, element) {
    const fs = document.createElement('fieldset');
    fs.innerHTML = `<legend>${legendText}</legend>`;
    if (element) fs.append(element);
    return fs;
}

export function htmlDateRange({ id, display }) {
    const sid = `${id}-start`, eid = `${id}-end`;
    const div = document.createElement('div');
    div.classList.add('card-content');
    div.innerHTML = `
    <label for="${sid}">Start On:</label>
    <input type="date" id="${sid}">
    <label for="${eid}">End On:</label>
    <input type="date" id="${eid}">
  `;
    const fs = htmlFieldset(display, div);
    fs.classList.add('facet-card');
    return fs;
}

export function resizeGrid(table) {
    const headers = table.querySelectorAll('thead th');
    const rows = table.querySelectorAll('tbody tr');
    headers.forEach((th, i) => {
        const w = th.offsetWidth + 'px';
        rows.forEach(r => { if (r.children[i]) r.children[i].style.width = w; });
    });
}

/*

        import * as DOM from './domUtils.mjs';

        // add a class
        DOM.addClass('#myDiv', 'highlight');

        // build a table
        const tbl = DOM.buildTable(dataArray, columnDefs);
        document.body.append(tbl);

*/