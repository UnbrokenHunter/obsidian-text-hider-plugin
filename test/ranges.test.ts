import assert from "node:assert/strict";
import test from "node:test";
import { EditorSelection, EditorState } from "@codemirror/state";
import {
  computeRevealRanges,
  mergeRanges,
  subtractRanges,
} from "../src/privacy/cm6/masking/ranges";
import { isCalloutBlockLine } from "../src/privacy/cm6/masking/headers";

test("mergeRanges merges overlapping and adjacent ranges", () => {
  assert.deepEqual(mergeRanges([{ from: 8, to: 10 }, { from: 1, to: 4 }, { from: 4, to: 9 }]), [
    { from: 1, to: 10 },
  ]);
});

test("subtractRanges leaves only masked portions", () => {
  assert.deepEqual(
    subtractRanges([{ from: 0, to: 20 }], [{ from: 3, to: 7 }, { from: 12, to: 16 }]),
    [
      { from: 0, to: 3 },
      { from: 7, to: 12 },
      { from: 16, to: 20 },
    ]
  );
});

test("word reveal includes accented letters and curly apostrophes", () => {
  const accentState = EditorState.create({ doc: "cafe\u0301 we're ready", selection: { anchor: 2 } });
  assert.deepEqual(computeRevealRanges(accentState, "word"), [{ from: 0, to: 5 }]);

  const apostropheState = EditorState.create({ doc: "we\u2019re ready", selection: { anchor: 2 } });
  assert.deepEqual(computeRevealRanges(apostropheState, "word"), [{ from: 0, to: 5 }]);
});

test("every cursor reveals its own word", () => {
  const state = EditorState.create({
    doc: "first\nsecond",
    extensions: [EditorState.allowMultipleSelections.of(true)],
    selection: EditorSelection.create([EditorSelection.cursor(1), EditorSelection.cursor(8)]),
  });

  assert.deepEqual(computeRevealRanges(state, "word"), [
    { from: 0, to: 5 },
    { from: 6, to: 12 },
  ]);
});

test("letter reveal uses the preceding character at document end", () => {
  const state = EditorState.create({ doc: "note", selection: { anchor: 4 } });
  assert.deepEqual(computeRevealRanges(state, "letter"), [{ from: 3, to: 4 }]);
});

test("reveal amount keeps the focused word and reveals adjacent words", () => {
  const state = EditorState.create({ doc: "one two three four", selection: { anchor: 5 } });
  assert.deepEqual(computeRevealRanges(state, "word", 3), [{ from: 4, to: 18 }]);
});

test("sentence reveal keeps the focused sentence and supports multiple sentences", () => {
  const doc = "First sentence. Second sentence! Third sentence?";
  const state = EditorState.create({ doc, selection: { anchor: doc.indexOf("Second") + 2 } });

  assert.deepEqual(computeRevealRanges(state, "sentence"), [
    { from: doc.indexOf("Second"), to: doc.indexOf("!") + 1 },
  ]);
  assert.deepEqual(computeRevealRanges(state, "sentence", 2), [
    { from: doc.indexOf("Second"), to: doc.length },
  ]);
});

test("line reveal keeps the focused line and reveals following lines", () => {
  const doc = "first line\nsecond line\nthird line";
  const state = EditorState.create({ doc, selection: { anchor: doc.indexOf("second") + 2 } });

  assert.deepEqual(computeRevealRanges(state, "line"), [{ from: 11, to: 22 }]);
  assert.deepEqual(computeRevealRanges(state, "line", 2), [{ from: 11, to: doc.length }]);
});

test("callout block detection includes continuation lines but not regular quotes", () => {
  const state = EditorState.create({ doc: "Normal\n> [!note] Callout\n> Continuation\n\n> Regular quote" });

  assert.equal(isCalloutBlockLine(state.doc, 2), true);
  assert.equal(isCalloutBlockLine(state.doc, 3), true);
  assert.equal(isCalloutBlockLine(state.doc, 5), false);
});

test("character reveal amount moves backward at document end", () => {
  const state = EditorState.create({ doc: "note", selection: { anchor: 4 } });
  assert.deepEqual(computeRevealRanges(state, "letter", 3), [{ from: 1, to: 4 }]);
});