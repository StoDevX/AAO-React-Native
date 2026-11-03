import {z} from 'zod'

import type {Release} from '../types'

/** One open/close span of a building schedule. */
const buildingHoursSpan = z.looseObject({
	days: z
		.array(z.string())
		.describe("Two-letter day codes (Mo Tu We Th Fr Sa Su), compared with moment().format('dd')"),
	from: z
		.string()
		.describe("Opening time; parsed strictly with moment.tz(…, 'h:mma'), e.g. '7:30am'"),
	to: z
		.string()
		.describe(
			"Closing time; parsed strictly with moment.tz(…, 'h:mma'); before `from` means past midnight",
		),
})

/** A building as the hours list, row and detail screens read it. */
const building = z.looseObject({
	name: z.string(),
	category: z
		.string()
		.optional()
		.describe("Section header; missing groups the building under 'Other'"),
	abbreviation: z.string().optional(),
	subtitle: z.string().optional(),
	image: z
		.string()
		.optional()
		.describe('Key into the bundled building images; an unknown key shows no header image'),
	schedule: z
		.array(
			z.looseObject({
				title: z
					.string()
					.describe(
						"Shown as the section header (upper-cased on iOS); 'Hours' hides the label in the list",
					),
				notes: z.string().optional().describe('Section footer on the detail screen'),
				isPhysicallyOpen: z
					.boolean()
					.optional()
					.describe('false forces the building to show Closed'),
				closedForChapelTime: z.boolean().optional(),
				hours: z.array(buildingHoursSpan),
			}),
		)
		.optional()
		.nullable()
		.describe('A missing schedule shows "Hours unknown"'),
})

/** A dietary (COR) icon, keyed by its id in a cor-icon map. */
const corIcon = z.looseObject({
	label: z.string().describe('HTML-entity-encoded; decoded and shown as the dietary filter title'),
	image: z.string().optional().describe('Icon image URL'),
	description: z
		.string()
		.optional()
		.describe('HTML; its text is shown as the dietary filter detail'),
})

/** The meal-period shape BonApp sends inside `dayparts`. */
const bonAppDaypart = z.looseObject({
	label: z.string().optional().describe("Meal name, e.g. 'Lunch'; defaults to ''"),
	starttime: z
		.string()
		.optional()
		.describe("Military time parsed strictly as 'H:mm'; defaults to '0:00'"),
	endtime: z
		.string()
		.optional()
		.describe("Military time parsed strictly as 'H:mm'; defaults to '23:59'"),
	stations: z
		.array(
			z.looseObject({
				label: z.string().describe('Station name; title-cased and shown as a section header'),
				note: z.string().optional().describe('Shown as the section subtitle'),
				items: z.array(z.string()).describe('Keys into the response `items` map'),
			}),
		)
		.describe('Not read for The Cage (262), whose stations are rebuilt from items'),
})

/** One item of a WordPress REST API v2 posts response, as the News tab reads it. */
const wpJsonPost = z.looseObject({
	author: z.number().optional().describe('Matched against _embedded.author[].id'),
	featured_media: z
		.number()
		.optional()
		.describe('Matched against _embedded["wp:featuredmedia"][].id'),
	link: z.string().describe('Story base URL and the URL shared from the story'),
	title: z.looseObject({
		rendered: z.string().describe('HTML-entity-encoded; decoded and shown as the row title'),
	}),
	excerpt: z.looseObject({
		rendered: z.string().describe('HTML; its trimmed text is shown as the row preview'),
	}),
	content: z.looseObject({
		rendered: z.string().describe('HTML body, interpolated into the story page'),
	}),
	_embedded: z
		.looseObject({
			author: z
				.array(
					z.looseObject({
						id: z.number(),
						name: z.string().optional(),
					}),
				)
				.optional(),
			'wp:featuredmedia': z
				.array(
					z.looseObject({
						id: z.number(),
						media_type: z.string().describe("Only 'image' is used"),
						source_url: z.string().optional().describe('Used when there is no medium_large size'),
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
								'Read without a guard on the media item that matches featured_media and is an image',
							),
					}),
				)
				.optional(),
		})
		.optional()
		.describe('Present because the request asks for _embed=true'),
})

/** A Google Calendar event time: the code reads `date || dateTime`. */
const googleCalendarTime = z
	.looseObject({
		date: z.string().optional().describe('YYYY-MM-DD for all-day events; parsed with moment()'),
		dateTime: z.string().optional().describe('RFC 3339 timestamp; parsed with moment()'),
	})
	.describe('At least one of date or dateTime must be present')

/** The OleCard login form the release posts. */
const oleCardLoginForm = z
	.looseObject({
		username: z.string(),
		password: z.string(),
	})
	.describe('multipart/form-data (React Native FormData)')

/** The final 2.2 build, tagged v2.2.4. */
export const release: Release = {
	tag: 'v2.2.4',
	version: '2.2.4',
	contracts: [
		{
			name: 'building-hours',
			method: 'GET',
			url: 'https://stodevx.github.io/AAO-React-Native/building-hours.json',
			format: 'json',
			source: ['source/views/building-hours/index.js:69'],
			response: z.looseObject({
				data: z.array(building).describe('Bundled from data/building-hours/*.yaml'),
			}),
			notes:
				'On any failure the release falls back to its bundled copy of docs/building-hours.json (the same file), so the screen never shows an error. Development builds always use the bundled copy. breakSchedule is not read.',
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
								label: z.string().describe('Shown as the row title'),
								station: z.string().describe('Matched against a stationMenus label'),
								description: z.string().optional(),
								special: z.boolean().optional().describe('Shows a star; feeds the specials filter'),
								cor_icon: z
									.union([z.record(z.string(), z.string()), z.array(z.string())])
									.optional()
									.describe(
										'Keys pick from corIcons; values are compared with dietary filter titles',
									),
							}),
						)
						.optional(),
					stationMenus: z
						.array(
							z.looseObject({
								label: z.string(),
								note: z.string().optional().describe('Shown as the section subtitle'),
							}),
						)
						.optional(),
					corIcons: z.record(z.string(), corIcon).optional(),
				}),
			}),
			notes:
				'The Pause tab of Menus. Bundled from data/pause-menu.yaml. A failed request (or a missing `data`) falls back to the bundled docs/pause-menu.json. Development builds always use the bundled copy.',
		},
		{
			name: 'faqs',
			method: 'GET',
			url: 'https://stodevx.github.io/AAO-React-Native/faqs.json',
			format: 'json',
			source: ['source/views/faqs/index.js:34'],
			response: z.looseObject({
				text: z.string().describe('HTML rendered from data/faqs.md, shown in a WebView'),
			}),
			notes:
				'On failure the release keeps its bundled docs/faqs.json. An empty text shows a loading spinner forever.',
		},
		{
			name: 'bonapp-menus',
			method: 'GET',
			url: 'http://legacy.cafebonappetit.com/api/2/menus?cafe={cafeId}',
			params: {
				cafeId: ['261', '262', '35', '36', '458', '34'],
			},
			format: 'json',
			source: ['source/views/menus/menu-bonapp.js:76', 'source/views/menus/menu-bonapp.js:33'],
			response: z.looseObject({
				days: z
					.array(
						z.looseObject({
							cafes: z
								.record(
									z.string(),
									z.looseObject({
										dayparts: z
											.array(z.array(bonAppDaypart))
											.min(1)
											.describe(
												'dayparts[0] is read without a guard; an empty dayparts[0] makes one all-day "Menu" from the items',
											),
									}),
								)
								.describe('days[0].cafes[cafeId] is read without a guard'),
						}),
					)
					.min(1),
				items: z.record(
					z.string(),
					z.looseObject({
						id: z
							.string()
							.describe('Must equal the item’s key; The Cage groups items by station using it'),
						label: z.string().describe('Whitespace-collapsed, trailing (…) removed, title-cased'),
						station: z
							.string()
							.describe("Station name, often '<strong>@Name</strong>'; the tag is stripped"),
						description: z.string().optional().describe('HTML; its text is shown under the label'),
						special: z.boolean().optional().describe('Shows a star; feeds the specials filter'),
						cor_icon: z
							.union([z.record(z.string(), z.string()), z.array(z.string())])
							.describe(
								'Map of cor icon id to label (BonApp sends [] when empty). Keys pick icons from cor_icons; values are compared with the dietary filter titles. Missing crashes when a dietary filter is on',
							),
					}),
				),
				cor_icons: z.record(z.string(), corIcon).optional(),
			}),
			notes:
				'Requested together with bonapp-cafes via Promise.all; if either fails the tab shows "Error: <message>". No bundled fallback. Cafe ids: Stav Hall 261, The Cage 262 (ignoreProvidedMenus: stations rebuilt from items[].station), and the Carleton tabs Burton 35, LDC 36, Weitz Center 458, Sayles Hill 34. Plain http.',
		},
		{
			name: 'bonapp-cafes',
			method: 'GET',
			url: 'http://legacy.cafebonappetit.com/api/2/cafes?cafe={cafeId}',
			params: {
				cafeId: ['261', '262', '35', '36', '458', '34'],
			},
			format: 'json',
			source: ['source/views/menus/menu-bonapp.js:77', 'source/views/menus/menu-bonapp.js:33'],
			response: z.looseObject({
				cafes: z
					.record(
						z.string(),
						z.looseObject({
							days: z.array(
								z.looseObject({
									date: z
										.string()
										.describe("YYYY-MM-DD, compared with today's date in America/Winnipeg"),
									status: z
										.string()
										.optional()
										.describe("'closed' shows the message instead of the menu"),
									message: z
										.string()
										.optional()
										.describe("Shown when status is 'closed'; defaults to 'Closed today'"),
								}),
							),
						}),
					)
					.describe('A missing cafes[cafeId] shows "BonApp did not return a menu for that café"'),
			}),
			notes:
				'Used only to decide whether to show a closed message. With no day matching today the tab shows "Closed today". Fails together with bonapp-menus. Plain http.',
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
			source: ['source/views/calendar/calendar-google.js:75', 'source/views/calendar/index.js:21'],
			response: z.looseObject({
				error: z
					.looseObject({
						message: z.string().optional(),
					})
					.optional()
					.describe('When present it is reported and set as the error'),
				items: z
					.array(
						z.looseObject({
							summary: z.string().optional().describe('HTML; its text is shown as the event title'),
							location: z.string().optional(),
							start: googleCalendarTime,
							end: googleCalendarTime,
						}),
					)
					.describe('Read without a guard after a 200 response; missing throws outside the try'),
			}),
			notes:
				"Tabs St. Olaf, Oleville and Northfield. The St. Olaf and Northfield ids are written pre-encoded (%40), the Oleville id with a literal @; none is re-encoded. timeMin is new Date().toISOString() (qs-encoded); key is GOOGLE_CALENDAR_API_KEY from the build's .env.js. A non-2xx or network error leaves an empty event list; there is no bundled fallback.",
		},
		{
			name: 'news-wp-json',
			method: 'GET',
			url: '{url}?per_page=10&_embed=true',
			params: {
				url: [
					'https://wp.stolaf.edu/wp-json/wp/v2/posts',
					'http://oleville.com/wp-json/wp/v2/posts/',
					'https://pages.stolaf.edu/ksto/wp-json/wp/v2/posts/',
				],
			},
			format: 'json',
			source: ['source/views/news/fetch-feed.js:33', 'source/views/news/index.js:28'],
			response: z.array(wpJsonPost),
			notes:
				'News tabs St. Olaf, Oleville and KSTO. Only Oleville shows the featured image inside the story; every tab shows it as the row thumbnail. A JSON parse error starting "Unexpected token <" shows a message about the St. Olaf website defense; any other failure shows "Error: <message>". No bundled fallback.',
		},
		{
			name: 'news-rss',
			method: 'GET',
			url: '{url}?',
			params: {
				url: ['http://manitoumessenger.com/feed/', 'http://oleville.com/politicole/feed/'],
			},
			format: 'xml',
			source: [
				'source/views/news/fetch-feed.js:24',
				'source/views/news/fetch-feed.js:18',
				'source/views/news/index.js:59',
			],
			response: z
				.string()
				.describe(
					'RSS 2.0, parsed with xml2js: rss > channel[0] > item[] (required); per item title[0] (required), and optionally link[0], description[0], content:encoded[0], dc:creator, category',
				),
			notes:
				'News tabs The Mess and PoliticOle. No query is passed, so the URL ends in a bare `?`. content:encoded (else description) is the story body; description (else the first 250 characters of the body) becomes the preview text. A failure shows "Error: <message>". No bundled fallback.',
		},
		{
			name: 'presence-organizations',
			method: 'GET',
			url: 'https://api.presence.io/stolaf/v1/organizations',
			format: 'json',
			source: ['source/views/student-orgs/list.js:82'],
			response: z.array(
				z.looseObject({
					name: z
						.string()
						.describe("Shown and sorted on; a leading 'St. Olaf' or 'The' is ignored for sorting"),
					categories: z.array(z.string()).describe('Joined with ", " and shown under the name'),
					uri: z.string().describe('Appended to the URL for presence-organization'),
					newOrg: z.boolean().optional().describe('Lists the org again in a "New" section'),
				}),
			),
			notes: 'A failure shows "No organizations found." No bundled fallback.',
		},
		{
			name: 'presence-organization',
			method: 'GET',
			url: 'https://api.presence.io/stolaf/v1/organizations/{uri}',
			format: 'json',
			source: ['source/views/student-orgs/detail-wrapper.js:35'],
			response: z.looseObject({
				contactName: z
					.string()
					.optional()
					.describe('Trimmed; a null value throws (defaults cover only undefined)'),
				description: z.string().optional().describe('HTML; trimmed and reduced to its text'),
				regularMeetingTime: z
					.string()
					.optional()
					.describe('Trimmed; the meetings section needs both time and location'),
				regularMeetingLocation: z.string().optional().describe('Trimmed'),
			}),
			notes:
				'uri comes from presence-organizations. Name and categories on the detail screen come from the list response, not this one. A failure shows "No information found."',
		},
		{
			name: 'olecard-login',
			method: 'POST',
			url: 'https://www.stolaf.edu/apps/olecard/checkbalance/authenticate.cfm',
			format: 'html',
			source: ['source/lib/login.js:48'],
			request: oleCardLoginForm,
			response: z.string(),
			notes:
				'Validates the St. Olaf username and password from Settings (and again at every launch with the saved Keychain credentials). The only check: if the page text contains "Password" the credentials are invalid; anything else counts as a successful login and saves them. A network error rejects unhandled.',
		},
		{
			name: 'olecard-balances',
			method: 'POST',
			url: 'https://www.stolaf.edu/apps/olecard/checkbalance/authenticate.cfm',
			format: 'html',
			source: ['source/lib/financials/balances.js:63'],
			request: oleCardLoginForm,
			response: z.string(),
			notes:
				"Made at launch (when the cache is expired or empty and the device is online), after a successful login, and on refresh of the balances screen, with the Keychain credentials. Scrape (htmlparser2 + css-select): every `.accountrow` element's parent; its text with whitespace collapsed is split on spaces, the last word is the amount and the rest the name. Names are matched by /sto flex/i → flex, /ole/i → ole, /print/i → print, /meals.*day/i → daily, /meals.*week/i → weekly. flex, ole and print have `$` removed and `.` dropped, then parseInt gives cents (NaN becomes null); daily and weekly are kept as strings. Missing rows become null. A network error rejects unhandled and the last cached balances stay.",
		},
		{
			name: 'sis-student-number',
			method: 'GET',
			url: 'https://www.stolaf.edu/sis/st-grades.cfm',
			format: 'html',
			source: ['source/lib/courses/load-student-number.js:49'],
			response: z.string(),
			notes:
				"Sent with the session cookie left by the SIS login WebView (https://www.stolaf.edu/sis/login.cfm). Made at launch when online and the cached number is expired or missing, and after a WebView login. A final response URL starting with https://www.stolaf.edu/sis/landing-page.cfm means signed out. Scrape: every `[name=stnum]` element's value attribute, via Number(); the first is used, none is an error. The Courses screen that shows the result is not reachable in this release, but the request still runs.",
		},
		{
			name: 'sis-courses',
			method: 'POST',
			url: 'https://www.stolaf.edu/sis/st-grades.cfm',
			format: 'html',
			source: ['source/lib/courses/load-courses-from-unofficial-transcript.js:49'],
			request: z
				.looseObject({
					stnum: z.string().describe('Student number from sis-student-number'),
					searchyearterm: z.literal('0').describe('All terms'),
				})
				.describe('multipart/form-data (React Native FormData)'),
			response: z.string(),
			notes:
				"Follows sis-student-number, with the SIS WebView session cookie; results are cached. A final URL starting with https://www.stolaf.edu/sis/landing-page.cfm means signed out. Scrape: `td.sis-termheader, tr.sis-line1, tr.sis-line2` in document order; a sis-termheader cell's text starts a term, and each following row's tag children are read positionally as deptnum, name, instructors, credits (Number), grade. deptnum is matched with /(([A-Z]+)(?=\\/)(?:\\/)([A-Z]+)|[A-Z]+) *([0-9]{3,}?) *([A-Z]?)/i. A course row before any term header throws. A network error rejects unhandled.",
		},
	],
}
