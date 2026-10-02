/**
 * Parses each item of a response on its own, so one malformed item doesn't
 * blank the rest of the list. `parseOne` returns `undefined` for an item that
 * fails its schema; an item whose conversion throws -- an unreadable date, say
 * -- is dropped the same way.
 *
 * A non-empty response that drops down to zero items means the shape changed
 * out from under us, not that one item was malformed -- that throws rather
 * than render a silently blank screen. A genuinely empty response is a
 * legitimate "nothing to show" and stays empty.
 *
 * `what` names one item in the error, as in "every RSS item was malformed".
 */
export function parseEach<In, Out>(
	items: In[],
	parseOne: (item: In) => Out | undefined,
	what: string,
): Out[] {
	let parsed = items.flatMap((item) => {
		try {
			let result = parseOne(item)
			return result === undefined ? [] : [result]
		} catch {
			return []
		}
	})

	if (items.length > 0 && parsed.length === 0) {
		throw new Error(`every ${what} was malformed`)
	}

	return parsed
}
