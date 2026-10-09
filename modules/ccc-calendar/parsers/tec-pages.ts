// Read by the parser (tec-events.ts) and by the campus fixture recorder
// (scripts/campus-fixtures.mjs), which stops where the app does. No React
// Native imports: Node runs this file as it is.

/**
 * The most pages `fetchTecPages` will follow: 500 events, over three times
 * what the campus calendar lists in a month of term. Reaching it means a
 * feed that never stops handing out a next page.
 */
export const TEC_MAX_PAGES = 10
