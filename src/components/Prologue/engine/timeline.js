/*
 * The prologue's editable timeline, in Theatre.js. The engine declares its objects here; on the tuning page the
 * Theatre studio edits them (keyframes, curves, static values) and saves one file, src/components/Prologue/
 * theatre-state.json, which the site loads with @theatre/core alone (no studio).
 *
 * Every object's props are plain numbers, {x, y, z} vectors or colours; `read(key)` gives its value at the
 * sequence's current position, with vectors as arrays and colours as hex strings.
 */
import * as Core from '@theatre/core';

const { getProject, types } = Core.getProject ? Core : Core.default;   // a CommonJS bundle: exports may sit on default
export const PROJECT_ID = 'bentOS prologue';

/** Prop types from plain defaults: a number, an [x, y, z] vector or a '#rrggbb' colour. Options per prop:
 *  `range`, `step` (the drag nudge). */
function prop(v, o = {}) {
  if (Array.isArray(v)) {
    const n = (x) => types.number(x, { nudgeMultiplier: o.step ?? 0.005 });
    return types.compound({ x: n(v[0]), y: n(v[1]), z: n(v[2]) });
  }
  if (typeof v === 'string') {
    const c = parseInt(v.slice(1), 16);
    return types.rgba({ r: (c >> 16 & 255) / 255, g: (c >> 8 & 255) / 255, b: (c & 255) / 255, a: 1 });
  }
  return types.number(v, { nudgeMultiplier: o.step ?? 0.01, ...(o.range && { range: o.range }) });
}
const hex = ({ r, g, b }) => '#' + [r, g, b].map((c) => Math.round(Math.min(1, Math.max(0, c)) * 255).toString(16).padStart(2, '0')).join('');
const plain = (v) => typeof v === 'number' ? v : 'x' in v ? [v.x, v.y, v.z] : 'r' in v ? hex(v) : v;

/**
 * Open the project and its sheet. `state` is the saved theatre-state.json (or nothing: everything at its defaults).
 * Returns { sheet, define(key, defaults, options?) → object, read(key) → values, onChange(key, fn) }.
 */
export async function createTimeline(state) {
  const project = getProject(PROJECT_ID, state ? { state } : undefined);
  await project.ready;
  const sheet = project.sheet('Prologue');
  const objects = {};
  return {
    sheet,
    project,
    /** Declare an object: `defaults` maps prop names to plain defaults; `options[prop]` gives { range, step }. */
    define(key, defaults, options = {}) {
      const props = Object.fromEntries(Object.entries(defaults).map(([k, v]) => [k, prop(v, options[k])]));
      objects[key] = sheet.object(key, props, { reconfigure: true });
      return objects[key];
    },
    /** The object's values right now (at the sequence's position), as plain numbers, arrays and hex strings. */
    read(key) {
      return Object.fromEntries(Object.entries(objects[key].value).map(([k, v]) => [k, plain(v)]));
    },
    /** Call fn(values) whenever the object's values change (edits, or keyframes as the playhead moves). */
    onChange(key, fn) {
      return objects[key].onValuesChange((v) => fn(Object.fromEntries(Object.entries(v).map(([k, x]) => [k, plain(x)]))));
    },
  };
}
