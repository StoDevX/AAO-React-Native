import {z} from 'zod'

import type {Release} from '../types'

const API_ROOT = 'https://stolaf.api.frogpond.tech/v1'
const PAPERCUT_API = 'https://papercut.stolaf.edu/rpc/api/rest/internal'
const PAPERCUT_MOBILE_RELEASE_API = `${PAPERCUT_API}/mobilerelease/api`
const COURSE_DATA = 'https://stodevx.github.io/course-data'

/** A time of day as the building-hours and bus code parse it. */
const clockTime = z
	.string()
	.describe("Time of day, parsed strictly with moment format 'h:mma' (e.g. '7:30am')")

const dayAbbrev = z
	.string()
	.describe("Two-letter weekday matched against moment's 'dd' format: Mo, Tu, We, Th, Fr, Sa, Su")

const buildingSchedule = z.looseObject({
	title: z
		.string()
		.describe("Rendered, and upper-cased on iOS; 'Hours' hides the label in the list row"),
	notes: z.string().optional(),
	isPhysicallyOpen: z.boolean().optional().describe('Only `false` has an effect'),
	closedForChapelTime: z.boolean().optional(),
	hours: z.array(
		z.looseObject({
			days: z.array(dayAbbrev),
			from: clockTime,
			to: clockTime,
		}),
	),
})

const building = z.looseObject({
	name: z.string(),
	category: z.string().optional().describe("Groups the list; missing goes under 'Other'"),
	abbreviation: z.string().optional(),
	subtitle: z.string().optional(),
	isNotice: z.boolean().optional(),
	noticeMessage: z.string().optional(),
	image: z.string().optional().describe('Name of a bundled image in images/spaces'),
	schedule: z.array(buildingSchedule).optional().describe("Missing or empty shows 'Hours unknown'"),
})

const bonAppStation = z.looseObject({
	label: z.string().describe('Title-cased with titlecase'),
	note: z.string().optional().describe('Shown as the section subtitle'),
	items: z.array(z.string()).describe('Keys into the `items` map'),
})

const bonAppDaypart = z.looseObject({
	label: z.string().optional(),
	starttime: z.string().optional().describe("Parsed with moment format 'H:mm'; defaults to '0:00'"),
	endtime: z.string().optional().describe("Parsed with moment format 'H:mm'; defaults to '23:59'"),
	stations: z
		.array(bonAppStation)
		.describe('Ignored for the-cage, which builds stations from item.station'),
})

const corIcon = z.looseObject({
	label: z.string().describe('HTML-entity-decoded and shown as a dietary filter'),
	image: z.string().optional().describe('Icon URL rendered in <Image>'),
	description: z.string().optional().describe('HTML; tags stripped'),
})

const corIconMap = z.record(z.string(), corIcon)

const itemCorIcons = z
	.union([z.record(z.string(), z.string()), z.array(z.unknown())])
	.describe('Map of cor icon id to name; BonApp sends an empty array when there are none')

const nutritionDetail = z.looseObject({
	label: z.string(),
	value: z.union([z.number(), z.string()]),
	unit: z.string().describe("String methods are called on it; 'lessthan' prefixes are rewritten"),
})

const bonAppItem = z.looseObject({
	id: z.string().describe('Used to build stations for the-cage (ignoreProvidedMenus)'),
	label: z.string().describe('Whitespace-collapsed, parenthesised suffixes removed, title-cased'),
	station: z.string().describe("HTML such as '<strong>@grill</strong>'; trimmed and title-cased"),
	description: z.string().optional().describe('HTML; text extracted'),
	special: z.boolean().optional(),
	cor_icon: itemCorIcons.optional(),
	nutrition_details: z
		.record(z.string(), nutritionDetail)
		.optional()
		.describe('Shown only when it has more than one key'),
})

const bonAppMenu = z.looseObject({
	days: z
		.array(
			z.looseObject({
				cafe: z.looseObject({
					dayparts: z
						.array(z.array(bonAppDaypart))
						.min(1)
						.describe('Only dayparts[0] is read; an empty inner array uses a single all-day menu'),
				}),
			}),
		)
		.min(1)
		.describe('Only days[0] is read'),
	items: z.record(z.string(), bonAppItem).describe('An empty map shows "No items were found."'),
	cor_icons: corIconMap.optional(),
})

const bonAppCafe = z.looseObject({
	cafe: z.looseObject({
		days: z.array(
			z.looseObject({
				date: z.string().describe("Compared with today's date formatted 'YYYY-MM-DD'"),
				status: z.string().optional().describe("'closed' shows the message"),
				message: z.string().optional(),
			}),
		),
	}),
})

/** A calendar event as the event list, row and detail screens read it. */
const calendarEventFields = {
	title: z.string().describe('HTML tags stripped with a regex'),
	description: z.string().describe('.trim() is called on it in the detail view'),
	location: z.string().describe('.trim() is called on it in the detail view'),
	startTime: z.string().describe('ISO 8601; parsed with moment()'),
	endTime: z.string().describe('ISO 8601; parsed with moment()'),
	isOngoing: z.boolean().optional(),
	links: z.array(z.string()).describe('Read without a guard by the Android detail view'),
}

const story = z.looseObject({
	title: z.string().describe('Rendered; also the list key'),
	excerpt: z.string().describe('.trim()ed; stories with a blank excerpt are hidden'),
	content: z.string().describe("Stories whose content includes '<form' are hidden"),
	link: z
		.string()
		.nullable()
		.optional()
		.describe('Opened on tap; no link means the tap does nothing'),
	featuredImage: z
		.string()
		.nullable()
		.optional()
		.describe('Image URL; falls back to the bundled source logo'),
})

const printer = z.looseObject({
	printerName: z.string(),
	location: z
		.string()
		.optional()
		.describe("Missing becomes 'Unknown Building'; 'ABC 123' locations group by building code"),
})

const termFile = z.looseObject({
	type: z.string().describe("Only 'json' entries are used"),
	year: z.number().describe('Entries older than five years are dropped'),
	term: z
		.number()
		.describe('e.g. 20183; matched against cached terms and shown via its last digit'),
	path: z.string().describe('Appended to https://stodevx.github.io/course-data/ to fetch the term'),
	hash: z.string().describe('A changed hash re-downloads the term'),
})

const courseOffering = z.looseObject({
	day: dayAbbrev,
	start: z.string().describe("Parsed with moment format 'H:mm'"),
	end: z.string().describe("Parsed with moment format 'H:mm'"),
	location: z.string(),
})

const course = z.looseObject({
	clbid: z.number().describe('List key'),
	name: z.string().describe('.toLowerCase() for search'),
	title: z.string().optional(),
	department: z.string(),
	number: z.number(),
	section: z.string().optional(),
	term: z.number().describe('Groups results and drives the term filter'),
	level: z.number().describe('Filtered against 100/200/300'),
	type: z.string().describe("'Lab' matches the lab filter"),
	status: z.string().describe("'O' is open"),
	enrolled: z.number().describe('Compared with max for spaceAvailable'),
	max: z.number(),
	credits: z.number().optional(),
	pn: z.boolean().optional(),
	prerequisites: z.union([z.literal(false), z.string()]).optional(),
	instructors: z.array(z.string()).optional(),
	gereqs: z.array(z.string()).optional(),
	notes: z.array(z.string()).optional(),
	description: z.array(z.string()).optional().describe('Only the first element is shown'),
	offerings: z.array(courseOffering).optional(),
})

const helpButton = z.looseObject({
	title: z.string(),
	action: z
		.string()
		.describe("'open-url', 'send-email', 'call-phone' or 'custom'; others do nothing"),
	enabled: z.boolean().optional(),
	params: z
		.looseObject({
			url: z.string().optional().describe("open-url, and the wifi tool's custom report URL"),
			to: z
				.union([z.string(), z.array(z.string())])
				.optional()
				.describe('send-email'),
			cc: z.union([z.string(), z.array(z.string())]).optional(),
			bcc: z.union([z.string(), z.array(z.string())]).optional(),
			subject: z.string().optional(),
			body: z.string().optional(),
			number: z.string().optional().describe('call-phone'),
		})
		.optional()
		.describe('Required by every action except custom'),
})

const helpTool = z.looseObject({
	key: z.string().describe("'wifi' gets the built-in wifi reporter"),
	title: z.string(),
	body: z.string().describe('Markdown'),
	buttons: z.array(helpButton),
	enabled: z.boolean().optional().describe('Missing disables the tool'),
	hidden: z.boolean().optional(),
	message: z.string().optional().describe('Footer shown when the tool is disabled'),
	errorMessage: z.string().optional().describe('wifi tool only'),
	versionRange: z.string().optional().describe('semver range checked against the app version'),
})

const olecardAccount = z.looseObject({
	account: z
		.string()
		.describe("Matched against 'STO Flex', 'STO Ole Dollars' and 'STO Student Printing'"),
	formatted: z.string(),
})

/** The final 2.7 build, tagged v2.7.0. */
export const release: Release = {
	tag: 'v2.7.0',
	version: '2.7.0',
	contracts: [
		{
			name: 'building-hours',
			method: 'GET',
			url: `${API_ROOT}/spaces/hours`,
			format: 'json',
			source: ['source/views/building-hours/stateful-list.js:95'],
			response: z.looseObject({data: z.array(building)}),
			notes:
				'On failure the release falls back to its bundled copy of data/building-hours (docs/building-hours.json). Chapel times come from the bundled docs/chapel.json, never the network.',
		},
		{
			name: 'bonapp-menu',
			method: 'GET',
			url: `${API_ROOT}/food/named/menu/{cafe}`,
			params: {cafe: ['stav-hall', 'the-cage', 'burton', 'ldc', 'weitz', 'sayles']},
			format: 'json',
			source: ['source/views/menus/menu-bonapp.js:113'],
			response: bonAppMenu,
			notes:
				'Retried 3 times, fetched together with bonapp-cafe. On failure an error notice with a retry button is shown; a body starting with "<" shows a "something between you and BonApp" message. No bundled fallback.',
		},
		{
			name: 'bonapp-cafe',
			method: 'GET',
			url: `${API_ROOT}/food/named/cafe/{cafe}`,
			params: {cafe: ['stav-hall', 'the-cage', 'burton', 'ldc', 'weitz', 'sayles']},
			format: 'json',
			source: ['source/views/menus/menu-bonapp.js:114'],
			response: bonAppCafe,
			notes:
				"Used for today's closed/special message. Failure is handled with bonapp-menu's error notice.",
		},
		{
			name: 'bonapp-menu-by-id',
			method: 'GET',
			url: `${API_ROOT}/food/menu/{cafeId}`,
			format: 'json',
			source: ['source/views/menus/menu-bonapp.js:113'],
			response: bonAppMenu,
			notes:
				'Only reachable from the BonApp picker tab, which exists in dev mode (isDevMode()); cafeId is any digits typed by the user.',
		},
		{
			name: 'bonapp-cafe-by-id',
			method: 'GET',
			url: `${API_ROOT}/food/cafe/{cafeId}`,
			format: 'json',
			source: ['source/views/menus/menu-bonapp.js:114'],
			response: bonAppCafe,
			notes: 'Dev-mode BonApp picker only, as bonapp-menu-by-id.',
		},
		{
			name: 'pause-menu',
			method: 'GET',
			url: `${API_ROOT}/food/named/menu/the-pause`,
			format: 'json',
			source: ['source/views/menus/menu-github.js:60'],
			response: z.looseObject({
				data: z.looseObject({
					foodItems: z
						.array(
							z.looseObject({
								label: z.string(),
								station: z.string().describe('Matched against a stationMenus label'),
								special: z.boolean().optional(),
								description: z.string().optional(),
							}),
						)
						.optional(),
					stationMenus: z
						.array(z.looseObject({label: z.string(), note: z.string().optional()}))
						.optional(),
					corIcons: corIconMap.optional(),
				}),
			}),
			notes:
				'Shares the /food/named/menu/ path with bonapp-menu but expects the pause-menu.json shape (data/pause-menu.yaml), not a BonApp menu. Any failure, including a missing `data`, falls back to the bundled docs/pause-menu.json.',
		},
		{
			name: 'contacts',
			method: 'GET',
			url: `${API_ROOT}/contacts`,
			format: 'json',
			source: ['source/views/contacts/list.js:72'],
			response: z.looseObject({
				data: z.array(
					z.looseObject({
						title: z.string().describe('List key; .replace() is called on it'),
						category: z.string().describe('Groups the list'),
						synopsis: z.string(),
						text: z.string().describe('Markdown'),
						buttonText: z.string(),
						buttonLink: z.string().optional(),
						phoneNumber: z.string().optional(),
						image: z.string().optional().describe('Name of a bundled image'),
					}),
				),
			}),
			notes: 'On failure falls back to the bundled docs/contact-info.json (data/contact-info).',
		},
		{
			name: 'dictionary',
			method: 'GET',
			url: `${API_ROOT}/dictionary`,
			format: 'json',
			source: ['source/views/dictionary/list.js:87'],
			response: z.looseObject({
				data: z.array(
					z.looseObject({
						word: z.string().describe('Lower-cased for search; first character groups the list'),
						definition: z.string().describe('Lower-cased for search; Markdown in the detail view'),
					}),
				),
			}),
			notes: 'On failure falls back to the bundled docs/dictionary.json (data/dictionary).',
		},
		{
			name: 'faqs',
			method: 'GET',
			url: `${API_ROOT}/faqs`,
			format: 'json',
			source: ['source/views/faqs/index.js:47'],
			response: z.looseObject({text: z.string().describe('Markdown')}),
			notes:
				"On failure shows the text 'There was a problem loading the FAQs'. Source data is data/faqs.md.",
		},
		{
			name: 'help-tools',
			method: 'GET',
			url: `${API_ROOT}/tools/help`,
			format: 'json',
			source: ['source/lib/cache.js:193'],
			response: z.looseObject({data: z.array(helpTool)}),
			notes:
				'Cached in AsyncStorage for an hour. Offline it uses the cache, then the bundled docs/help.json; online, a failed fetch leaves the Help screen saying no tools are enabled.',
		},
		{
			name: 'wifi-report',
			method: 'POST',
			url: 'https://www.stolaf.edu/apps/all-about-olaf/wifi/index.cfm?fuseaction=Submit',
			format: 'text',
			source: ['source/views/help/wifi-tools.js:46', 'source/views/help/wifi.js:63'],
			request: z
				.looseObject({
					version: z.literal(1),
					position: z
						.looseObject({
							coords: z.looseObject({latitude: z.number(), longitude: z.number()}),
							timestamp: z.number(),
						})
						.nullable()
						.describe('navigator.geolocation position, or null'),
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
						dateRecorded: z.string().describe('ISO 8601'),
					}),
				})
				.describe('Sent as a JSON string body with no Content-Type set'),
			response: z.unknown(),
			notes:
				"The help tool with key 'wifi' can replace the URL: when its first button has action 'custom', params.url is used instead. Only a 2xx status is checked; retried 10 times, then the tool's errorMessage is shown.",
		},
		{
			name: 'jobs',
			method: 'GET',
			url: `${API_ROOT}/jobs`,
			format: 'json',
			source: ['source/views/sis/student-work/index.js:59'],
			response: z.array(
				z.looseObject({
					id: z.union([z.number(), z.string()]).describe('Used in the share URL'),
					title: z.string(),
					office: z.string(),
					type: z.string().describe('Title-cased; groups the list'),
					hoursPerWeek: z
						.string()
						.describe("HTML stripped with a regex; 'Full-time' drops the hrs/week suffix"),
					lastModified: z.string().optional().describe("Parsed with moment format 'YYYY/MM/DD'"),
					contactName: z.string().optional(),
					contactEmail: z.string().optional(),
					contactPhone: z.string().optional(),
					timeOfHours: z.union([z.string(), z.number()]).optional(),
					openPositions: z.string().optional(),
					year: z.string().optional(),
					goodForIncomingStudents: z.boolean().optional(),
					description: z.string().optional(),
					skills: z.string().optional(),
					comments: z.string().optional(),
					howToApply: z.string().optional(),
					timeline: z.string().optional(),
				}),
			),
			notes: "The response is a bare array. On failure shows 'Could not get open jobs.'",
		},
		{
			name: 'news',
			method: 'GET',
			url: `${API_ROOT}/news/named/{source}`,
			params: {source: ['stolaf', 'oleville', 'mess', 'politicole', 'ksto']},
			format: 'json',
			source: ['source/views/news/news-container.js:50'],
			response: z.array(story),
			notes:
				'The response is a bare array of stories. On failure shows the error message. The /news/rss and /news/wpjson code paths exist but no screen uses them in this release.',
		},
		{
			name: 'calendar-named',
			method: 'GET',
			url: `${API_ROOT}/calendar/named/{calendar}`,
			params: {calendar: ['stolaf', 'oleville', 'northfield']},
			format: 'json',
			source: ['modules/ccc-calendar/index.js:84'],
			response: z.array(
				z.looseObject({
					...calendarEventFields,
					config: z.looseObject({
						startTime: z.boolean().optional().describe('Whether the row shows the start time'),
						endTime: z.boolean().optional().describe('Whether the row shows the end time'),
						subtitle: z
							.string()
							.describe(
								"Name of the event field shown as the row subtitle: 'location' or 'description'",
							),
					}),
				}),
			),
			notes:
				'A bare array of events. A failed request shows an empty list (the error is stored as a string and its .message is undefined, so no notice appears). The /calendar/google, /calendar/reason and /calendar/ics branches exist in the code but no screen in this release uses them.',
		},
		{
			name: 'radio-schedule',
			method: 'GET',
			url: `${API_ROOT}/calendar/named/{calendar}`,
			params: {calendar: ['ksto-schedule', 'krlx-schedule']},
			format: 'json',
			source: ['modules/ccc-calendar/index.js:84'],
			response: z.array(
				z.looseObject({
					...calendarEventFields,
					config: z
						.looseObject({
							startTime: z.boolean().optional().describe('Whether the row shows the start time'),
							endTime: z.boolean().optional().describe('Whether the row shows the end time'),
						})
						.optional()
						.describe("Spread into a new config whose subtitle is forced to 'description'"),
				}),
			),
			notes:
				'The same endpoint as calendar-named, read by the KSTO and KRLX show schedules. A failed request shows an empty list.',
		},
		{
			name: 'student-orgs',
			method: 'GET',
			url: `${API_ROOT}/orgs`,
			format: 'json',
			source: ['source/views/student-orgs/list.js:98'],
			response: z.array(
				z.looseObject({
					name: z.string().describe(".replace() strips a leading 'St. Olaf' or 'The' for sorting"),
					category: z.string().describe('Lower-cased for search'),
					description: z
						.string()
						.describe('Lower-cased for search; HTML entities decoded in the detail view'),
					meetings: z.string().optional(),
					website: z.string().optional(),
					contacts: z.array(
						z.looseObject({
							firstName: z.string().describe('.trim() is called on it'),
							lastName: z.string().describe('.trim() is called on it'),
							email: z.string(),
							title: z.string().optional(),
						}),
					),
					advisors: z.array(z.looseObject({name: z.string(), email: z.string()})),
					lastUpdated: z.string().describe("Parsed with moment format 'MMMM, DD YYYY HH:mm:ss'"),
				}),
			),
			notes: "The response is a bare array. On failure shows 'No organizations found.'",
		},
		{
			name: 'streams',
			method: 'GET',
			url: `${API_ROOT}/streams/upcoming?dateFrom={dateFrom}&dateTo={dateTo}&sort=ascending`,
			format: 'json',
			source: ['source/views/streaming/streams/list.js:84'],
			response: z.array(
				z.looseObject({
					eid: z.string().describe('List key'),
					title: z.string().describe('HTML; text extracted'),
					category: z.string().describe("'athletics' is filtered out; title-cased"),
					status: z
						.string()
						.describe(".toLowerCase(); 'live' groups under Live, 'archived' hides the time"),
					starttime: z.string().describe('Parsed with moment()'),
					subtitle: z.string().nullable().optional(),
					performer: z.string().nullable().optional(),
					thumb: z.string().optional().describe('Image URL'),
					player: z.string().describe('Opened in the browser on tap'),
				}),
			),
			notes:
				"dateFrom is today and dateTo two months later, both 'YYYY-MM-DD' in Central time; query-string sorts the keys. The response is a bare array. On failure shows 'Error: <message>'.",
		},
		{
			name: 'webcams',
			method: 'GET',
			url: `${API_ROOT}/webcams`,
			format: 'json',
			source: ['source/views/streaming/webcams/list.js:42'],
			response: z.looseObject({
				data: z.array(
					z.looseObject({
						name: z.string(),
						pageUrl: z.string().describe('Opened in the browser on tap'),
						thumbnail: z.string().optional().describe('Name of a bundled image in images/webcams'),
						thumbnailUrl: z.string().optional(),
						accentColor: z
							.tuple([z.number(), z.number(), z.number()])
							.describe('RGB, destructured'),
						textColor: z.string(),
					}),
				),
			}),
			notes: 'On failure falls back to the bundled docs/webcams.json (data/webcams).',
		},
		{
			name: 'transit-bus',
			method: 'GET',
			url: `${API_ROOT}/transit/bus`,
			format: 'json',
			source: ['source/views/transportation/bus/wrapper.js:41'],
			response: z.looseObject({
				data: z.array(
					z.looseObject({
						line: z
							.string()
							.describe("Matched against 'Express Bus', 'Red Line', 'Blue Line' and 'Oles Go'"),
						colors: z.looseObject({bar: z.string(), dot: z.string()}),
						notice: z.string().optional(),
						schedules: z.array(
							z.looseObject({
								days: z.array(dayAbbrev),
								stops: z.array(z.string()),
								coordinates: z
									.record(z.string(), z.tuple([z.number(), z.number()]))
									.describe('Stop name to [lat, lng]; the `in` operator is used on it'),
								times: z.array(z.array(z.union([clockTime, z.literal(false)]))),
							}),
						),
					}),
				),
			}),
			notes:
				'On failure falls back to the bundled docs/bus-times.json (data/bus-times). A missing line shows a "not found" notice listing the lines received.',
		},
		{
			name: 'transit-modes',
			method: 'GET',
			url: `${API_ROOT}/transit/modes`,
			format: 'json',
			source: ['source/views/transportation/other-modes/list.js:72'],
			response: z.looseObject({
				data: z.array(
					z.looseObject({
						name: z.string().describe('List key; .replace() is called on it'),
						category: z.string(),
						synopsis: z.string(),
						description: z.string().describe('Markdown'),
						url: z.string().describe('Opened by the More Info button'),
					}),
				),
			}),
			notes: 'On failure falls back to the bundled docs/transportation.json (data/transportation).',
		},
		{
			name: 'color-printers',
			method: 'GET',
			url: `${API_ROOT}/printing/color-printers`,
			format: 'json',
			source: ['source/lib/stoprint/api.js:101'],
			response: z.looseObject({
				data: z.looseObject({
					colorPrinters: z
						.array(z.string())
						.describe('Matched against printerName from papercut-all-printers'),
				}),
			}),
			notes:
				'Fetched with the two PaperCut printer lists; any failure shows the stoPrint error view.',
		},
		{
			name: 'papercut-login',
			method: 'POST',
			url: `${PAPERCUT_API}/webclient/users/{username}/log-in?nocache={timestamp}`,
			format: 'json',
			source: ['source/lib/stoprint/api.js:30'],
			request: z
				.looseObject({password: z.string().describe('base64 of the password')})
				.describe(
					"application/x-www-form-urlencoded body, sent with an 'Origin: https://papercut.stolaf.edu' header",
				),
			response: z.looseObject({
				success: z.boolean().describe('Falsy shows an invalid credentials message'),
			}),
			notes:
				'Made before every stoPrint jobs or printers refresh. timestamp is Date.getTime(). A non-2xx or non-JSON answer shows "The print server seems to be having some issues."',
		},
		{
			name: 'papercut-jobs',
			method: 'GET',
			url: `${PAPERCUT_API}/webclient/users/{username}/jobs/status`,
			format: 'json',
			source: ['source/lib/stoprint/api.js:58'],
			response: z.looseObject({
				jobs: z.array(
					z.looseObject({
						id: z
							.union([z.string(), z.number()])
							.describe('.toString(); prefix-matched against held job ids'),
						documentName: z.string(),
						statusFormatted: z
							.string()
							.describe("'Pending Release' allows release; 'Sent to Printer' shows the printer"),
						usageTimeFormatted: z
							.string()
							.describe("Parsed with moment format 'h:mm:ss A' to show expiry"),
						usageCostFormatted: z.string(),
						totalPages: z.number().describe('.toString() is called on it'),
						grayscaleFormatted: z.string().describe("'No' means a colour job"),
						paperSizeFormatted: z.string(),
						printerName: z.string(),
					}),
				),
			}),
			notes:
				'Relies on the session cookie from papercut-login. On failure shows the stoPrint error view.',
		},
		{
			name: 'papercut-all-printers',
			method: 'GET',
			url: `${PAPERCUT_MOBILE_RELEASE_API}/all-printers?username={username}`,
			format: 'json',
			source: ['source/lib/stoprint/api.js:71'],
			response: z.array(printer),
			notes: 'The response is a bare array. On failure shows the stoPrint error view.',
		},
		{
			name: 'papercut-recent-printers',
			method: 'GET',
			url: `${PAPERCUT_MOBILE_RELEASE_API}/recent-popular-printers?username={username}`,
			format: 'json',
			source: ['source/lib/stoprint/api.js:84'],
			response: z.looseObject({
				recentPrinters: z.array(printer),
				popularPrinters: z.array(printer),
			}),
			notes: 'On failure shows the stoPrint error view.',
		},
		{
			name: 'papercut-held-jobs',
			method: 'GET',
			url: `${PAPERCUT_MOBILE_RELEASE_API}/held-jobs/?username={username}&printerName=printers%5C{printerName}`,
			format: 'json',
			source: ['source/lib/stoprint/api.js:116'],
			response: z.array(
				z.looseObject({id: z.string().describe(".startsWith() is called with the job's id")}),
			),
			notes:
				'The trailing slash before the query is in the code. On failure, or with no matching job, an alert sends the user back to the job list.',
		},
		{
			name: 'papercut-release',
			method: 'POST',
			url: `${PAPERCUT_MOBILE_RELEASE_API}/held-jobs/release?username={username}`,
			format: 'json',
			source: ['source/lib/stoprint/api.js:163'],
			request: z
				.looseObject({
					printerName: z.string().describe("'printers\\<printerName>'"),
					'jobIds[]': z.string().describe('The held job id'),
				})
				.describe(
					"application/x-www-form-urlencoded (arrayFormat 'bracket'), with an Origin header",
				),
			response: z.looseObject({
				numJobsReleased: z.number().optional().describe('0 is treated as failure'),
			}),
			notes: 'On failure an alert asks the user to release the job at the printer.',
		},
		{
			name: 'papercut-cancel',
			method: 'POST',
			url: `${PAPERCUT_MOBILE_RELEASE_API}/held-jobs/cancel?username={username}`,
			format: 'text',
			source: ['source/lib/stoprint/api.js:132'],
			request: z
				.looseObject({'jobIds[]': z.string().describe('The held job id')})
				.describe(
					"application/x-www-form-urlencoded (arrayFormat 'bracket'), with an Origin header",
				),
			response: z.unknown(),
			notes:
				'The body is never read; only a 2xx status counts as success. On failure an alert is shown.',
		},
		{
			name: 'olecard-login',
			method: 'POST',
			url: 'https://www.stolaf.edu/apps/olecard/checkbalance/authenticate.cfm',
			format: 'html',
			source: ['source/lib/login.js:39', 'source/lib/financials/balances.js:63'],
			request: z
				.looseObject({username: z.string(), password: z.string()})
				.describe('multipart/form-data (FormData)'),
			response: z.string(),
			notes:
				"Two readers. Settings login (login.js) reads the page text: if it contains 'Password' the login failed, otherwise the credentials are saved; network failures retry up to 3 times. The balances refresh (balances.js) reads only the final URL after redirects: if it contains 'message=' the login failed. The session cookie is then used by olecard-balances.",
		},
		{
			name: 'olecard-balances',
			method: 'GET',
			url: 'https://www.stolaf.edu/apps/olecard/checkbalance/api.cfm',
			format: 'json',
			source: ['source/lib/financials/balances.js:72'],
			response: z.union([
				z.looseObject({error: z.string().min(1).describe('Shown as the error')}),
				z.looseObject({
					error: z.string().nullable().optional(),
					data: z.looseObject({
						accounts: z.array(olecardAccount),
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
				'Balances are cached for 5 minutes. A non-2xx or non-JSON answer throws, and nothing catches it: the balances refresh fails without an error message.',
		},
		{
			name: 'course-data-info',
			method: 'GET',
			url: `${COURSE_DATA}/info.json`,
			format: 'json',
			source: ['source/lib/course-search/update-course-storage.js:49'],
			response: z.looseObject({files: z.array(termFile)}),
			notes:
				'GitHub Pages of the separate StoDevX/course-data repository, not this one. On failure no terms are updated and cached courses stay.',
		},
		{
			name: 'course-data-term',
			method: 'GET',
			url: `${COURSE_DATA}/{path}`,
			format: 'json',
			source: ['source/lib/course-search/update-course-storage.js:61'],
			response: z.array(course),
			notes:
				'path comes from info.json files[].path. On failure the term is stored as an empty list.',
		},
		{
			name: 'course-data-filter-list',
			method: 'GET',
			url: `${COURSE_DATA}/data-lists/{list}.json`,
			params: {list: ['valid_gereqs', 'valid_departments']},
			format: 'json',
			source: ['source/lib/course-search/load-filter-options.js:24'],
			response: z.array(z.string()),
			notes:
				'Options for the GE and department filters, fetched each time the course search filters are built. On failure the release treats the list as empty, overwrites the stored list with it, and shows no options.',
		},
	],
}
