export const GH_BASE_URL = 'https://github.com/StoDevX/AAO-React-Native'
export const GH_NEW_ISSUE_URL = `${GH_BASE_URL}/issues/new`
export const DEFAULT_URL = 'https://stolaf.api.frogpond.tech/v1/'
// Trailing slash, as above: ky resolves a relative path against the base URL,
// so without it the last path segment is replaced rather than extended.
export const CARLETON_DEFAULT_URL = 'https://carleton.api.frogpond.tech/v1/'
export const SUPPORT_EMAIL = 'allaboutolaf@frogpond.tech'

/**
 * Where a sheet rests before anyone drags it, as a fraction of the height it
 * is allowed.
 *
 * Shared so the building detail sheet and the campus map's sheet cannot drift
 * apart: a half leaves both of them reading as cramped, and two sheets in one
 * app resting at different heights reads as an accident.
 */
export const SHEET_RESTING_FRACTION = 0.68
