// indexdb-provider.mjs

/**
 * A generic IndexedDB wrapper providing basic CRUD operations
 * with no domain-specific logic. ES module version.
 */
export class IndexDBProvider {
  /**
   * @param {string} dbName
   * @param {number} dbVersion
   */
  constructor(dbName, dbVersion) {
    this.dbName    = dbName;
    this.dbVersion = dbVersion;
    this.db        = null;
  }

  /**
   * Opens (and upgrades) the database.
   * @param {(db: IDBDatabase)=>void} [onUpgradeNeeded]
   * @returns {Promise<IDBDatabase>}
   */
  openDatabase(onUpgradeNeeded) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = event => {
        this.db = event.target.result;
        if (onUpgradeNeeded) {
          onUpgradeNeeded(this.db);
        }
      };

      request.onsuccess = event => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onerror = event => {
        reject(event.target.error);
      };
    });
  }

  /**
   * Retrieves all records from a store.
   * @param {string} storeName
   * @returns {Promise<any[]>}
   */
  getAll(storeName) {
    return new Promise((resolve, reject) => {
      const tx    = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req   = store.getAll();

      req.onsuccess = () => resolve(req.result);
      req.onerror   = event => reject(event.target.error);
    });
  }

  /**
   * Retrieves a single record by key.
   * @param {string} storeName
   * @param {*}      id
   * @returns {Promise<any>}
   */
  getById(storeName, id) {
    return new Promise((resolve, reject) => {
      const tx    = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req   = store.get(id);

      req.onsuccess = () => resolve(req.result);
      req.onerror   = event => reject(event.target.error);
    });
  }

  /**
   * Adds or updates a record.
   * @param {string} storeName
   * @param {any}    data
   * @returns {Promise<any>} the key of the stored record
   */
  put(storeName, data) {
    return new Promise((resolve, reject) => {
      const tx    = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req   = store.put(data);

      req.onsuccess = () => resolve(req.result);
      req.onerror   = event => reject(event.target.error);
    });
  }

  /**
   * Deletes a record by key.
   * @param {string} storeName
   * @param {*}      id
   * @returns {Promise<void>}
   */
  delete(storeName, id) {
    return new Promise((resolve, reject) => {
      const tx    = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req   = store.delete(id);

      req.onsuccess = () => resolve();
      req.onerror   = event => reject(event.target.error);
    });
  }
}

export default IndexDBProvider;


/*

import IndexDBProvider from './indexdb-provider.mjs';

async function setup() {
  const dbProvider = new IndexDBProvider('MyAppDB', 1);
  await dbProvider.openDatabase(db => {
    // first‐run schema creation
    if (!db.objectStoreNames.contains('users')) {
      db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
    }
  });

  // CRUD examples:
  await dbProvider.put('users', { name: 'Alice', age: 30 });
  const allUsers = await dbProvider.getAll('users');
  console.log(allUsers);
}

setup();


***

async function setup() {
  // …await dbProvider.openDatabase(…)…
}

// kick it off:
setup();


***

setup().catch(err => {
  console.error('Failed to initialize IndexedDB:', err);
});

(async function() {
  try {
    await setup();
  } catch (err) {
    console.error('Init error:', err);
  }
})();


***

//Alternative: top‐level await
//In an ES module, you can also use top‐level await (if your environment supports it), avoiding the extra call:


// main.mjs
import IndexDBProvider from './indexdb-provider.mjs';

const dbProvider = new IndexDBProvider('MyAppDB', 1);
await dbProvider.openDatabase(db => {
  // upgrade logic…
});

// now you know the DB is ready




*/
