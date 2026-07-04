// Thin backward-compatible wrapper — data is now in items.mjs
import { CoCItemDB } from './items.mjs';
export { CoCItemDB };
if (typeof window !== 'undefined') window.CoCItemDB = window.CoCItemDB || CoCItemDB;
