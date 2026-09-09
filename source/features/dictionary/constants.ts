// Constants the edit forms turn on. Measurements of the read-only entry
// sheet -- sizes, indents, the gaps between blocks -- live in `lib/metrics.ts`
// instead.

/// How many lines a multi-line definition field stays on screen before it
/// scrolls. Shared by the edit and sense forms so a definition looks the same
/// size wherever it is edited.
export const DEFINITION_LINES = {min: 2, max: 10}
