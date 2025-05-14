// supergrid.mjs

import Common from './common.mjs';
import DATES from './dates.mjs';
import TOASTER from './toaster.mjs';
import * as DOM from './domUtils.mjs';  // if you use the DOM utilities

// -- module-scope constants & state --

const icons = {
    commands: {
        delete: 'fa-trash',
        get: 'fa-info-circle',
        post: 'fa-gear',
        put: 'fa-pen-to-square'
    },
    paging: {
        first: 'backward backward',
        previous: 'backward-step',
        next: 'forward-step',
        last: 'forward-fast'
    }
};

const state = {
    grid: {
        pageIndex: 0,
        pageSize: 10,
        sortBy: '',
        settings: {
            isPageable: true,
            isSortable: true,
            hasEdit: true,
            hasDelete: true,
            hasDetails: true,
            isHover: true,
            isStriped: true,
            fields: [],
            primaryKey: 'id',
            commands: {
                baseUrl: '',
                delete: { url: 'delete/{id}' },
                get: { url: 'details/{id}' },
                post: { url: 'create' },
                put: { url: 'edit/{id}' }
            },
            icons: {
                delete: 'fa-trash',
                get: 'fa-info-circle',
                post: '',
                put: 'fa-pen-to-square'
            },
            minwidth: '3rem'
        }
    },
    elementIds: {
        grid: 'my-grid',
        gridContainer: 'super-grid-container'
    },
    handlers: {
        executeIndex: () => TOASTER.error('execute index supergrid'),
        pageChangeHandler: handlePageChange,
        pageSizeChangeHandler: handlePageSizeChange,
        sortGridHandler: handleSortGrid
    }
};

// -- public init --

export function init(gridSettings = {}, handlers = {}, elementIds = {}) {
    Common.merge(state.grid, gridSettings);
    Common.merge(state.handlers, handlers);
    Common.merge(state.elementIds, elementIds);
}

// -- public renderGrid --

export function renderGrid(data) {
    let tbl = document.getElementById(state.elementIds.grid);
    if (!tbl) {
        tbl = buildGrid(data);
    }
    if (data) {
        populateGrid(tbl, data);
    }
}

// -- public assembleSortingPaging --

export function assembleSortingPaging() {
    const qs = [
        `pageSize=${state.grid.pageSize}`,
        `pageIndex=${state.grid.pageIndex}`
    ];
    if (state.grid.sortBy) {
        qs.push(`sortBy=${state.grid.sortBy}`);
    }
    return qs.join('&');
}

// -- private buildGrid --

function buildGrid(data) {
    const { settings } = state.grid;
    const table = document.createElement('table');
    table.id = state.elementIds.grid;
    table.classList.add('table');
    if (settings.isHover) table.classList.add('table-hover');
    if (settings.isStriped) table.classList.add('table-striped');

    // derive fields if none provided
    if (!settings.fields.length && data.items.length) {
        settings.fields = Object.keys(data.items[0]).map(f => ({ field: f, header: f }));
    }

    // header
    const thead = document.createElement('thead');
    const hr = document.createElement('tr');
    if (settings.hasDetails) hr.appendChild(emptyTh());
    settings.fields.forEach(f => hr.appendChild(buildHeader(f)));
    if (settings.hasEdit) hr.appendChild(emptyTh());
    if (settings.hasDelete) hr.appendChild(emptyTh());
    thead.append(hr);

    // body & footer placeholders
    const tbody = document.createElement('tbody');
    const tfoot = document.createElement('tfoot');
    if (settings.isPageable) {
        const fr = document.createElement('tr');
        const left = document.createElement('td');
        const pager = document.createElement('td');
        pager.colSpan = hr.children.length - 2;
        pager.append(buildPager(data));
        const right = document.createElement('td');
        fr.append(left, pager, right);
        tfoot.append(fr);
    }

    table.append(thead, tbody, tfoot);
    document.getElementById(state.elementIds.gridContainer).append(table);
    return table;
}

function emptyTh() {
    const th = document.createElement('th');
    th.style.width = state.grid.settings.minwidth;
    return th;
}

function buildPager(data) {
    const div = document.createElement('div');
    div.style.display = 'flex';
    div.style.justifyContent = 'center';

    // page nav
    const nav = document.createElement('nav');
    nav.ariaLabel = 'Page navigation';
    const ul = document.createElement('ul');
    ul.id = 'pager-nav';
    ul.classList.add('pagination');
    nav.append(ul);

    // page size
    const sizeDiv = document.createElement('div');
    const select = document.createElement('select');
    data.pager.pageSizes.forEach(sz => {
        const opt = document.createElement('option');
        opt.text = sz.display;
        opt.value = sz.value;
        if (state.grid.pageSize == sz.value) opt.selected = true;
        select.append(opt);
    });
    select.addEventListener('change', e => {
        const ps = DOM.getSelectedValue(e.target);
        state.handlers.pageSizeChangeHandler(ps);
    });
    sizeDiv.append('Page size: ', select);

    return div.append(nav, sizeDiv), div;
}

// -- private buildHeader --

function buildHeader(col) {
    const th = document.createElement('th');
    if (col.width && /^(\d+(?:\.\d+)?)(rem|px|%)$/.test(col.width)) {
        th.style.width = col.width;
    }
    th.textContent = col.header;
    if (col.isSortable) {
        const a = document.createElement('a');
        a.href = '#';
        a.classList.add('sort-field');
        a.dataset.sortField = col.field;
        a.dataset.sortDirection = 'none';
        const icon = document.createElement('i');
        icon.classList.add('fas', 'fa-lg', 'fa-sort');
        a.append(icon);
        a.addEventListener('click', e => {
            e.preventDefault();
            const f = a.dataset.sortField;
            const d = a.dataset.sortDirection;
            handleSortGrid(f, d);
        });
        th.append(a);
    }
    return th;
}

// -- private populateGrid --

function populateGrid(table, data) {
    const tbody = table.querySelector('tbody');
    tbody.innerHTML = '';
    data.items.forEach(item => {
        const tr = document.createElement('tr');
        const key = Common.get(item, state.grid.settings.primaryKey, -1);

        if (state.grid.settings.hasDetails) {
            tr.append(cellWithAnchor('get', key));
        }
        state.grid.settings.fields.forEach(fd => {
            const td = document.createElement('td');
            const val = item[fd.field];
            td.textContent = fd.format
                ? DATES.reFormat(val, fd.format)
                : val;
            tr.append(td);
        });
        if (state.grid.settings.hasEdit) tr.append(cellWithAnchor('put', key));
        if (state.grid.settings.hasDelete) tr.append(cellWithAnchor('delete', key));

        tbody.append(tr);
    });

    if (state.grid.settings.isPageable) renderPagerLinks(data);
}

function cellWithAnchor(action, key) {
    const td = document.createElement('td');
    const a = actionAnchor(action, key);
    td.append(a);
    return td;
}

function actionAnchor(action, key) {
    const a = document.createElement('a');
    a.dataset.key = key;
    const i = document.createElement('i');
    let handler;
    switch (action) {
        case 'delete':
            i.classList.add('fas', icons.commands.delete);
            handler = state.handlers.executeDelete;
            break;
        case 'get':
            i.classList.add('fas', icons.commands.get);
            handler = state.handlers.executeGet;
            break;
        case 'put':
            i.classList.add('fas', icons.commands.put);
            handler = state.handlers.executePut;
            break;
        case 'post':
            i.classList.add('fas', icons.commands.post);
            handler = state.handlers.executePost;
            break;
    }
    // build href if URL template present
    const cmdCfg = state.grid.settings.commands[action];
    if (cmdCfg) {
        const url = Common.template(
            `${state.grid.settings.commands.baseUrl}/${cmdCfg.url}`,
            { id: key }
        );
        a.href = url;
    } else if (handler) {
        a.href = '#';
        a.addEventListener('click', e => {
            e.preventDefault();
            handler(key);
        });
    }
    a.append(i);
    return a;
}

// -- private sort, page handlers --

function handleSortGrid(field, dir) {
    const nextDir = dir === 'none' ? 'asc'
        : dir === 'asc' ? 'desc'
            : 'asc';
    state.grid.sortBy = `${field}-${nextDir}`;
    state.handlers.executeIndex();
}

function handlePageChange(idx) {
    state.grid.pageIndex = idx;
    state.handlers.executeIndex();
}

function handlePageSizeChange(size) {
    state.grid.pageSize = size;
    state.handlers.executeIndex();
}

function renderPagerLinks(data) {
    const ul = document.getElementById('pager-nav');
    ul.innerHTML = '';
    const display = document.getElementById('pager-span');
    if (display) display.textContent = data.pager.display;

    data.pager.pagination.forEach(p => {
        const li = document.createElement('li');
        li.className = `page-item${p.isEnabled ? '' : ' disabled'}`;
        const a = document.createElement('a');
        a.className = 'page-link';
        if (p.action === 'page-number' || p.action === 'current') {
            a.textContent = p.display;
        } else {
            const icon = document.createElement('i');
            icon.classList.add('fas', icons.paging[p.action]);
            a.append(icon);
        }
        if (p.isEnabled) {
            a.addEventListener('click', e => {
                e.preventDefault();
                state.handlers.pageChangeHandler(p.index);
            });
        }
        li.append(a);
        ul.append(li);
    });
}


/*


        import * as SuperGrid from './supergrid.mjs';

        SuperGrid.init(
          { grid: { pageSize: 20, settings: { isHover: false } } },
          { executeIndex: () => fetchAndRender() },
          { grid: 'orders-grid', gridContainer: 'orders-container' }
        );

        // later when data arrives:
        SuperGrid.renderGrid(serverData);

        // if you need the query string for paging + sorting:
        const qs = SuperGrid.assembleSortingPaging();
        fetch(`/api/orders?${qs}`).then(r => r.json()).then(data => {
          SuperGrid.renderGrid(data);
        });






*/