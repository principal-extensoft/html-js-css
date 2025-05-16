// facet-converter.mjs

import Common          from './common.mjs';
import ApiService      from './api-service.mjs';
import IndexDBProvider from './indexdb-provider.mjs';

const settings = {
  endpoints: {
    facetsUrl: '/api/facets/search'
  },
  storeName: 'facets',
  facets:  [],      // in-memory cache
  facetIds: []      // configured list of facet IDs to manage
};

let dbProvider;

/**
 * Initialize the converter:
 *  - merge in facetSettings (endpoints, facetIds, storeName)
 *  - open / upgrade the facets store
 *  - load any cached facets
 *  - fetch & cache any missing ones
 *
 * @param {{ endpoints?:{facetsUrl:string}, storeName?:string, facetIds?:string[] }} facetSettings
 * @param {{ dbName?:string, dbVersion?:number }} providerSettings
 */
export async function init(facetSettings = {}, providerSettings = {}) {
  Common.merge(settings, facetSettings);

  // 1) set up IndexedDB provider
  const { dbName = 'AppDB', dbVersion = 1 } = providerSettings;
  dbProvider = new IndexDBProvider(dbName, dbVersion);
  await dbProvider.openDatabase(db => {
    if (!db.objectStoreNames.contains(settings.storeName)) {
      db.createObjectStore(settings.storeName, { keyPath: 'id' });
    }
  });

  // 2) load all cached facets
  settings.facets = await dbProvider.getAll(settings.storeName) || [];

  // 3) determine which IDs we still need to fetch
  const misses = (settings.facetIds || [])
    .filter(id => !settings.facets.find(f => f.id === id));

  if (misses.length) {
    await loadFacets(misses);
  }
}

/** Fetch missing facets from the API and cache them in IndexedDB + memory */
async function loadFacets(misses) {
  // build query string like ?ids=foo,bar,baz
  const qs  = misses.join(',');
  const url = `${settings.endpoints.facetsUrl}?ids=${encodeURIComponent(qs)}`;

  return new Promise((resolve, reject) => {
    ApiService.get(
      url,
      async data => {
        if (data.facets && Array.isArray(data.facets)) {
          for (const f of data.facets) {
            settings.facets.push(f);
            // upsert into IndexedDB
            await dbProvider.put(settings.storeName, f);
          }
        }
        resolve();
      },
      err => {
        console.error('facet-converter.loadFacets error:', err);
        reject(err);
      }
    );
  });
}

/**
 * Convert a stored value to its display text for the given facet ID.
 * @param {*}  value
 * @param {string} facetId
 * @returns {*} display text or the original value
 */
export function convert(value, facetId) {
  const facet = settings.facets.find(f => f.id === facetId);
  if (!facet) return value;

  const item = facet.items.find(i => String(i.value) === String(value));
  return item ? item.display : value;
}

/**
 * Convert a display text back to its stored value for the given facet ID.
 * @param {*} display
 * @param {string} facetId
 * @returns {*} raw value or the original display
 */
export function convertBack(display, facetId) {
  const facet = settings.facets.find(f => f.id === facetId);
  if (!facet) return display;

  const item = facet.items.find(i => String(i.display) === String(display));
  return item ? item.value : display;
}


/*
<script type="module">
  import { init as initFacets, convert, convertBack } from '/js/facet-converter.mjs';

  (async () => {
    // configure which facet IDs you care about
    await initFacets({
      facetIds: ['status','category','priority'],
      endpoints: { facetsUrl: '/api/facets/search' },
      storeName: 'myFacetStore'
    }, {
      dbName:    'MyAppDB',
      dbVersion: 2
    });

    // later, to render a cell:
    const raw = 'open';
    const display = convert(raw, 'status');   // e.g. "Open"
    console.log(display);

    // and to store user‐edited display back:
    const back = convertBack('High Priority','priority');
    console.log(back); // e.g. "3"
  })();
</script>





*/
