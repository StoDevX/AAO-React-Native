/**
 * Bumped whenever the report's shape changes, so an older baseline is not
 * misread. It lives apart from js-size.mjs so the comment job can read it
 * without the packages js-size.mjs needs: that job has no node_modules.
 */
export const REPORT_VERSION = 4
