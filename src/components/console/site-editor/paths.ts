/**
 * Immutable get/set by dotted path, with numeric segments for arrays.
 * The page editor keeps one JSON document in state and edits it by
 * path, so a field spec can point anywhere in the page.
 */

export type Path = string;

export function splitPath(path: Path): Array<string | number> {
  if (!path) return [];
  return path.split(".").map((seg) => (/^\d+$/.test(seg) ? Number(seg) : seg));
}

export function joinPath(base: Path, rel: Path | number): Path {
  const relStr = String(rel);
  if (!base) return relStr;
  if (relStr === "") return base;
  return `${base}.${relStr}`;
}

export function getAt(value: unknown, path: Path): unknown {
  let cur: unknown = value;
  for (const seg of splitPath(path)) {
    if (cur === null || cur === undefined) return undefined;
    cur = (cur as Record<string | number, unknown>)[seg];
  }
  return cur;
}

export function setAt<T>(value: T, path: Path, next: unknown): T {
  const segs = splitPath(path);
  if (segs.length === 0) return next as T;
  const [head, ...rest] = segs;
  const restPath = rest.join(".");
  if (Array.isArray(value)) {
    const copy = value.slice();
    copy[head as number] = rest.length ? setAt(copy[head as number], restPath, next) : next;
    return copy as T;
  }
  const obj = { ...(value as Record<string | number, unknown>) };
  obj[head] = rest.length ? setAt(obj[head], restPath, next) : next;
  return obj as T;
}

/** Move an item within the array at `path`. */
export function moveAt<T>(value: T, path: Path, from: number, to: number): T {
  const list = getAt(value, path);
  if (!Array.isArray(list) || to < 0 || to >= list.length || from === to) return value;
  const copy = list.slice();
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return setAt(value, path, copy);
}

export function removeAt<T>(value: T, path: Path, index: number): T {
  const list = getAt(value, path);
  if (!Array.isArray(list)) return value;
  return setAt(value, path, list.filter((_, i) => i !== index));
}

export function appendAt<T>(value: T, path: Path, item: unknown): T {
  const list = getAt(value, path);
  return setAt(value, path, [...(Array.isArray(list) ? list : []), item]);
}
