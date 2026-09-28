import { describe, expect, it } from "vitest";
import { appendAt, getAt, moveAt, removeAt, setAt } from "./paths";

describe("path helpers", () => {
  const doc = { a: { list: [{ x: 1 }, { x: 2 }, { x: 3 }] }, b: "hi" };

  it("reads nested values and array items", () => {
    expect(getAt(doc, "b")).toBe("hi");
    expect(getAt(doc, "a.list.1.x")).toBe(2);
    expect(getAt(doc, "a.missing.deep")).toBeUndefined();
  });

  it("sets without mutating the original", () => {
    const next = setAt(doc, "a.list.1.x", 20);
    expect(getAt(next, "a.list.1.x")).toBe(20);
    expect(getAt(doc, "a.list.1.x")).toBe(2);
    expect(next.a.list).not.toBe(doc.a.list);
    expect(next.b).toBe("hi");
  });

  it("moves, removes and appends list items", () => {
    const moved = moveAt(doc, "a.list", 0, 2);
    expect(moved.a.list.map((i) => i.x)).toEqual([2, 3, 1]);
    expect(moveAt(doc, "a.list", 0, 9)).toBe(doc);
    const removed = removeAt(doc, "a.list", 1);
    expect(removed.a.list.map((i) => i.x)).toEqual([1, 3]);
    const appended = appendAt(doc, "a.list", { x: 4 });
    expect(appended.a.list).toHaveLength(4);
  });
});
