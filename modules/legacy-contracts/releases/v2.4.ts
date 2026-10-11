import {z} from 'zod'

import type {Release} from '../types'

/** The two-letter weekday names the release matches against moment().format('dd'). */
const weekday = z.enum(['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'])

/** One `{days, from, to}` span of a building's hours. */
const buildingHoursSpan = z.looseObject({
	days: z
		.array(weekday)
		.describe(
			'Matched against moment().format("dd"); summarized for display with moment(day, "dd")',
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
	title: z.string().describe('Section header on the detail screen; upper-cased on iOS'),
	notes: z.string().optional().describe('Section footer on the detail screen'),
	isPhysicallyOpen: z.boolean().optional().describe('false forces the status to Closed'),
	closedForChapelTime: z
		.boolean()
		.optional()
		.describe('true shows "Chapel" during the chapel schedule bundled with the release'),
	hours: z.array(buildingHoursSpan),
})

/** A building in building-hours.json. */
const building = z.looseObject({
	name: z.string().describe('Row title and list key'),
	category: z.string().optional().describe('Section heading; missing means "Other"'),
	abbreviation: z.string().optional(),
	subtitle: z.string().optional(),
	image: z
		.string()
		.optional()
		.describe(
			'Key into the images bundled with the release, not a URL; an unknown key shows no header image',
		),
	schedule: z
		.array(buildingSchedule)
		.optional()
		.describe('Missing or empty means "Hours unknown" / Closed'),
})

/** A COR (dietary) icon in a BonApp `cor_icons` map or pause-menu.json `corIcons`. */
const corIcon = z.looseObject({
	label: z.string().describe('HTML-entity decoded; the dietary filter option title'),
	image: z.string().optional().describe('Icon URL drawn in each item row and the filter list'),
	description: z.string().optional().describe('HTML; tags stripped for the filter detail text'),
})

/** One station of a BonApp daypart. */
const bonAppStation = z.looseObject({
	label: z
		.string()
		.describe(
			'Title-cased; the station heading, matched against item station names for the specials filter',
		),
	note: z.string().optional().describe('Shown as the station heading subtitle'),
	items: z.array(z.string()).describe('Ids into the response items map; unknown ids are skipped'),
})

/** One daypart (meal) of a BonApp cafe menu. */
const bonAppDaypart = z.looseObject({
	label: z.string().optional().describe('Meal name shown in the toolbar; missing means ""'),
	starttime: z
		.string()
		.optional()
		.describe('Moment format "H:mm", parsed strictly; missing means "0:00"'),
	endtime: z
		.string()
		.optional()
		.describe('Moment format "H:mm", parsed strictly; missing means "23:59"'),
	stations: z
		.array(bonAppStation)
		.describe(
			'Read for every cafe; its contents are replaced by item.station grouping for The Cage (262)',
		),
})

/** One food item in a BonApp `items` map. */
const bonAppItem = z.looseObject({
	label: z
		.string()
		.describe(
			'Whitespace collapsed, trailing "(...)" tags removed, title-cased and entity-decoded',
		),
	station: z
		.string()
		.describe(
			'HTML such as "<strong>@grill</strong>"; the tags are stripped and the name title-cased',
		),
	description: z.string().optional().describe('HTML; its text is shown under the label'),
	special: z
		.boolean()
		.optional()
		.describe('Truthy marks the item with a star and keeps it under "Only Show Specials"'),
	cor_icon: z
		.union([z.record(z.string(), z.string()), z.array(z.string())])
		.describe(
			'COR icon id -> label map (BonApp sends [] when empty); keys pick icons from cor_icons, values are matched by the dietary filter, which throws on a missing value while that filter is on',
		),
})

/** A food item in pause-menu.json. */
const pauseMenuItem = z.looseObject({
	label: z.string(),
	station: z.string().describe('Must equal a stationMenus label for the item to be listed'),
	description: z.string().optional(),
	special: z.boolean().optional(),
	cor_icon: z.record(z.string(), z.string()).optional(),
})

/** A station in pause-menu.json. */
const pauseMenuStation = z.looseObject({
	label: z.string(),
	note: z.string().optional().describe('Shown as the station heading subtitle'),
})

/** A Google Calendar date or date-time. */
const googleEventTime = z
	.looseObject({
		date: z.string().optional().describe('YYYY-MM-DD for all-day events; parsed with moment()'),
		dateTime: z.string().optional().describe('RFC 3339; parsed with moment() when date is absent'),
	})
	.describe('One of date or dateTime must be present')

/** A Google Calendar event. */
const googleEvent = z.looseObject({
	start: googleEventTime,
	end: googleEventTime,
	summary: z.string().optional().describe('HTML stripped for the title; missing means ""'),
	location: z.string().optional(),
	description: z
		.string()
		.optional()
		.describe('HTML stripped; links in it are offered on the detail screen'),
})

/** A WordPress REST API v2 post, as read by fetchWpJson. */
const wpPost = z.looseObject({
	title: z.looseObject({
		rendered: z.string().describe('HTML-entity decoded; story title and list key'),
	}),
	content: z.looseObject({rendered: z.string().describe('HTML rendered in a WebView')}),
	excerpt: z.looseObject({
		rendered: z.string().describe('HTML; tags stripped and entity-decoded for the row detail'),
	}),
	link: z
		.string()
		.optional()
		.describe('WebView base URL and the share link; no link hides sharing'),
	date_gmt: z.string().optional().describe('Copied to the story but never displayed'),
	author: z.number().optional().describe('Matched against _embedded.author[].id'),
	featured_media: z
		.number()
		.optional()
		.describe('Matched against _embedded["wp:featuredmedia"][].id'),
	_embedded: z
		.looseObject({
			author: z
				.array(z.looseObject({id: z.number(), name: z.string()}))
				.optional()
				.describe('Missing means "Unknown Author"'),
			'wp:featuredmedia': z
				.array(
					z.looseObject({
						id: z.number(),
						media_type: z.string().describe('Only "image" is used'),
						source_url: z.string().optional().describe('Used when sizes.medium_large is absent'),
						media_details: z
							.looseObject({
								sizes: z.looseObject({
									medium_large: z.looseObject({source_url: z.string()}).optional(),
								}),
							})
							.describe('Read without a guard once id and media_type match'),
					}),
				)
				.optional(),
		})
		.optional()
		.describe('Present because the query sends _embed=true'),
})

/** One St. Olaf student organization. */
const studentOrg = z.looseObject({
	name: z
		.string()
		.describe(
			'Trimmed; leading "St. Olaf", "St. Olaf College" or "The" ignored for sorting and grouping',
		),
	category: z.string().describe('Row detail; searched; trimmed on the detail screen'),
	description: z.string().describe('HTML; searched, tags stripped on the detail screen'),
	meetings: z.string().describe('Trimmed; empty hides the section'),
	website: z.string().describe('Trimmed; http:// is prefixed when it has no scheme'),
	contacts: z.array(
		z.looseObject({
			title: z.string(),
			firstName: z.string(),
			lastName: z.string(),
			email: z.string().describe('Shown when both names are blank; opened as mailto:'),
		}),
	),
	advisors: z.array(
		z.looseObject({
			name: z.string().describe('Trimmed; blank names are dropped'),
			email: z.string(),
		}),
	),
	lastUpdated: z.string().describe('Parsed with moment format "MMMM, DD YYYY HH:mm:ss"'),
})

/** One St. Olaf student job posting. */
const studentJob = z.looseObject({
	type: z.string().describe('Title-cased; the section heading'),
	office: z.string().describe('HTML stripped'),
	title: z.string().describe('HTML stripped'),
	hoursPerWeek: z.string().describe('Trimmed; "Full-time" suppresses the "hrs/week" suffix'),
	lastModified: z.string().describe('Trimmed; parsed with moment format "YYYY/MM/DD"'),
	description: z.string().describe('HTML stripped with a regex; links in it are offered'),
	comments: z.string().describe('HTML stripped with a regex; links in it are offered'),
	skills: z.string().describe('HTML stripped with a regex; links in it are offered'),
	contactEmail: z
		.string()
		.describe('Trimmed; "@stolaf.edu" is appended when the @ or domain is missing'),
	contactFirstName: z.string(),
	contactLastName: z.string(),
	timeOfHours: z.union([z.string(), z.number()]).optional(),
})

/** One stream in the St. Olaf multimedia collection API. */
const stolafStream = z.looseObject({
	eid: z.string().describe('List key'),
	category: z.string().describe('"athletics" entries are dropped; the rest are title-cased'),
	starttime: z.string().describe('Parsed with moment format "YYYY-MM-DD HH:mm"'),
	status: z.string().describe('Lower-cased; "live" groups under Live, "archived" hides the time'),
	title: z.string().describe('HTML; its text is the row title'),
	subtitle: z.string().optional().describe('HTML; falls back to performer'),
	performer: z.string().optional(),
	thumb: z.string().optional().describe('Image URL'),
	player: z.string().describe('Opened in the browser when the row is tapped'),
})

/** The final 2.4 build, tagged v2.4.2. */
export const release: Release = {
	tag: 'v2.4.2',
	version: '2.4.2',
	contracts: [
		{
			name: 'building-hours',
			method: 'GET',
			url: 'https://stodevx.github.io/AAO-React-Native/building-hours.json',
			format: 'json',
			source: ['source/views/building-hours/stateful-list.js:85'],
			response: z.looseObject({data: z.array(building)}),
			notes:
				'Built from data/building-hours/*.yaml. On failure the release reports the problem and keeps its bundled copy (docs/building-hours.json). The chapel schedule (docs/chapel.json) is bundled only, never fetched.',
		},
		{
			name: 'dictionary',
			method: 'GET',
			url: 'https://stodevx.github.io/AAO-React-Native/dictionary.json',
			format: 'json',
			source: ['source/views/dictionary/list.js:87'],
			response: z.looseObject({
				data: z.array(
					z.looseObject({
						word: z.string().describe('Lower-cased for search; first character is the section'),
						definition: z
							.string()
							.describe('Markdown on the detail screen; lower-cased for search'),
					}),
				),
			}),
			notes:
				'Built from data/dictionary/*.yaml. On failure the release keeps its bundled docs/dictionary.json.',
		},
		{
			name: 'contact-info',
			method: 'GET',
			url: 'https://stodevx.github.io/AAO-React-Native/contact-info.json',
			format: 'json',
			source: ['source/views/contacts/contact-list.js:73'],
			response: z.looseObject({
				data: z.array(
					z.looseObject({
						title: z.string().describe('Row title and list key; .replace() is called on it'),
						category: z.string().describe('Section heading'),
						synopsis: z.string().describe('Row detail'),
						text: z.string().describe('Markdown on the detail screen'),
						buttonText: z.string().describe('Detail button title and the call prompt'),
						buttonLink: z.string().optional().describe('Opened when present'),
						phoneNumber: z.string().optional().describe('Called when buttonLink is absent'),
						image: z
							.string()
							.optional()
							.describe('Key into the images bundled with the release, not a URL'),
					}),
				),
			}),
			notes:
				'Built from data/contact-info/*.yaml. On failure the release keeps its bundled docs/contact-info.json.',
		},
		{
			name: 'transportation',
			method: 'GET',
			url: 'https://stodevx.github.io/AAO-React-Native/transportation.json',
			format: 'json',
			source: ['source/views/transportation/other-modes/list.js:73'],
			response: z.looseObject({
				data: z.array(
					z.looseObject({
						name: z.string().describe('Row title and list key; .replace() is called on it'),
						category: z.string().describe('Section heading'),
						description: z.string().describe('Row detail and Markdown on the detail screen'),
						url: z.string().describe('Opened by the "More Info" button'),
					}),
				),
			}),
			notes:
				'Built from data/transportation/*.yaml. On failure the release keeps its bundled docs/transportation.json.',
		},
		{
			name: 'bus-times',
			method: 'GET',
			url: 'https://stodevx.github.io/AAO-React-Native/bus-times.json',
			format: 'json',
			source: ['source/views/transportation/bus/bus-view.js:48'],
			response: z.looseObject({
				data: z.array(
					z.looseObject({
						line: z
							.string()
							.describe(
								'Looked up by the exact names "Express Bus", "Red Line" and "Blue Line"; a missing line shows a notice',
							),
						schedules: z.array(
							z.looseObject({
								days: z
									.array(z.enum(['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']))
									.describe('The schedule whose days include today is used'),
								stops: z.array(z.string()),
								times: z
									.array(z.array(z.union([z.string(), z.literal(false)])))
									.describe(
										'One row per run, one entry per stop: moment format "h:mma" (strict), or false for no stop',
									),
								coordinates: z
									.array(z.tuple([z.number(), z.number()]))
									.optional()
									.describe(
										'[lat, lng] per stop for the map; anything without a length, including an object keyed by stop name, shows a notice in place of the map',
									),
							}),
						),
					}),
				),
			}),
			notes:
				'Built from data/bus-times/*.yaml. On failure the release keeps its bundled docs/bus-times.json.',
		},
		{
			name: 'webcams',
			method: 'GET',
			url: 'https://stodevx.github.io/AAO-React-Native/webcams.json',
			format: 'json',
			source: ['source/views/streaming/webcams.js:90'],
			response: z.looseObject({
				data: z.array(
					z.looseObject({
						name: z.string().describe('Tile label and key'),
						pageUrl: z.string().describe('Opened in the browser when the tile is tapped'),
						accentColor: z
							.tuple([z.number(), z.number(), z.number()])
							.describe('RGB, destructured into rgba() strings'),
						textColor: z.string().optional().describe('CSS color of the label'),
						thumbnail: z
							.string()
							.optional()
							.describe(
								'Key into the thumbnails bundled with the release; unknown means a blank tile',
							),
						thumbnailUrl: z
							.string()
							.optional()
							.describe('Image URL preferred over thumbnail when present'),
					}),
				),
			}),
			notes:
				'Built from data/webcams/*.yaml. On failure the release keeps its bundled docs/webcams.json.',
		},
		{
			name: 'faqs',
			method: 'GET',
			url: 'https://stodevx.github.io/AAO-React-Native/faqs.json',
			format: 'json',
			source: ['source/views/faqs/index.js:31'],
			response: z.looseObject({
				text: z.string().describe('Markdown, rendered as the whole screen'),
			}),
			notes:
				'Converted from data/faqs.md. On failure the screen shows "There was a problem loading the FAQs" rather than the bundled copy.',
		},
		{
			name: 'pause-menu',
			method: 'GET',
			url: 'https://stodevx.github.io/AAO-React-Native/pause-menu.json',
			format: 'json',
			source: ['source/views/menus/menu-github.js:170'],
			response: z.looseObject({
				data: z.looseObject({
					foodItems: z.array(pauseMenuItem).optional(),
					stationMenus: z.array(pauseMenuStation).optional(),
					corIcons: z.record(z.string(), corIcon).optional(),
				}),
			}),
			notes:
				'Converted from data/pause-menu.yaml. A missing data object throws and the release falls back to its bundled docs/pause-menu.json; missing lists default to empty.',
		},
		{
			name: 'bonapp-menu',
			method: 'GET',
			url: 'http://legacy.cafebonappetit.com/api/2/menus?cafe={cafe}',
			params: {cafe: ['261', '262', '35', '36', '458', '34']},
			format: 'json',
			source: ['source/views/menus/menu-bonapp.js:92'],
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
												'dayparts[0] is read without a guard; an empty dayparts[0] means one all-day "Menu"',
											),
									}),
								)
								.describe('Must contain the requested cafe id; only days[0] is read'),
						}),
					)
					.min(1),
				items: z.record(z.string(), bonAppItem),
				cor_icons: z.record(z.string(), corIcon),
			}),
			notes:
				'Requested together with bonapp-cafe; either failing shows "Error: <message>" with no fallback. 261 Stav Hall, 262 The Cage (stations are rebuilt from item.station), 35 Burton, 36 LDC, 458 Weitz Center, 34 Sayles Hill (Carleton). Plain http.',
		},
		{
			name: 'bonapp-cafe',
			method: 'GET',
			url: 'http://legacy.cafebonappetit.com/api/2/cafes?cafe={cafe}',
			params: {cafe: ['261', '262', '35', '36', '458', '34']},
			format: 'json',
			source: ['source/views/menus/menu-bonapp.js:93'],
			response: z.looseObject({
				cafes: z
					.record(
						z.string(),
						z.looseObject({
							days: z.array(
								z.looseObject({
									date: z.string().describe('YYYY-MM-DD, compared with today in Central time'),
									status: z
										.string()
										.optional()
										.describe('"closed" shows the message instead of the menu'),
									message: z
										.union([z.string(), z.literal(false)])
										.optional()
										.describe('Shown when status is "closed"; falsy means "Closed today"'),
								}),
							),
						}),
					)
					.describe(
						'A missing entry for the cafe shows "BonApp did not return a menu for that café"',
					),
			}),
			notes:
				'Requested together with bonapp-menu; either failing shows an error notice. Plain http.',
		},
		{
			name: 'google-calendar',
			method: 'GET',
			url: 'https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events?maxResults=50&orderBy=startTime&showDeleted=false&singleEvents=true&timeMin={timeMin}&key={key}',
			params: {
				calendarId: [
					'5g91il39n0sv4c2bjdv1jrvcpq4ulm4r@import.calendar.google.com',
					'stolaf.edu_fvulqo4larnslel75740vglvko@group.calendar.google.com',
					'thisisnorthfield@gmail.com',
				],
			},
			format: 'json',
			source: ['source/views/calendar/calendar-google.js:74'],
			response: z.looseObject({
				error: z
					.looseObject({message: z.string()})
					.optional()
					.describe('Shown as the list message'),
				items: z
					.array(googleEvent)
					.describe('Mapped outside the try block, so a missing items array throws'),
			}),
			notes:
				"Tabs: St. Olaf, Oleville, Northfield. calendarId is put in the path unencoded; timeMin is the current ISO time, URL-encoded; key is GOOGLE_CALENDAR_API_KEY from the build's .env.js. A failed request shows the error message over an empty list.",
		},
		{
			name: 'news-wordpress',
			method: 'GET',
			url: '{feed}?per_page=10&_embed=true',
			params: {
				feed: [
					'https://wp.stolaf.edu/wp-json/wp/v2/posts',
					'http://oleville.com/wp-json/wp/v2/posts/',
					'https://pages.stolaf.edu/ksto/wp-json/wp/v2/posts/',
				],
			},
			format: 'json',
			source: ['source/views/news/fetch-feed.js:33', 'source/views/news/news-container.js:51'],
			response: z.array(wpPost),
			notes:
				'Tabs: St. Olaf, Oleville, KSTO. A JSON parse error starting "Unexpected token <" is shown as a St. Olaf WPDefender message; other failures show the error.',
		},
		{
			name: 'news-rss',
			method: 'GET',
			url: '{feed}?',
			params: {feed: ['http://manitoumessenger.com/feed/', 'http://oleville.com/politicole/feed/']},
			format: 'xml',
			source: ['source/views/news/fetch-feed.js:24', 'source/views/news/news-container.js:49'],
			response: z.string().describe('RSS 2.0 parsed with xml2js; rss.channel[0].item[] must exist'),
			notes:
				'Tabs: The Mess, PoliticOle. The URL ends in a bare "?" since no query is passed. Per item: title[0] (required), link[0], description[0], content:encoded[0], dc:creator, category, pubDate[0]; description or content:encoded is the body. A failure shows the error.',
		},
		{
			name: 'news-styles',
			method: 'GET',
			url: 'https://stodevx.github.io/AAO-React-Native/news-styles.css',
			format: 'text',
			source: ['source/views/news/news-item.js:34'],
			response: z.string().describe('CSS'),
			notes:
				'Not fetched by JavaScript: release builds put a <link rel="stylesheet"> to it in the HTML given to the article WebView. Built from data/news-styles.css. On failure the article renders unstyled.',
		},
		{
			name: 'student-orgs',
			method: 'GET',
			url: 'https://www.stolaf.edu/orgs/list/index.cfm?fuseaction=getall&nostructure=1',
			format: 'json',
			source: ['source/views/student-orgs/list.js:100'],
			response: z.array(studentOrg),
			notes: 'On failure the list is empty and an error notice is shown.',
		},
		{
			name: 'student-work',
			method: 'GET',
			url: 'https://www.stolaf.edu/apps/stuwork/index.cfm?fuseaction=getall&nostructure=1',
			format: 'json',
			source: ['source/views/sis/student-work/index.js:59'],
			response: z.array(studentJob),
			notes: 'On failure the screen renders an empty Text (the error flag is boolean true).',
		},
		{
			name: 'stolaf-streams',
			method: 'GET',
			url: 'https://www.stolaf.edu/multimedia/api/collection?class=current&sort=ascending&date_from={date_from}&date_to={date_to}',
			format: 'json',
			source: ['source/views/streaming/streams/list.js:86'],
			response: z.looseObject({results: z.array(stolafStream)}),
			notes:
				'date_from is today and date_to one month later, both YYYY-MM-DD in Central time. On failure the screen shows "Error: <message>".',
		},
		{
			name: 'wifi-report',
			method: 'POST',
			url: 'https://www.stolaf.edu/apps/all-about-olaf/index.cfm?fuseaction=Submit',
			format: 'json',
			source: ['source/views/help/wifi.js:44'],
			request: z
				.looseObject({
					version: z.literal(1),
					position: z
						.looseObject({})
						.describe(
							'navigator.geolocation position ({coords, timestamp}), or {} when unavailable',
						),
					device: z.looseObject({
						id: z.string(),
						brand: z.string(),
						model: z.string(),
						deviceKind: z.string(),
						os: z.string(),
						osVersion: z.string(),
						appVersion: z.string(),
						jsVersion: z.string(),
						ua: z.string(),
						ip: z.string().nullable(),
					}),
				})
				.describe('Sent as a JSON string body with no Content-Type set'),
			response: z.looseObject({
				status: z.string().describe('"success" shows Thanks!; anything else shows Server error'),
			}),
			notes:
				'The body is read as text and JSON.parse is attempted; non-JSON text counts as a server error.',
		},
		{
			name: 'olecard-authenticate',
			method: 'POST',
			url: 'https://www.stolaf.edu/apps/olecard/checkbalance/authenticate.cfm',
			format: 'html',
			source: ['source/lib/login.js:48', 'source/lib/financials/balances.js:63'],
			request: z
				.looseObject({username: z.string(), password: z.string()})
				.describe('multipart/form-data built with FormData'),
			response: z.string(),
			notes:
				'Login (settings, and at launch to validate saved credentials) treats a page containing "Password" as bad credentials and anything else as success. Before fetching balances the same POST is sent only to set the session cookie, and its body is ignored.',
		},
		{
			name: 'olecard-balances',
			method: 'GET',
			url: 'https://www.stolaf.edu/apps/olecard/checkbalance/api.cfm',
			format: 'json',
			source: ['source/lib/financials/balances.js:65'],
			response: z.union([
				z.looseObject({error: z.string().min(1).describe('Shown as the error')}),
				z.looseObject({
					error: z.union([z.string().max(0), z.null(), z.undefined()]).optional(),
					data: z.looseObject({
						accounts: z.array(
							z.looseObject({
								account: z
									.string()
									.describe(
										'Matched against "STO Flex", "STO Ole Dollars" and "STO Student Printing"',
									),
								formatted: z.string().describe('Displayed balance'),
							}),
						),
						meals: z
							.looseObject({
								leftDaily: z.union([z.string(), z.number()]).nullable().optional(),
								leftWeekly: z.union([z.string(), z.number()]).nullable().optional(),
								plan: z.string().nullable().optional(),
							})
							.nullable()
							.optional(),
					}),
				}),
			]),
			notes:
				'Relies on the session cookie from olecard-authenticate. Fetched at launch (when the cache is stale), after login, and on refresh. On failure the cached balances stay; nothing is cached from an error.',
		},
		{
			name: 'sis-student-number',
			method: 'GET',
			url: 'https://www.stolaf.edu/sis/st-grades.cfm',
			format: 'html',
			source: ['source/lib/courses/load-student-number.js:49'],
			response: z.string(),
			notes:
				'Fetched at launch when the cached student number is stale. A response whose final URL starts with https://www.stolaf.edu/sis/landing-page.cfm is an authentication error. Scraped with css-select: every element matching [name=stnum], Number(value attribute); the first is used and none is an error.',
		},
		{
			name: 'sis-unofficial-transcript',
			method: 'POST',
			url: 'https://www.stolaf.edu/sis/st-grades.cfm',
			format: 'html',
			source: ['source/lib/courses/load-courses-from-unofficial-transcript.js:49'],
			request: z
				.looseObject({
					stnum: z.string().describe('Student number from sis-student-number'),
					searchyearterm: z.literal('0'),
				})
				.describe('multipart/form-data built with FormData'),
			response: z.string(),
			notes:
				'Fetched at launch after sis-student-number when cached courses are stale; the release has no screen showing them. A final URL starting with the landing page is an authentication error. Scraped with css-select "td.sis-termheader, tr.sis-line1, tr.sis-line2": a sis-termheader cell starts a term (its text is the term name); each row\'s element children are, in order, deptnum, name, instructors, credits, grade; deptnum is matched with /(([A-Z]+)(?=\\/)(?:\\/)([A-Z]+)|[A-Z]+) *([0-9]{3,}?) *([A-Z]?)/i.',
		},
	],
}
