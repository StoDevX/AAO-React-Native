import {z} from 'zod'

import type {Release} from '../types'

/** One opening span in a building's schedule. */
const buildingHoursSpan = z.looseObject({
	days: z
		.array(z.string())
		.describe(
			"Two-letter day names: 'Mo' 'Tu' 'We' 'Th' 'Fr' 'Sa' 'Su'; parsed with moment(day, 'dd')",
		),
	from: z
		.string()
		.describe(
			"Opening time, parsed strictly with moment.tz(from, 'h:mma', true, 'America/Winnipeg')",
		),
	to: z.string().describe("Closing time, 'h:mma'; a time before `from` is taken as the next day"),
})

/** One named schedule of a building, such as `Hours` or `Kitchen`. */
const buildingSchedule = z.looseObject({
	title: z
		.string()
		.describe(
			"Shown as the section header (upper-cased on iOS); 'Hours' hides the label in the list row",
		),
	notes: z.string().optional().describe('Shown as the section footer in the detail view'),
	isPhysicallyOpen: z
		.boolean()
		.optional()
		.describe('Only `false` matters: it marks the schedule closed'),
	closedForChapelTime: z
		.boolean()
		.optional()
		.describe("When true the schedule shows closed during the bundled chapel schedule's times"),
	hours: z.array(buildingHoursSpan),
})

/** One building in building-hours.json. */
const building = z.looseObject({
	name: z.string(),
	category: z
		.string()
		.optional()
		.describe("Section heading; missing groups the building under 'Other'"),
	abbreviation: z.string().optional(),
	subtitle: z.string().optional(),
	image: z
		.string()
		.optional()
		.describe('A key into the bundled building images; missing shows a transparent pixel'),
	schedule: z
		.array(buildingSchedule)
		.optional()
		.describe("Missing shows 'Hours unknown' / 'Closed'"),
})

/** The `cor_icon` of a menu item: a map of icon id to icon label, or an empty array when the item has none. */
const itemCorIcons = z
	.union([z.record(z.string(), z.string()), z.array(z.string())])
	.describe(
		"Keys pick icons out of the menu's cor_icons for the row; values are matched against the icons' labels by the Dietary Restrictions filter, which crashes on a missing cor_icon",
	)

/** The master list of dietary icons, keyed by icon id. */
const corIconMap = z.record(
	z.string(),
	z.looseObject({
		label: z.string().describe('HTML-entity-encoded; decoded and shown as the filter option'),
		image: z.string().optional().describe('Icon image URL, rendered in the row and filter'),
		description: z
			.string()
			.optional()
			.describe('HTML; its text is shown as the filter option detail'),
	}),
)

/** One BonApp menu item, in `items` of the menus response. */
const bonAppItem = z.looseObject({
	id: z
		.string()
		.describe(
			'Item id; used to group items into stations when the release builds its own stations (the Cage, or a day with no dayparts)',
		),
	label: z
		.string()
		.describe(
			'Whitespace collapsed, trailing parenthesised tags removed, title-cased, entity-decoded',
		),
	station: z
		.string()
		.describe(
			"HTML like '<strong>@grill</strong>'; the tag is stripped, title-cased and entity-decoded",
		),
	description: z.string().optional().describe('HTML; its trimmed text is shown under the label'),
	special: z
		.boolean()
		.optional()
		.describe('Truthy marks the item with a star and feeds the Only Show Specials filter'),
	cor_icon: itemCorIcons,
})

/** One BonApp station in a daypart. */
const bonAppStation = z.looseObject({
	label: z.string().describe('Title-cased; matched against the item station names'),
	note: z.string().optional().describe('Shown as the section header subtitle'),
	items: z.array(z.string()).describe('Item ids, looked up in `items`; unknown ids are skipped'),
})

/** One BonApp daypart (meal). */
const bonAppDaypart = z.looseObject({
	label: z.string().optional().describe("Meal name; defaults to ''"),
	starttime: z
		.string()
		.optional()
		.describe("'H:mm', parsed strictly with moment.tz; defaults to '0:00'"),
	endtime: z
		.string()
		.optional()
		.describe("'H:mm', parsed strictly with moment.tz; defaults to '23:59'"),
	stations: z
		.array(bonAppStation)
		.describe('Read for every cafe except the Cage (262), which ignores the provided stations'),
})

/** A Google Calendar event time: the code reads `date || dateTime`. */
const googleCalendarTime = z
	.looseObject({
		date: z.string().optional().describe('YYYY-MM-DD for all-day events; parsed with moment()'),
		dateTime: z.string().optional().describe('RFC 3339 timestamp; parsed with moment()'),
	})
	.describe('At least one of date or dateTime must be present')

/** One WordPress REST API v2 post with `_embed`, as the news tabs read it. */
const wpPost = z.looseObject({
	title: z.looseObject({
		rendered: z
			.string()
			.describe('HTML-entity-encoded; decoded and shown as the row title and article heading'),
	}),
	content: z.looseObject({
		rendered: z
			.string()
			.describe("HTML, shown in the article WebView; posts containing '<form' are hidden"),
	}),
	excerpt: z.looseObject({
		rendered: z
			.string()
			.describe(
				'HTML; its trimmed text is the row preview, and posts whose excerpt is empty are hidden',
			),
	}),
	link: z.string().describe('Shared from the row and used as the article WebView baseUrl'),
	author: z.number().optional().describe('Matched against _embedded.author[].id'),
	featured_media: z
		.number()
		.optional()
		.describe('Matched against _embedded["wp:featuredmedia"][].id'),
	_embedded: z
		.looseObject({
			author: z
				.array(
					z.looseObject({
						id: z.number(),
						name: z
							.string()
							.describe("Shown as the author; 'Unknown Author' when no entry matches"),
					}),
				)
				.optional(),
			'wp:featuredmedia': z
				.array(
					z.looseObject({
						id: z.number(),
						media_type: z.string().describe("Only 'image' is used"),
						source_url: z.string().optional().describe('Used when sizes.medium_large is missing'),
						media_details: z
							.looseObject({
								sizes: z.looseObject({
									medium_large: z
										.looseObject({
											source_url: z.string(),
										})
										.optional(),
								}),
							})
							.describe(
								'Read without a guard on the entry matching featured_media with media_type image',
							),
					}),
				)
				.optional(),
		})
		.optional(),
})

/** One student organization from the orgs list. */
const studentOrg = z.looseObject({
	name: z
		.string()
		.describe(
			"Trimmed; a leading 'St. Olaf', 'St Olaf College' or 'The' is ignored for sorting and grouping",
		),
	category: z.string().describe('Trimmed; shown in the row and searched'),
	description: z.string().describe('HTML; its text is shown and searched'),
	meetings: z.string().describe("Trimmed; '' hides the section"),
	website: z
		.string()
		.describe("Trimmed; 'http://' is prefixed when it has no scheme; '' hides the row"),
	lastUpdated: z.string().describe("Parsed with moment(lastUpdated, 'MMMM, DD YYYY HH:mm:ss')"),
	contacts: z.array(
		z.looseObject({
			title: z.string(),
			firstName: z.string(),
			lastName: z.string(),
			email: z.string().describe('Opened as a mailto: link'),
		}),
	),
	advisors: z.array(
		z.looseObject({
			name: z.string().describe('Trimmed; advisors with an empty name are dropped'),
			email: z.string().describe('Opened as a mailto: link'),
		}),
	),
})

/** One job posting from the student work list. */
const studentJob = z.looseObject({
	type: z
		.string()
		.describe(
			"Group heading; 'On-campus Work Study', 'Off-campus Community Service Work Study', 'On-campus Summer Employment' and 'Off-campus Summer Employment' sort first, others after",
		),
	title: z.string().describe('HTML; its text is shown'),
	office: z.string().describe('HTML; its text is shown'),
	hoursPerWeek: z.string().describe("Trimmed; 'Full-time' drops the ' hrs/week' suffix"),
	timeOfHours: z
		.union([z.string(), z.number()])
		.optional()
		.describe('The hours section shows only when this and hoursPerWeek are truthy'),
	lastModified: z.string().describe("Sort key; parsed with moment(lastModified, 'YYYY/MM/DD')"),
	description: z.string().describe('HTML; tags removed, links extracted'),
	comments: z.string().describe('HTML; tags removed, links extracted'),
	skills: z.string().describe('HTML; tags removed, links extracted'),
	contactEmail: z.string(),
	contactFirstName: z.string(),
	contactLastName: z.string(),
})

/** The final 2.3 build, tagged v2.3.0-final. */
export const release: Release = {
	tag: 'v2.3.0-final',
	version: '2.3.0-beta.7',
	contracts: [
		{
			name: 'building-hours',
			method: 'GET',
			url: 'https://stodevx.github.io/AAO-React-Native/building-hours.json',
			format: 'json',
			source: ['source/views/building-hours/index.js:69'],
			response: z.looseObject({
				data: z.array(building),
			}),
			notes:
				'GitHub Pages copy of data/building-hours/*.yaml, bundled into {data: [...]} by scripts/bundle-data.js. The URL is written with the mixed-case path /AAO-React-Native/. On failure the release falls back to its bundled copy (docs/building-hours.json); development builds always use the bundled copy. The chapel schedule it compares against is bundled only (docs/chapel.json), never fetched.',
		},
		{
			name: 'faqs',
			method: 'GET',
			url: 'https://stodevx.github.io/AAO-React-Native/faqs.json',
			format: 'json',
			source: ['source/views/faqs/index.js:34'],
			response: z.looseObject({
				text: z
					.string()
					.describe(
						'HTML rendered from data/faqs.md; shown in a WebView. Missing leaves the screen on its loading spinner',
					),
			}),
			notes:
				'Mixed-case path /AAO-React-Native/. On failure the release shows its bundled copy (docs/faqs.json); development builds always use the bundled copy.',
		},
		{
			name: 'pause-menu',
			method: 'GET',
			url: 'https://stodevx.github.io/AAO-React-Native/pause-menu.json',
			format: 'json',
			source: ['source/views/menus/menu-github.js:60'],
			response: z.looseObject({
				data: z.looseObject({
					foodItems: z
						.array(
							z.looseObject({
								label: z.string().describe('Shown as the item title'),
								station: z
									.string()
									.describe('Matched against a stationMenus label to place the item'),
								description: z.string().optional(),
								special: z.boolean().optional(),
								cor_icon: itemCorIcons
									.optional()
									.describe(
										"Defaults to {}; the Dietary Restrictions filter matches its values against corIcons' labels",
									),
							}),
						)
						.optional(),
					stationMenus: z
						.array(
							z.looseObject({
								label: z.string(),
								note: z.string().optional().describe('Shown as the section header subtitle'),
							}),
						)
						.optional(),
					corIcons: corIconMap.optional(),
				}),
			}),
			notes:
				"The Pause tab's menu: GitHub Pages copy of data/pause-menu.yaml. Mixed-case path /AAO-React-Native/. On failure (including a missing `data`) the release uses its bundled copy (docs/pause-menu.json); development builds always use the bundled copy. Each missing list defaults to empty. Item ids are assigned from array position.",
		},
		{
			name: 'bonapp-menus',
			method: 'GET',
			url: 'http://legacy.cafebonappetit.com/api/2/menus?cafe={cafeId}',
			params: {
				cafeId: ['261', '262', '35', '36', '458', '34'],
			},
			format: 'json',
			source: [
				'source/views/menus/menu-bonapp.js:76',
				'source/views/menus/menu-bonapp.js:33',
				'source/views/menus/index.js:29',
				'source/views/menus/index.js:47',
				'source/views/menus/carleton-list.js:18',
			],
			response: z.looseObject({
				days: z
					.array(
						z.looseObject({
							cafes: z.record(
								z.string(),
								z.looseObject({
									dayparts: z
										.array(z.array(bonAppDaypart))
										.min(1)
										.describe(
											'A one-element array of arrays; dayparts[0] is read without a guard, and an empty dayparts[0] makes the release show one all-day Menu built from the items',
										),
								}),
							),
						}),
					)
					.min(1)
					.describe('Only days[0] is read, and days[0].cafes[cafeId] must exist'),
				items: z.record(z.string(), bonAppItem).describe('Every item keyed by its id'),
				cor_icons: corIconMap.optional(),
			}),
			notes:
				'Plain http. Cafe ids: 261 Stav Hall, 262 The Cage (ignores the provided stations and groups items by `station` instead), and the Carleton picker\'s 35 Burton, 36 LDC, 458 Weitz Center, 34 Sayles Hill. Fetched together with bonapp-cafes through Promise.all; if either fails the tab shows "Error: <message>". There is no fallback data.',
		},
		{
			name: 'bonapp-cafes',
			method: 'GET',
			url: 'http://legacy.cafebonappetit.com/api/2/cafes?cafe={cafeId}',
			params: {
				cafeId: ['261', '262', '35', '36', '458', '34'],
			},
			format: 'json',
			source: [
				'source/views/menus/menu-bonapp.js:77',
				'source/views/menus/menu-bonapp.js:33',
				'source/views/menus/index.js:29',
				'source/views/menus/index.js:47',
				'source/views/menus/carleton-list.js:18',
			],
			response: z.looseObject({
				cafes: z
					.record(
						z.string(),
						z.looseObject({
							days: z.array(
								z.looseObject({
									date: z
										.string()
										.describe("YYYY-MM-DD; compared with today's date in America/Winnipeg"),
									status: z
										.string()
										.optional()
										.describe(
											"'closed' shows the message instead of the menu; other values (e.g. 'open') show the menu",
										),
									message: z
										.union([z.string(), z.literal(false)])
										.optional()
										.describe("Shown when status is 'closed'; falsy shows 'Closed today'"),
								}),
							),
						}),
					)
					.describe(
						"cafes[cafeId] missing shows 'BonApp did not return a menu for that café'; no entry for today shows 'Closed today'",
					),
			}),
			notes:
				'Plain http. Requested alongside bonapp-menus for the same cafe ids; read only to find today\'s open/closed status and special message. Failure shows "Error: <message>".',
		},
		{
			name: 'news-wp-json',
			method: 'GET',
			url: '{feedUrl}?per_page=10&_embed=true',
			params: {
				feedUrl: [
					'https://wp.stolaf.edu/wp-json/wp/v2/posts',
					'http://oleville.com/wp-json/wp/v2/posts/',
					'https://pages.stolaf.edu/ksto/wp-json/wp/v2/posts/',
				],
			},
			format: 'json',
			source: [
				'source/views/news/fetch-feed.js:33',
				'source/views/news/news-container.js:45',
				'source/views/news/index.js:28',
				'source/views/news/index.js:43',
				'source/views/news/index.js:87',
			],
			response: z.array(wpPost),
			notes:
				"The St. Olaf, Oleville and KSTO news tabs. The Oleville and KSTO URLs end in '/posts/' before the query; Oleville is plain http. Only the Oleville tab embeds the featured image in the article page; all tabs show it in the row. A response that is not JSON and starts with '<' shows a message blaming the St. Olaf website's defence mechanism; any other failure shows \"Error: <message>\". No fallback data.",
		},
		{
			name: 'news-rss',
			method: 'GET',
			url: '{feedUrl}?',
			params: {
				feedUrl: ['http://manitoumessenger.com/feed/', 'http://oleville.com/politicole/feed/'],
			},
			format: 'xml',
			source: [
				'source/views/news/fetch-feed.js:18',
				'source/views/news/fetch-feed.js:24',
				'source/views/news/news-container.js:43',
				'source/views/news/index.js:59',
				'source/views/news/index.js:73',
			],
			response: z.string().describe('RSS 2.0, parsed with xml2js (every element an array)'),
			notes:
				"The Mess and PoliticOle tabs, both plain http. No query is passed, so the URL ends in a bare '?'. Reads rss > channel[0] > item[] (missing items crash into the error notice); for each item: title[0] (required: `item.title[0]` is read without a guard), and optionally link[0], pubDate[0], dc:creator, category, content:encoded[0], description[0]. The row preview is description, or the first 250 characters of content:encoded; items whose preview text is empty or whose content contains '<form' are hidden. Failure shows \"Error: <message>\"; no fallback data.",
		},
		{
			name: 'google-calendar-events',
			method: 'GET',
			url: 'https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events?maxResults=50&orderBy=startTime&showDeleted=false&singleEvents=true&timeMin={timeMin}&key={key}',
			params: {
				calendarId: [
					'le6tdd9i38vgb7fcmha0hu66u9gjus2e%40import.calendar.google.com',
					'stolaf.edu_fvulqo4larnslel75740vglvko@group.calendar.google.com',
					'thisisnorthfield%40gmail.com',
				],
			},
			format: 'json',
			source: [
				'source/views/calendar/calendar-google.js:75',
				'source/views/calendar/calendar-google.js:43',
				'source/views/calendar/index.js:21',
				'source/views/calendar/index.js:29',
				'source/views/calendar/index.js:37',
			],
			response: z.looseObject({
				error: z
					.looseObject({
						message: z.string().optional(),
					})
					.optional()
					.describe('When present, its message is shown above the list'),
				items: z
					.array(
						z.looseObject({
							start: googleCalendarTime,
							end: googleCalendarTime,
							summary: z.string().optional().describe('HTML; its text is the event title'),
							location: z.string().optional(),
						}),
					)
					.describe('Read without a guard after a successful fetch; missing crashes the view'),
			}),
			notes:
				"The St. Olaf, Oleville and Northfield calendar tabs. Calendar ids are written into the path as given, two with '%40' and one with a raw '@'. timeMin is new Date().toISOString(), URL-encoded by querystring; key is GOOGLE_CALENDAR_API_KEY from the build's .env.js (injected by CI). A failed fetch shows an empty list.",
		},
		{
			name: 'student-orgs',
			method: 'GET',
			url: 'https://www.stolaf.edu/orgs/list/index.cfm?fuseaction=getall&nostructure=1',
			format: 'json',
			source: ['source/views/student-orgs/list.js:91'],
			response: z.array(studentOrg),
			notes: "On failure the view shows 'No organizations found.'; no fallback data.",
		},
		{
			name: 'student-work',
			method: 'GET',
			url: 'https://www.stolaf.edu/apps/stuwork/index.cfm?fuseaction=getall&nostructure=1',
			format: 'json',
			source: ['source/views/sis/student-work/index.js:59'],
			response: z
				.union([z.array(studentJob), z.record(z.string(), studentJob)])
				.describe(
					'Typed as an object but passed to lodash sortBy, which takes the values of either an array or an object',
				),
			notes: 'On failure the list is empty; no fallback data.',
		},
		{
			name: 'olecard-login',
			method: 'POST',
			url: 'https://www.stolaf.edu/apps/olecard/checkbalance/authenticate.cfm',
			format: 'html',
			source: ['source/lib/login.js:48'],
			request: z
				.looseObject({
					username: z.string(),
					password: z.string(),
				})
				.describe('multipart/form-data (FormData)'),
			response: z.string(),
			notes:
				"Validates the St. Olaf credentials, at launch and when signing in under Settings. The page is checked only for the substring 'Password': present means the credentials are wrong. A non-2xx status throws.",
		},
		{
			name: 'olecard-balances',
			method: 'POST',
			url: 'https://www.stolaf.edu/apps/olecard/checkbalance/authenticate.cfm',
			format: 'html',
			source: ['source/lib/financials/balances.js:63'],
			request: z
				.looseObject({
					username: z.string(),
					password: z.string(),
				})
				.describe('multipart/form-data (FormData)'),
			response: z.string(),
			notes:
				"Scrapes balances with htmlparser2 + css-select: every '.accountrow' element's parent row is flattened to text, split on spaces, the last chunk taken as the amount and the rest as the name. Names matching /sto flex/i, /ole/i, /print/i, /meals.*day/i, /meals.*week/i fill flex, ole, print (dollar amounts, '$' and '.' removed and parsed as an integer of cents), daily and weekly (kept as text). Rows that match nothing are ignored and missing values become null. Requested at launch when online and the cache has expired, after a successful login, and on pull-to-refresh in Balances; skipped without saved credentials. Failure leaves the cached values.",
		},
		{
			name: 'sis-student-number',
			method: 'GET',
			url: 'https://www.stolaf.edu/sis/st-grades.cfm',
			format: 'html',
			source: ['source/lib/courses/load-student-number.js:49'],
			response: z.string(),
			notes:
				"Relies on the SIS session cookie from the SIS login WebView (https://www.stolaf.edu/sis/login.cfm). A final response URL starting with https://www.stolaf.edu/sis/landing-page.cfm is taken as an authentication error. Otherwise reads the `value` attribute of every '[name=stnum]' element as a number and uses the first. Run at launch when online and the cache has expired, even though the Courses view is commented out of this release.",
		},
		{
			name: 'sis-unofficial-transcript',
			method: 'POST',
			url: 'https://www.stolaf.edu/sis/st-grades.cfm',
			format: 'html',
			source: ['source/lib/courses/load-courses-from-unofficial-transcript.js:49'],
			request: z
				.looseObject({
					stnum: z.string().describe('The student number from sis-student-number'),
					searchyearterm: z.literal('0'),
				})
				.describe('multipart/form-data (FormData)'),
			response: z.string(),
			notes:
				"Same session cookie and landing-page redirect check as sis-student-number. Selects 'td.sis-termheader, tr.sis-line1, tr.sis-line2' in document order: a termheader's text starts a term; each line row's tag children are read as cells deptnum, name, instructors, credits (Number), grade. A line row before any termheader throws. deptnum is parsed with /(([A-Z]+)(?=\\/)(?:\\/)([A-Z]+)|[A-Z]+) *([0-9]{3,}?) *([A-Z]?)/i.",
		},
	],
}
