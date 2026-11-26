import {z} from 'zod'

import type {Release} from '../types'

/** One `{days, from, to}` span of a building's hours. */
const buildingHoursSpan = z.looseObject({
	days: z
		.array(z.string())
		.describe(
			'Two-letter weekdays: Mo, Tu, We, Th, Fr, Sa, Su; matched against moment().format("dd")',
		),
	from: z
		.string()
		.describe('Opening time, parsed strictly with moment format "h:mma" (e.g. 7:00am)'),
	to: z
		.string()
		.describe(
			'Closing time, parsed strictly with moment format "h:mma"; earlier than from means past midnight',
		),
})

/** One named schedule ("Hours", "Kitchen", ...) of a building. */
const buildingSchedule = z.looseObject({
	title: z
		.string()
		.describe(
			'Shown as a section header (upper-cased on iOS) and as the row label unless it is "Hours"',
		),
	notes: z.string().optional().describe('Shown as the section footer on the detail screen'),
	isPhysicallyOpen: z.boolean().optional().describe('false forces the status to Closed'),
	closedForChapelTime: z
		.boolean()
		.optional()
		.describe('true shows "Chapel" during the bundled chapel schedule'),
	hours: z.array(buildingHoursSpan),
})

/** A building in building-hours.json. */
const building = z.looseObject({
	name: z.string(),
	category: z.string().optional().describe('Section heading; missing means "Other"'),
	abbreviation: z.string().optional(),
	subtitle: z.string().optional(),
	image: z
		.string()
		.optional()
		.describe(
			'Key into the images bundled with the release, not a URL; an unknown key shows no header image',
		),
	schedule: z.array(buildingSchedule).optional().describe('Missing means "Hours unknown"'),
})

/** A COR (dietary) icon in a BonApp `cor_icons` map. */
const bonAppCorIcon = z.looseObject({
	label: z
		.string()
		.describe('Filter option title; matched against the values of an item cor_icon map'),
	image: z.string().optional().describe('Icon URL drawn in each item row and the filter list'),
	description: z.string().optional().describe('HTML; tags stripped for the filter detail text'),
})

/** One station of a BonApp daypart. */
const bonAppStation = z.looseObject({
	label: z
		.string()
		.describe('Title-cased; the station heading and the key items are matched against'),
	note: z.string().optional().describe('Shown as the station heading subtitle'),
	items: z.array(z.string()).describe('Ids into the response items map'),
})

/** One daypart (meal) of a BonApp cafe menu. */
const bonAppDaypart = z.looseObject({
	label: z.string().describe('Meal name shown in the toolbar'),
	starttime: z
		.string()
		.describe(
			'Moment format "H:mm", parsed strictly; read only when the cafe has more than one daypart',
		),
	endtime: z
		.string()
		.describe(
			'Moment format "H:mm", parsed strictly; read only when the cafe has more than one daypart',
		),
	stations: z.array(bonAppStation),
})

/** One food item in a BonApp `items` map. */
const bonAppItem = z.looseObject({
	label: z
		.string()
		.describe('Whitespace collapsed and title-cased; items are de-duplicated by label'),
	station: z
		.string()
		.describe(
			'HTML such as "<strong>@grill</strong>"; the tags are stripped and the name title-cased, then matched against station labels',
		),
	description: z.string().optional().describe('HTML; its text is shown under the label'),
	special: z
		.boolean()
		.optional()
		.describe('Truthy marks the item with a star and keeps it under "Only Show Specials"'),
	cor_icon: z
		.union([z.record(z.string(), z.string()), z.array(z.string())])
		.optional()
		.describe(
			'COR icon id -> label map (BonApp sends [] when empty); the keys pick icons from cor_icons and the values are matched by the dietary filter, which throws if this is missing while that filter is on',
		),
})

/** A food item in pause-menu.json. */
const pauseMenuItem = z.looseObject({
	label: z.string(),
	station: z.string().describe('Must equal a stationMenus label for the item to be listed'),
	description: z.string().optional(),
	special: z.boolean().optional(),
})

/** A station in pause-menu.json. */
const pauseMenuStation = z.looseObject({
	label: z.string(),
	note: z.string().optional().describe('Shown as the station heading subtitle'),
})

/** A Google Calendar event time: the code reads `date || dateTime`. */
const googleCalendarTime = z
	.looseObject({
		date: z.string().optional().describe('YYYY-MM-DD for all-day events; parsed with moment()'),
		dateTime: z.string().optional().describe('RFC 3339 timestamp; parsed with moment()'),
	})
	.describe('At least one of date or dateTime must be present')

/** The username and password the release posts to the OleCard balance page. */
const oleCardLoginForm = z
	.looseObject({
		username: z.string(),
		password: z.string(),
	})
	.describe('multipart/form-data, built with FormData')

/** The final 2.1 build, tagged v2.1.1. */
export const release: Release = {
	tag: 'v2.1.1',
	version: '2.1.2',
	contracts: [
		{
			name: 'building-hours',
			method: 'GET',
			url: 'https://stodevx.github.io/AAO-React-Native/building-hours.json',
			format: 'json',
			source: ['views/building-hours/index.js:68'],
			response: z.looseObject({
				data: z.array(building),
			}),
			notes:
				'GitHub Pages copy of data/building-hours (repository path cased AAO-React-Native). A failed request falls back to the bundled docs/building-hours.json; a response without data shows an empty list. Development builds always use the bundled copy. Chapel times come from the bundled docs/chapel.json, never the network.',
		},
		{
			name: 'pause-menu',
			method: 'GET',
			url: 'https://stodevx.github.io/AAO-React-Native/pause-menu.json',
			format: 'json',
			source: ['views/menus/menu-github.js:52'],
			response: z.looseObject({
				data: z.looseObject({
					foodItems: z.array(pauseMenuItem).optional(),
					stationMenus: z.array(pauseMenuStation).optional(),
					corIcons: z.record(z.string(), bonAppCorIcon).optional(),
				}),
			}),
			notes:
				'The Pause tab of Menus. A failed request, or a response without data, falls back to the bundled docs/pause-menu.json; a missing list is treated as empty. foodItems or stationMenus present but not an array crashes the screen. Development builds always use the bundled copy.',
		},
		{
			name: 'faqs',
			method: 'GET',
			url: 'https://stodevx.github.io/AAO-React-Native/faqs.json',
			format: 'json',
			source: ['views/faqs/index.js:32'],
			response: z.looseObject({
				text: z.string().describe('A full HTML page, shown in a WebView'),
			}),
			notes:
				'Settings > FAQs. A failed request keeps the bundled docs/faqs.json; a response without text leaves the screen on its loading spinner. Development builds always use the bundled copy.',
		},
		{
			name: 'bonapp-menu',
			method: 'GET',
			url: 'http://legacy.cafebonappetit.com/api/2/menus?cafe={cafe}',
			params: {cafe: ['261', '262', '35', '36', '458', '34']},
			format: 'json',
			source: ['views/menus/menu-bonapp.js:65', 'views/menus/tabs.js:15'],
			response: z.looseObject({
				days: z
					.array(
						z.looseObject({
							cafes: z.record(
								z.string(),
								z.looseObject({
									dayparts: z
										.array(z.array(bonAppDaypart))
										.describe(
											"A one-element array holding the day's dayparts; empty means no menu",
										),
								}),
							),
						}),
					)
					.describe('Only days[0] is read, and days[0].cafes must hold the requested cafe id'),
				items: z
					.record(z.string(), bonAppItem)
					.describe('Item id -> item; ids a station lists but this map lacks are skipped'),
				cor_icons: z
					.record(z.string(), bonAppCorIcon)
					.optional()
					.describe('COR icon id -> icon; missing means no dietary icons or filters'),
			}),
			notes:
				'Plain http. Requested together with bonapp-cafe through Promise.all; either failing shows "Error: <message>". Cafe ids: 261 Stav Hall, 262 The Cage, and Carleton\'s 35 Burton, 36 LDC, 458 Weitz Center, 34 Sayles Hill (tabs.js lines 15, 30, 74, 86, 98, 111). A dev BonApp picker that takes any id exists but is not reachable. A days[0] without the requested cafe crashes the screen. No bundled fallback.',
		},
		{
			name: 'bonapp-cafe',
			method: 'GET',
			url: 'http://legacy.cafebonappetit.com/api/2/cafes?cafe={cafe}',
			params: {cafe: ['261', '262', '35', '36', '458', '34']},
			format: 'json',
			source: ['views/menus/menu-bonapp.js:66', 'views/menus/tabs.js:15'],
			response: z.looseObject({
				cafes: z
					.record(
						z.string(),
						z.looseObject({
							days: z.array(
								z.looseObject({
									date: z
										.string()
										.describe('YYYY-MM-DD; compared with today in America/Winnipeg time'),
									status: z
										.string()
										.describe(
											'"closed" shows the message instead of the menu; other values ("open") show the menu',
										),
									message: z
										.union([z.string(), z.literal(false)])
										.optional()
										.describe('Shown when status is "closed"; falsy means "Closed today"'),
								}),
							),
						}),
					)
					.describe(
						'Cafe id -> cafe; a missing cafe shows "BonApp did not return a menu for that café"',
					),
			}),
			notes:
				'Plain http. Checked before the menu: no entry for today\'s date shows "Closed today". Fetched together with bonapp-menu; see that contract for failure handling and cafe ids.',
		},
		{
			name: 'news-rss',
			method: 'GET',
			url: '{feed}',
			params: {
				feed: [
					'https://wp.stolaf.edu/feed/',
					'http://oleville.com/politicole/feed/',
					'http://manitoumessenger.com/feed/',
				],
			},
			format: 'xml',
			source: ['views/news/news-container.js:45', 'views/news/tabs.js:11'],
			response: z
				.string()
				.describe(
					"RSS 2.0, parsed client side with xml2js: rss > channel[0] > item[], each item's title, description and content:encoded",
				),
			notes:
				'News tabs St. Olaf, PoliticOle and Mess (the last two over plain http). Reads rss.channel[0].item; each item needs <title> and <description> (description is stripped of tags for the preview), and <content:encoded> is used for the story body when present. On failure the screen shows "No news." (the error notice is checked after the empty-list notice); no bundled fallback.',
		},
		{
			name: 'oleville-posts',
			method: 'GET',
			url: 'http://oleville.com/wp-json/wp/v2/posts?per_page=5',
			format: 'json',
			source: ['views/oleville/index.js:93'],
			response: z.array(
				z.looseObject({
					featured_media: z
						.number()
						.optional()
						.describe(
							'Media id looked up through oleville-media; falsy uses the default Oleville logo',
						),
					title: z.looseObject({
						rendered: z.string().describe('HTML; parsed and its text shown as the row title'),
					}),
					content: z.looseObject({
						rendered: z.string().describe('HTML, shown in the story WebView'),
					}),
				}),
			),
			notes:
				'WordPress REST API v2 over plain http. On failure the view shows an empty list; no bundled fallback.',
		},
		{
			name: 'oleville-media',
			method: 'GET',
			url: 'http://oleville.com/wp-json/wp/v2/media/{id}',
			format: 'json',
			source: ['views/oleville/index.js:80'],
			response: z.looseObject({
				media_details: z
					.looseObject({
						sizes: z
							.looseObject({
								medium: z
									.looseObject({
										source_url: z
											.string()
											.optional()
											.describe('Image URL shown behind the row title'),
									})
									.optional(),
							})
							.optional(),
					})
					.optional(),
			}),
			notes:
				'One request per post with a featured_media id. Read with lodash get(); a missing path or a failed request uses http://oleville.com/wp-content/uploads/2015/12/Oleville-Logo.png instead.',
		},
		{
			name: 'google-calendar-events',
			method: 'GET',
			url: 'https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events?maxResults=50&orderBy=startTime&showDeleted=false&singleEvents=true&timeMin={timeMin}&key={key}',
			params: {
				calendarId: [
					'le6tdd9i38vgb7fcmha0hu66u9gjus2e%40import.calendar.google.com',
					'stolaf.edu_fvulqo4larnslel75740vglvko@group.calendar.google.com',
					'stolaf.edu_qkrej5rm8c8582dlnc28nreboc@group.calendar.google.com',
					'thisisnorthfield%40gmail.com',
				],
			},
			format: 'json',
			source: ['views/calendar/calendar.js:69', 'views/calendar/tabs.js:10'],
			response: z.looseObject({
				items: z.array(
					z.looseObject({
						summary: z.string().describe('HTML tags stripped; shown as the event title'),
						location: z.string().optional(),
						start: googleCalendarTime,
						end: googleCalendarTime,
					}),
				),
				error: z
					.looseObject({message: z.string()})
					.optional()
					.describe('When present the screen shows an error notice'),
			}),
			notes:
				"Calendar tabs St. Olaf, Oleville, The Pause and Northfield. The ids are inserted as written: two are pre-encoded (%40) and two carry a raw @. timeMin is the current time as an ISO string (URL-encoded by querystring); key is GOOGLE_CALENDAR_API_KEY from the build's .env.js. A non-2xx answer shows its status text; a 2xx answer without items leaves the screen loading (the map over undefined throws in an unhandled promise). No bundled fallback.",
		},
		{
			name: 'student-orgs',
			method: 'GET',
			url: 'https://api.checkimhere.com/stolaf/v1/organizations',
			format: 'json',
			source: ['views/student-orgs/list.js:71'],
			response: z.array(
				z.looseObject({
					name: z
						.string()
						.describe(
							'Sorted and grouped by its first letter, ignoring a leading "St. Olaf" or "The"',
						),
					categories: z
						.array(z.string())
						.describe('Joined with ", " in the row and the detail screen'),
					newOrg: z.boolean().optional().describe('Truthy shows a blue dot'),
					uri: z.string().describe('Appended to the URL for student-org-detail'),
				}),
			),
			notes: 'On failure the view shows "No organizations found."; no bundled fallback.',
		},
		{
			name: 'student-org-detail',
			method: 'GET',
			url: 'https://api.checkimhere.com/stolaf/v1/organizations/{uri}',
			format: 'json',
			source: ['views/student-orgs/detail-wrapper.js:35'],
			response: z.looseObject({
				contactName: z.string().optional(),
				description: z.string().optional().describe('HTML; tags stripped for display'),
				regularMeetingTime: z.string().optional(),
				regularMeetingLocation: z.string().optional(),
			}),
			notes:
				'uri comes from the student-orgs list entry. Each field is trimmed with a default only for undefined, so a null field (or a failed request) shows "No information found." The meetings section shows only when both time and location are non-empty.',
		},
		{
			name: 'sis-financials',
			method: 'GET',
			url: 'https://www.stolaf.edu/sis/st-financials.cfm',
			format: 'html',
			source: ['flux/init.js:37', 'lib/financials/balances.js:55'],
			response: z.string(),
			notes:
				'Relies on the SIS session cookie from the SIS web login. At launch (flux/init.js) only the final URL is read: if it equals this URL exactly (no redirect) the SIS token is treated as valid and balances and courses are loaded; the body is ignored and a non-2xx answer is an unhandled rejection. For balances (lib/financials/balances.js), a final URL starting with https://www.stolaf.edu/sis/landing-page.cfm is an "Authentication Error"; an empty body means no balances; otherwise it takes the text of the last three elements matching the CSS selector ".sis-money" as flex, ole and print, removes "$" and ".", and parses each as an integer number of cents (NaN becomes null). Balances are cached in AsyncStorage.',
		},
		{
			name: 'sis-student-number',
			method: 'GET',
			url: 'https://www.stolaf.edu/sis/st-grades.cfm',
			format: 'html',
			source: ['lib/courses/load-student-number.js:39'],
			response: z.string(),
			notes:
				'Relies on the SIS session cookie. A final URL starting with https://www.stolaf.edu/sis/landing-page.cfm is an "Authentication Error". Reads the value attribute of every element matching "[name=stnum]" as a number and uses the first unique one; none is an error. Cached in AsyncStorage; feeds sis-courses.',
		},
		{
			name: 'sis-courses',
			method: 'POST',
			url: 'https://www.stolaf.edu/sis/st-grades.cfm',
			format: 'html',
			source: ['lib/courses/load-courses-from-unofficial-transcript.js:42'],
			request: z
				.looseObject({
					stnum: z.string().describe('The student number from sis-student-number'),
					searchyearterm: z.literal('0'),
				})
				.describe('multipart/form-data, built with FormData'),
			response: z.string(),
			notes:
				'Relies on the SIS session cookie. A final URL starting with https://www.stolaf.edu/sis/landing-page.cfm is an "Authentication Error". Selects "td.sis-termheader, tr.sis-line1, tr.sis-line2" in document order: a td.sis-termheader\'s text starts a term, and each following row\'s element children are read as deptnum, name, instructors, credits (Number) and grade. deptnum is matched with /(([A-Z]+)(?=\\/)(?:\\/)([A-Z]+)|[A-Z]+) *([0-9]{3,}?) *([A-Z]?)/i. A course row before any term header throws. Cached in AsyncStorage.',
		},
		{
			name: 'olecard-login',
			method: 'POST',
			url: 'https://www.stolaf.edu/apps/olecard/checkbalance/authenticate.cfm',
			format: 'html',
			source: ['lib/login.js:31'],
			request: oleCardLoginForm,
			response: z.string(),
			notes:
				'Validates the St. Olaf username and password saved in the Keychain, at launch and from Settings. The body containing the text "Password" anywhere means the credentials were rejected; anything else means success. A non-2xx answer throws unhandled.',
		},
		{
			name: 'olecard-meals',
			method: 'POST',
			url: 'https://www.stolaf.edu/apps/olecard/checkbalance/authenticate.cfm',
			format: 'html',
			source: ['lib/financials/meals.js:44'],
			request: oleCardLoginForm,
			response: z.string(),
			notes:
				'Meals remaining on the SIS Balances screen and at launch. Intended to select ".accountrow" elements and read the text of each one\'s second following sibling (index 3 is daily, index 4 weekly, fewer than 4 means none). The release calls result.text() without await and parses the pending Promise instead of the body, so it never reads the page and always reports no meal counts; only the request itself (and its non-2xx failure) matters. Throws "not logged in!" without saved credentials.',
		},
	],
}
