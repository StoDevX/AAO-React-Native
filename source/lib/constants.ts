export const GH_BASE_URL = 'https://github.com/StoDevX/AAO-React-Native'
export const GH_NEW_ISSUE_URL = `${GH_BASE_URL}/issues/new`
export const DEFAULT_URL = 'https://stolaf.api.frogpond.tech/v1/'
// Trailing slash, as above: ky resolves a relative path against the base URL,
// so without it the last path segment is replaced rather than extended.
export const CARLETON_DEFAULT_URL = 'https://carleton.api.frogpond.tech/v1/'
export const SUPPORT_EMAIL = 'allaboutolaf@frogpond.tech'

/**
 * A sheet's middle stop, as a fraction of the height it is allowed.
 *
 * The building detail sheet opens here; the map's sheet opens collapsed and
 * comes here when a building is picked. Shared so the two cannot drift apart --
 * they already had, by a point -- since two sheets in one app stopping at
 * different heights reads as an accident rather than a decision.
 *
 * A fraction is measured against UIKit's maximum detent value, which is the
 * window less its top inset, not the window.
 */
export const SHEET_RESTING_FRACTION = 0.68
