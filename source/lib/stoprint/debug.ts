import {isUITesting} from '@frogpond/launch-arguments'

/**
 * Serve stoPrint from `__mocks__` rather than PaperCut. On under UI testing,
 * where there are no St. Olaf credentials to log in with and the live API is
 * unreachable from CI, so the job and printer screens would otherwise only ever
 * show the signed-out notice.
 */
export const isStoprintMocked = isUITesting
