import {Share, type ShareContent} from 'react-native'

import {reportOutOfApp} from './findings'

/** What a share was of: its title, else its URL, else its message. */
function shareName(content: ShareContent): string {
	return content.title || content.url || content.message || ''
}

/**
 * Replaces `share.share` with one that reports an out-of-app finding and
 * resolves as though the person dismissed the sheet, so no system share
 * sheet opens over the app during a chaos run, whichever feature asks.
 */
export function guardShare(share: Pick<typeof Share, 'share'>): void {
	share.share = (content) => {
		reportOutOfApp(`share ${shareName(content)}`)
		return Promise.resolve({action: Share.dismissedAction})
	}
}
