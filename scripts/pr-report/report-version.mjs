/**
 * Bumped whenever the report's shape changes, so an older baseline is not
 * misread. It lives apart from js-size.mjs so the comment job can read it
 * without the packages js-size.mjs needs: that job has no node_modules.
 */
export const REPORT_VERSION = 5

/**
 * Bumped whenever `app-size.json`'s shape changes. Apart from
 * REPORT_VERSION, so a change to one report doesn't throw away the other's
 * baseline.
 */
export const APP_SIZE_VERSION = 1
