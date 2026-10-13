import {describe, expect, test} from '@jest/globals'

import {routeParam} from '../route-param'

/// What the result screen reads for a param it was given. `router.navigate`
/// encodes each param into a URL and parsing that URL decodes it, which cancel;
/// then useLocalSearchParams decodes once more (expo-router 57's
/// hooks/useLocalSearchParams.js), which is the decode routeParam answers.
const asRead = (value: string) => decodeURIComponent(value)

describe('routeParam', () => {
	test('comes back from the route exactly as it was sent', () => {
		let values = [
			'/v1/calendar/ics?url=https%3A%2F%2Fwww.northfieldmn.gov%2Fical.aspx%3FcatID%3D41%26feed%3Dcalendar',
			'50% off & more',
			'{"query":[{"name":"q","value":"a%2Fb"}]}',
			'/ping',
			'a+b',
		]
		for (let value of values) {
			expect(asRead(routeParam(value))).toBe(value)
		}
	})
})
