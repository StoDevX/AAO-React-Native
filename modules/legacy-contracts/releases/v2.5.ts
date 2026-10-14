import {z} from 'zod'

import type {Release} from '../types'

const GH_PAGES = 'https://stodevx.github.io/AAO-React-Native'

/** One open/close span of a building schedule. */
const buildingHoursSpan = z.looseObject({
	days: z
		.array(z.string())
		.describe('Two-letter day codes (Mo Tu We Th Fr Sa Su), matched with `includes`'),
	from: z
		.string()
		.describe("Opening time; parsed strictly with moment.tz(…, 'h:mma', true), e.g. '7:30am'"),
	to: z
		.string()
		.describe(
			"Closing time; parsed strictly with moment.tz(…, 'h:mma', true); before `from` means past midnight",
		),
})

/** A building as the hours list, row and detail screens read it. */
const building = z.looseObject({
	name: z.string().describe('List key, favourites key and title'),
	category: z
		.string()
		.optional()
		.describe("Section header; missing groups the building under 'Other'"),
	abbreviation: z.string().optional(),
	subtitle: z.string().optional(),
	isNotice: z.boolean().optional(),
	noticeMessage: z.string().optional(),
	image: z
		.string()
		.optional()
		.describe('Key into the bundled building images; an unknown key shows no header image'),
	schedule: z
		.array(
			z.looseObject({
				title: z.string().describe('Section header; upper-cased with toUpperCase() on iOS'),
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
		.describe('Read as `info.schedule || []`'),
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

/** A BonApp menu item, keyed by its id in `items`. */
const bonAppItem = z.looseObject({
	id: z
		.string()
		.describe(
			'Grouped into stations by this id when the release builds its own stations (The Cage, cafe 262)',
		),
	label: z.string().describe('Whitespace-collapsed, parenthesised tags stripped, title-cased'),
	station: z
		.string()
		.describe("HTML like '<strong>@grill</strong>'; the tag is stripped and the name title-cased"),
	description: z.string().optional().describe('HTML; its text is shown under the label'),
	special: z
		.union([z.boolean(), z.number(), z.string()])
		.optional()
		.describe('Truthy marks a special (star badge, "Only Show Specials" filter)'),
	cor_icon: z
		.union([z.record(z.string(), z.string()), z.array(z.unknown())])
		.optional()
		.describe(
			'Map of COR icon id to label; its keys pick icons from `cor_icons`; an array means none',
		),
})

/** One meal period inside `dayparts`. */
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
				items: z.array(z.string()).describe('Ids into `items`; unknown ids are skipped'),
			}),
		)
		.describe('Read unless the release builds its own stations (cafe 262, or no dayparts)'),
})

/** A GitHub-hosted Pause menu item, before the release fills in BonApp defaults. */
const pauseMenuItem = z.looseObject({
	label: z.string(),
	station: z.string().describe('Matched against a stationMenus label'),
	description: z.string().optional(),
	special: z.boolean().optional(),
	cor_icon: z.union([z.record(z.string(), z.string()), z.array(z.unknown())]).optional(),
})

/** A Help screen button. Unknown actions render a button that does nothing. */
const helpButtonBase = {
	title: z.string().describe('Button label and React key'),
	enabled: z.boolean().optional().describe('false disables the button'),
}
const recipient = z.union([z.string(), z.array(z.string())])
const helpButton = z.union([
	z.looseObject({
		...helpButtonBase,
		action: z.literal('open-url'),
		params: z.looseObject({url: z.string()}),
	}),
	z.looseObject({
		...helpButtonBase,
		action: z.literal('send-email'),
		params: z.looseObject({
			to: recipient,
			cc: recipient.optional(),
			bcc: recipient.optional(),
			subject: z.string(),
			body: z.string(),
		}),
	}),
	z.looseObject({
		...helpButtonBase,
		action: z.literal('call-phone'),
		params: z.looseObject({number: z.string()}),
	}),
	z.looseObject({
		...helpButtonBase,
		action: z.literal('custom'),
		params: z
			.looseObject({
				url: z
					.string()
					.optional()
					.describe("The wifi tool POSTs its report here when this is the tool's first button"),
			})
			.optional(),
	}),
	z.looseObject({
		...helpButtonBase,
		action: z
			.string()
			.refine((a) => !['open-url', 'send-email', 'call-phone', 'custom'].includes(a))
			.describe('Any other action renders a button that does nothing'),
	}),
])

/** A Help screen tool card. */
const helpTool = z.looseObject({
	key: z.string().describe("React key; 'wifi' selects the custom wifi-report tool"),
	enabled: z.boolean().optional().describe('Anything falsy disables the tool and shows `message`'),
	hidden: z.boolean().optional().describe('true hides the tool'),
	message: z.string().optional().describe('Footer shown while disabled'),
	versionRange: z
		.string()
		.optional()
		.describe("semver range checked against the app's version (2.5.2) with semver.satisfies"),
	title: z.string(),
	body: z.string().describe('Markdown'),
	buttons: z.array(helpButton).describe('Mapped without a guard by the generic tool view'),
})

/** A WordPress REST API post as convertWpJsonItemToStory reads it. */
const wpPost = z.looseObject({
	author: z.number().optional().describe('Matched against `_embedded.author[].id`'),
	featured_media: z
		.number()
		.optional()
		.describe('Matched against `_embedded["wp:featuredmedia"][].id`'),
	_embedded: z
		.looseObject({
			author: z
				.array(z.looseObject({id: z.number().optional(), name: z.string().optional()}))
				.optional(),
			'wp:featuredmedia': z
				.array(
					z.looseObject({
						id: z.number().optional(),
						media_type: z.string().optional().describe("Only 'image' is used"),
						source_url: z.string().optional(),
						media_details: z
							.looseObject({
								sizes: z
									.looseObject({
										medium_large: z.looseObject({source_url: z.string()}).optional(),
									})
									.optional(),
							})
							.describe('Read without a guard on the matching image entry'),
					}),
				)
				.optional(),
		})
		.optional()
		.describe('Present because the request asks for _embed=true'),
	content: z.looseObject({rendered: z.string()}),
	date_gmt: z.string().optional(),
	excerpt: z.looseObject({rendered: z.string().describe('HTML; tags stripped, entities decoded')}),
	link: z
		.string()
		.optional()
		.describe('Opened when the row is tapped; a row without one does nothing'),
	title: z.looseObject({rendered: z.string().describe('Entities decoded; the list key')}),
})

/** A Google Calendar event as convertEvents reads it. */
const googleEventTime = z.looseObject({
	date: z.string().optional().describe("All-day date 'YYYY-MM-DD'; parsed with moment()"),
	dateTime: z
		.string()
		.optional()
		.describe('RFC 3339 timestamp; parsed with moment() when `date` is absent'),
})
const googleEvent = z.looseObject({
	start: googleEventTime,
	end: googleEventTime,
	summary: z.string().optional(),
	description: z.string().optional(),
	location: z.string().optional(),
})

/** The final 2.5 build, tagged v2.5.2. */
export const release: Release = {
	tag: 'v2.5.2',
	version: '2.5.2',
	contracts: [
		{
			name: 'building-hours',
			method: 'GET',
			url: `${GH_PAGES}/building-hours.json`,
			format: 'json',
			source: ['source/views/building-hours/stateful-list.js:112'],
			response: z.looseObject({data: z.array(building)}),
			notes:
				'Built from data/building-hours/*.yaml by scripts/bundle-data.js. On failure the release reports the problem and uses its bundled copy of docs/building-hours.json.',
		},
		{
			name: 'dictionary',
			method: 'GET',
			url: `${GH_PAGES}/dictionary.json`,
			format: 'json',
			source: ['source/views/dictionary/list.js:88'],
			response: z.looseObject({
				data: z.array(
					z.looseObject({
						word: z
							.string()
							.describe('Lower-cased and split for search; first letter groups the list'),
						definition: z.string().describe('Markdown; lower-cased and split for search'),
					}),
				),
			}),
			notes:
				'On failure the release uses its bundled copy. The fetched terms only feed search; the list first shows the bundled terms.',
		},
		{
			name: 'contact-info',
			method: 'GET',
			url: `${GH_PAGES}/contact-info.json`,
			format: 'json',
			source: ['source/views/contacts/contact-list.js:73'],
			response: z.looseObject({
				data: z.array(
					z.looseObject({
						title: z.string().describe('List key and title; spaces stripped for analytics'),
						category: z.string().describe('Section header'),
						synopsis: z.string(),
						text: z.string().describe('Markdown'),
						buttonText: z.string(),
						buttonLink: z.string().optional().describe('Opened in the browser when present'),
						phoneNumber: z.string().optional().describe('Called when there is no buttonLink'),
						image: z.string().optional().describe('Key into the bundled contact images'),
					}),
				),
			}),
			notes: 'On failure the release uses its bundled copy.',
		},
		{
			name: 'transportation',
			method: 'GET',
			url: `${GH_PAGES}/transportation.json`,
			format: 'json',
			source: ['source/views/transportation/other-modes/list.js:73'],
			response: z.looseObject({
				data: z.array(
					z.looseObject({
						name: z.string().describe('List key and title; spaces stripped for analytics'),
						category: z.string().describe('Section header'),
						synopsis: z.string(),
						description: z.string().describe('Markdown'),
						url: z.string().describe('Opened by the "More Info" button'),
					}),
				),
			}),
			notes: 'On failure the release uses its bundled copy.',
		},
		{
			name: 'bus-times',
			method: 'GET',
			url: `${GH_PAGES}/bus-times.json`,
			format: 'json',
			source: ['source/views/transportation/bus/wrapper.js:58'],
			response: z.looseObject({
				data: z.array(
					z.looseObject({
						line: z
							.string()
							.describe("Matched exactly against 'Express Bus', 'Red Line' and 'Blue Line'"),
						colors: z.looseObject({bar: z.string(), dot: z.string()}).describe('CSS colours'),
						schedules: z.array(
							z.looseObject({
								days: z.array(z.string()).describe('Two-letter day codes (Su Mo Tu We Th Fr Sa)'),
								stops: z.array(z.string()),
								coordinates: z
									.record(z.string(), z.tuple([z.number(), z.number()]))
									.describe('Stop name to [lat, lng]; checked with `in`, so the object must exist'),
								times: z
									.array(
										z.array(
											z.union([
												z.string().describe("Parsed strictly with moment.tz(…, 'h:mma', true)"),
												z.literal(false).describe('The bus skips this stop'),
											]),
										),
									)
									.describe('One row per trip, one column per stop'),
							}),
						),
					}),
				),
			}),
			notes:
				'On failure the release uses its bundled copy. A line missing from the data shows a "line was not found" notice.',
		},
		{
			name: 'faqs',
			method: 'GET',
			url: `${GH_PAGES}/faqs.json`,
			format: 'json',
			source: ['source/views/faqs/index.js:47'],
			response: z.looseObject({text: z.string().describe('Markdown, from data/faqs.md')}),
			notes:
				"On failure the screen shows 'There was a problem loading the FAQs'; the bundled copy is shown only while loading.",
		},
		{
			name: 'webcams',
			method: 'GET',
			url: `${GH_PAGES}/webcams.json`,
			format: 'json',
			source: ['source/views/streaming/webcams/list.js:70'],
			response: z.looseObject({
				data: z.array(
					z.looseObject({
						name: z.string().describe('Title and React key'),
						pageUrl: z.string().describe('Opened in the browser on tap'),
						accentColor: z
							.tuple([z.number(), z.number(), z.number()])
							.describe('RGB components; destructured without a guard'),
						textColor: z.string().describe('CSS colour of the title'),
						thumbnail: z
							.string()
							.optional()
							.describe('Key into the bundled webcam images; unknown shows a transparent pixel'),
						thumbnailUrl: z
							.string()
							.optional()
							.describe('Remote thumbnail; preferred over `thumbnail`'),
					}),
				),
			}),
			notes: 'On failure the release uses its bundled copy.',
		},
		{
			name: 'pause-menu',
			method: 'GET',
			url: `${GH_PAGES}/pause-menu.json`,
			format: 'json',
			source: ['source/views/menus/menu-github.js:62'],
			response: z.looseObject({
				data: z.looseObject({
					foodItems: z.array(pauseMenuItem).optional(),
					stationMenus: z
						.array(
							z.looseObject({
								label: z.string().describe('Section header; items join by their `station`'),
								note: z.string().optional().describe('Section subtitle'),
							}),
						)
						.optional(),
					corIcons: z.record(z.string(), corIcon).optional(),
				}),
			}),
			notes:
				'Built from data/pause-menu.yaml. Any failure, including a missing `data`, falls back to the bundled copy and is reported to Bugsnag.',
		},
		{
			name: 'help',
			method: 'GET',
			url: `${GH_PAGES}/help.json`,
			format: 'json',
			source: ['source/lib/cache.js:214'],
			response: z.looseObject({data: z.array(helpTool)}),
			notes:
				'Fetched at launch and when Help opens, when online and the one-hour AsyncStorage cache has expired; `data` is cached as is. The bundled copy is used only when offline with nothing cached. On a failed fetch the Help screen shows "No tools are enabled." A missing `data` crashes the Help screen.',
		},
		{
			name: 'wifi-report',
			method: 'POST',
			url: 'https://www.stolaf.edu/apps/all-about-olaf/wifi/index.cfm?fuseaction=Submit',
			format: 'text',
			source: ['source/views/help/wifi-tools.js:46', 'source/views/help/wifi.js:64'],
			request: z
				.looseObject({
					position: z
						.looseObject({
							coords: z.looseObject({
								latitude: z.number(),
								longitude: z.number(),
								accuracy: z.number().optional(),
							}),
							timestamp: z.number().optional(),
						})
						.nullable()
						.describe('navigator.geolocation position, or null when it could not be had'),
					device: z.looseObject({
						id: z.string(),
						brand: z.string(),
						model: z.string(),
						deviceKind: z.string(),
						os: z.string(),
						osVersion: z.string(),
						appVersion: z.string(),
						jsVersion: z.string().describe("'2.5.2'"),
						ua: z.string(),
						ip: z.string().nullable(),
						dateRecorded: z.string().describe('ISO 8601 from Date#toJSON'),
					}),
					version: z.literal(1),
				})
				.describe('JSON.stringify’d body with no Content-Type set'),
			response: z.unknown().describe('Not read; any 2xx counts as success'),
			notes:
				"The URL is the help.json wifi tool's first button `params.url` when that button's action is 'custom', and this default otherwise. Retried up to 10 times; a final failure shows the tool's `errorMessage` or a generic apology.",
		},
		{
			name: 'bonapp-menu',
			method: 'GET',
			url: 'http://legacy.cafebonappetit.com/api/2/menus?cafe={cafeId}',
			params: {cafeId: ['261', '262', '35', '36', '458', '34']},
			format: 'json',
			source: ['source/views/menus/menu-bonapp.js:96', 'source/views/menus/menu-bonapp.js:36'],
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
												'Only dayparts[0] is read, without a guard; an empty dayparts[0] gives one all-day "Menu"',
											),
									}),
								)
								.describe('Must hold the requested cafe id; read without a guard'),
						}),
					)
					.min(1)
					.describe('Only days[0] is read'),
				items: z.record(z.string(), bonAppItem).describe('Every item, keyed by id'),
				cor_icons: z.record(z.string(), corIcon),
			}),
			notes:
				'Cafes: 261 Stav Hall, 262 The Cage (stations rebuilt from item.station), 35 Burton, 36 LDC, 458 Weitz Center, 34 Sayles Hill. Plain http. Requested together with bonapp-cafe; each is retried 3 times. Failure shows an error notice with a retry button; a JSON parse error on "<" gets a "something between you and BonApp" message.',
		},
		{
			name: 'bonapp-cafe',
			method: 'GET',
			url: 'http://legacy.cafebonappetit.com/api/2/cafes?cafe={cafeId}',
			params: {cafeId: ['261', '262', '35', '36', '458', '34']},
			format: 'json',
			source: ['source/views/menus/menu-bonapp.js:98', 'source/views/menus/menu-bonapp.js:36'],
			response: z.looseObject({
				cafes: z
					.record(
						z.string(),
						z.looseObject({
							days: z.array(
								z.looseObject({
									date: z.string().describe("'YYYY-MM-DD'; compared with today in Central time"),
									status: z
										.string()
										.optional()
										.describe("'closed' shows `message` (or 'Closed today') instead of the menu"),
									message: z.union([z.string(), z.literal(false)]).optional(),
								}),
							),
						}),
					)
					.describe(
						"A missing entry for the requested cafe shows 'BonApp did not return a menu for that café'",
					),
			}),
			notes:
				'Requested together with bonapp-menu; failure handling is shared with it. No entry for today shows "Closed today".',
		},
		{
			name: 'student-orgs',
			method: 'GET',
			url: 'https://www.stolaf.edu/orgs/list/index.cfm?fuseaction=getall&nostructure=1',
			format: 'json',
			source: ['source/views/student-orgs/list.js:102'],
			response: z.array(
				z.looseObject({
					name: z
						.string()
						.describe(
							'Trimmed; a leading "St. Olaf", "St Olaf College" or "The" is dropped for sorting',
						),
					category: z.string(),
					description: z.string().describe('HTML; tags stripped'),
					meetings: z.string(),
					website: z.string().describe("Trimmed; 'http://' is added when it has no scheme"),
					lastUpdated: z.string().describe("Parsed with moment(…, 'MMMM, DD YYYY HH:mm:ss')"),
					contacts: z.array(
						z.looseObject({
							firstName: z.string(),
							lastName: z.string(),
							title: z.string(),
							email: z.string(),
						}),
					),
					advisors: z.array(
						z.looseObject({
							name: z.string().describe('Trimmed; empty names are dropped'),
							email: z.string(),
						}),
					),
				}),
			),
			notes: 'A top-level array. On failure the list is empty and the error is reported.',
		},
		{
			name: 'student-work',
			method: 'GET',
			url: 'https://www.stolaf.edu/apps/stuwork/index.cfm?fuseaction=getall&nostructure=1',
			format: 'json',
			source: ['source/views/sis/student-work/index.js:61'],
			response: z.array(
				z.looseObject({
					type: z.string().describe('Title-cased; section header'),
					title: z.string().describe('HTML; tags stripped'),
					office: z.string().describe('HTML; tags stripped'),
					hoursPerWeek: z.string().describe("Trimmed; 'Full-time' drops the 'hrs/week' suffix"),
					lastModified: z.string().describe("Parsed with moment(…, 'YYYY/MM/DD'); sort key"),
					description: z.string().describe('HTML; tags stripped; URLs in it become links'),
					comments: z.string().describe('HTML; tags stripped; URLs in it become links'),
					skills: z.string().describe('HTML; tags stripped; URLs in it become links'),
					contactEmail: z.string().describe("'@stolaf.edu' is appended when it has no domain"),
					contactFirstName: z.string(),
					contactLastName: z.string(),
					timeOfHours: z.union([z.string(), z.number()]).optional(),
				}),
			),
			notes: 'A top-level array. On failure the screen shows "Could not get open jobs."',
		},
		{
			name: 'streams',
			method: 'GET',
			url: 'https://www.stolaf.edu/multimedia/api/collection?class=current&sort=ascending&date_from={dateFrom}&date_to={dateTo}',
			format: 'json',
			source: ['source/views/streaming/streams/list.js:90'],
			response: z.looseObject({
				results: z.array(
					z.looseObject({
						eid: z.string().describe('List key'),
						category: z.string().describe("'athletics' entries are dropped; the rest title-cased"),
						status: z
							.string()
							.describe("Lower-cased; 'live' groups under Live, 'archived' hides the time"),
						starttime: z.string().describe("Parsed with moment(…, 'YYYY-MM-DD HH:mm')"),
						title: z.string().describe('HTML; its text is the row title'),
						subtitle: z.string().optional().nullable().describe('HTML; preferred over performer'),
						performer: z.string().optional().nullable().describe('HTML'),
						thumb: z.string().optional().describe('Thumbnail image URL'),
						player: z.string().describe('Opened in the browser on tap'),
					}),
				),
			}),
			notes:
				"dateFrom is today and dateTo a month later, both 'YYYY-MM-DD' in Central time. On failure the screen shows the error message.",
		},
		{
			name: 'news-wp-json',
			method: 'GET',
			url: '{feedUrl}?per_page=10&_embed=true',
			params: {
				feedUrl: [
					'https://wp.stolaf.edu/wp-json/wp/v2/posts',
					'http://oleville.com/wp-json/wp/v2/posts/',
					'https://www.manitoumessenger.com/wp-json/wp/v2/posts/',
					'https://pages.stolaf.edu/ksto/wp-json/wp/v2/posts/',
				],
			},
			format: 'json',
			source: [
				'source/views/news/fetch-feed.js:33',
				'source/views/news/index.js:21',
				'source/views/news/index.js:38',
				'source/views/news/index.js:55',
				'source/views/news/index.js:88',
			],
			response: z.array(wpPost),
			notes:
				'St. Olaf, Oleville, The Mess and KSTO tabs. A response starting with "<" (St. Olaf\'s WP Defender page) shows a "try again in 5 minutes" notice; other failures show the error.',
		},
		{
			name: 'news-rss-politicole',
			method: 'GET',
			url: 'http://oleville.com/politicole/feed/?',
			format: 'xml',
			source: ['source/views/news/fetch-feed.js:24', 'source/views/news/index.js:71'],
			response: z.string().describe('RSS 2.0, parsed with xml2js; read as rss.channel[0].item[]'),
			notes:
				'The URL ends in a bare "?" since no query is passed. Each <item> needs a <title> (title[0] is read without a guard); <link>, <dc:creator>, <category>, <pubDate>, <content:encoded> and <description> are optional. The row opens <link>. Failure shows an error notice.',
		},
		{
			name: 'google-calendar',
			method: 'GET',
			url: 'https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events?maxResults=50&orderBy=startTime&showDeleted=false&singleEvents=true&timeMin={timeMin}&key={apiKey}',
			params: {
				calendarId: [
					'5g91il39n0sv4c2bjdv1jrvcpq4ulm4r@import.calendar.google.com',
					'stolaf.edu_fvulqo4larnslel75740vglvko@group.calendar.google.com',
					'thisisnorthfield@gmail.com',
				],
			},
			format: 'json',
			source: ['source/views/calendar/calendar-google.js:90', 'source/views/calendar/index.js:16'],
			response: z.looseObject({
				items: z.array(googleEvent).describe('Mapped without a guard'),
				error: z
					.looseObject({message: z.string()})
					.optional()
					.describe('Shown as a message above the list when present'),
			}),
			notes:
				"St. Olaf, Oleville and Northfield tabs. calendarId is put in the path unescaped; timeMin is now as an ISO 8601 string, URL-encoded; apiKey is GOOGLE_CALENDAR_API_KEY from the build's .env.js. A failed request leaves the list empty.",
		},
		{
			name: 'olecard-authenticate',
			method: 'POST',
			url: 'https://www.stolaf.edu/apps/olecard/checkbalance/authenticate.cfm',
			format: 'html',
			source: ['source/lib/login.js:39', 'source/lib/financials/balances.js:63'],
			request: z
				.looseObject({username: z.string(), password: z.string()})
				.describe('multipart/form-data built with FormData'),
			response: z.string(),
			notes:
				"Logging in (from Settings, and validating saved credentials at launch, with 3 retries on network failure) reads the body: a page containing 'Password' means the login failed. Fetching balances instead checks the final URL after redirects: one containing 'message=' means the login failed. The session cookie it sets is what olecard-balances relies on.",
		},
		{
			name: 'olecard-balances',
			method: 'GET',
			url: 'https://www.stolaf.edu/apps/olecard/checkbalance/api.cfm',
			format: 'json',
			source: ['source/lib/financials/balances.js:72'],
			response: z.looseObject({
				error: z
					.string()
					.optional()
					.nullable()
					.describe('When truthy, shown as the error and nothing else is read'),
				data: z.looseObject({
					accounts: z.array(
						z.looseObject({
							account: z
								.string()
								.describe(
									"Matched against 'STO Flex', 'STO Ole Dollars' and 'STO Student Printing'",
								),
							formatted: z.string().describe('Shown as the balance'),
						}),
					),
					meals: z
						.looseObject({
							leftDaily: z.union([z.string(), z.number()]).optional().nullable(),
							leftWeekly: z.union([z.string(), z.number()]).optional().nullable(),
							plan: z.string().optional().nullable().describe('Meal plan name'),
						})
						.optional()
						.nullable(),
				}),
			}),
			notes:
				'Requested right after olecard-authenticate succeeds, at launch (when the cached balances have expired) and on pull-to-refresh. A non-2xx response rejects the thunk unhandled, leaving the previous balances.',
		},
	],
}
