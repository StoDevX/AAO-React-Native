import {describe, expect, test} from '@jest/globals'

import presenceFixture from '../../../../modules/ccc-calendar/__tests__/fixtures/presence-events.json'
import {parsePresenceEvents} from '../../../../modules/ccc-calendar/parsers/presence'
import {HIDDEN_FROM_CALENDAR} from '../constants'

// The exclusion compares tag values exactly, so a name that drifts from what
// the feed sends hides nothing and every game quietly returns. The recorded
// Presence feed pins the sponsor's spelling. The recorded campus-calendar
// feed (`tec-events.json`) holds no Athletics event, so the category has no
// recording to pin it against.
describe('HIDDEN_FROM_CALENDAR', () => {
	test('names a sponsor the recorded Presence feed actually uses', () => {
		let sponsors = new Set(
			parsePresenceEvents(presenceFixture).flatMap((event) => event.organization ?? []),
		)
		let hiddenSponsors = HIDDEN_FROM_CALENDAR.filter((tag) => tag.axis === 'organization')

		expect(hiddenSponsors).not.toHaveLength(0)
		for (let tag of hiddenSponsors) {
			expect(sponsors).toContain(tag.value)
		}
	})
})
