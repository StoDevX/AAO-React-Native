import {z} from 'zod'

import type {Release} from '../types'

const API_ROOT = 'https://stolaf.api.frogpond.tech/v1'
const PAPERCUT_API = 'https://papercut.stolaf.edu/rpc/api/rest/internal'
const PAPERCUT_MOBILE_RELEASE_API = `${PAPERCUT_API}/mobilerelease/api`

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
	name: z.string().describe('List key, title, and the value stored as a favorite'),
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
	isNotice: z.boolean().optional().describe('true hides the open/closed badge'),
	noticeMessage: z
		.string()
		.optional()
		.describe('Shown under the name; with isNotice it replaces the hours lines'),
	schedule: z
		.array(
			z.looseObject({
				title: z
					.string()
					.describe(
						"Label in the row and upper-cased section header on the detail screen; 'Hours' hides the label in the list",
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
		.describe('A missing or empty schedule shows "Hours unknown"'),
})

/** A dietary (COR) icon, keyed by its id in a cor-icon map. */
const corIcon = z.looseObject({
	label: z
		.string()
		.describe(
			'HTML-entity-encoded; decoded and shown as the dietary filter title and on the item detail',
		),
	image: z.string().optional().describe('Icon image URL'),
	description: z
		.string()
		.optional()
		.describe('HTML; its text is shown as the dietary filter detail'),
})

/** A map of cor-icon id to icon. */
const corIconMap = z.record(z.string(), corIcon)

/** An item's own dietary tags: a map whose keys index the cor-icon map, or an empty array. */
const itemCorIcons = z
	.union([z.record(z.string(), z.string()), z.array(z.unknown())])
	.optional()
	.describe('Keys are looked up in the menu-level cor-icon map; an array shows no tags')

/** One line of an item's nutrition detail. */
const nutritionDetail = z.looseObject({
	label: z.string(),
	value: z.union([z.number(), z.string()]),
	unit: z.string().describe("Calls .includes('lessthan'); e.g. 'g', 'mg', 'lessthang'"),
})

/** A BonApp menu item, keyed by its id in `items`. */
const bonAppItem = z.looseObject({
	label: z
		.string()
		.describe('Whitespace-collapsed, trailing (…) removed, title-cased, entity-decoded'),
	station: z
		.string()
		.describe(
			"HTML like '<strong>@grill</strong>'; trimmed, title-cased, and matched against station labels",
		),
	description: z.string().optional().describe('HTML; its text is shown under the label'),
	special: z
		.union([z.boolean(), z.number(), z.string()])
		.optional()
		.describe('Truthy marks a special'),
	cor_icon: itemCorIcons,
	nutrition_details: z
		.union([z.record(z.string(), nutritionDetail), z.array(z.unknown())])
		.optional()
		.describe('Shown on the item detail when it has more than one key'),
})

/** A station of a BonApp meal. */
const bonAppStation = z.looseObject({
	label: z.string().describe('Station name; title-cased and shown as a section header'),
	note: z.string().optional().describe('Shown as the section subtitle'),
	items: z.array(z.string()).describe('Keys into the response `items` map'),
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
		.array(bonAppStation)
		.describe('Ignored for the Cage, whose stations are rebuilt from items'),
})

/** What the BonApp menu screen reads from a menu response. */
const bonAppMenu = z.looseObject({
	cor_icons: corIconMap,
	days: z
		.array(
			z.looseObject({
				cafe: z.looseObject({
					dayparts: z
						.array(z.array(bonAppDaypart))
						.min(1)
						.describe(
							'Only dayparts[0] is read; an empty inner array shows a single all-day "Menu" built from items',
						),
				}),
			}),
		)
		.min(1)
		.describe('Only days[0] is read'),
	items: z.record(z.string(), bonAppItem).describe('An empty map shows "No items were found."'),
})

/** What the BonApp menu screen reads from a cafe response. */
const bonAppCafe = z.looseObject({
	cafe: z.looseObject({
		days: z.array(
			z.looseObject({
				date: z
					.string()
					.describe(
						"'YYYY-MM-DD'; the day matching today (Central) is used, none means 'Closed today'",
					),
				status: z
					.string()
					.optional()
					.describe("'closed' shows `message` (or 'Closed today') instead of the menu"),
				message: z.union([z.string(), z.literal(false)]).optional(),
			}),
		),
	}),
})

/** A calendar event as the event list, row and detail screens read it. */
const calendarEventFields = {
	title: z.string().describe('HTML stripped with a regex for the row; shown as the detail title'),
	description: z.string().describe('Trimmed and shown on the detail screen'),
	location: z.string().describe('Trimmed and shown on the detail screen'),
	startTime: z.string().describe('ISO 8601; parsed with moment()'),
	endTime: z.string().describe('ISO 8601; parsed with moment()'),
	isOngoing: z.boolean().optional().describe("Truthy groups the event under 'Ongoing'"),
	links: z.array(z.string()).describe('Read without a guard by the Android detail view'),
}

/** A news story from the server's normalized news feeds. */
const newsStory = z.looseObject({
	title: z.string().describe('List key and row title'),
	excerpt: z.string().describe('Calls .trim(); stories with a blank excerpt are hidden'),
	content: z.string().describe("Calls .includes('<form'); stories containing a form are hidden"),
	link: z.string().optional().nullable().describe('Opened in the browser; missing shows an alert'),
	featuredImage: z
		.string()
		.optional()
		.nullable()
		.describe('Thumbnail URL; falls back to the bundled source image'),
})

/** A Help screen tool. */
const helpTool = z.looseObject({
	key: z
		.string()
		.describe("'wifi' selects the custom Wi-Fi report tool; anything else is a generic tool"),
	title: z.string(),
	body: z.string().describe('Markdown'),
	enabled: z
		.boolean()
		.optional()
		.describe('Anything but true shows the tool disabled with `message`'),
	hidden: z.boolean().optional(),
	message: z.string().optional(),
	versionRange: z
		.string()
		.optional()
		.describe('semver range checked against the app version 2.6.3'),
	errorMessage: z.string().optional().describe('Read by the Wi-Fi tool when its report fails'),
	buttons: z
		.array(
			z.looseObject({
				title: z.string(),
				enabled: z.boolean().optional(),
				action: z
					.string()
					.describe(
						"One of 'open-url', 'send-email', 'call-phone', 'custom'; anything else does nothing when pressed",
					),
				params: z
					.looseObject({
						url: z
							.string()
							.optional()
							.describe("open-url, and the Wi-Fi tool's 'custom' report URL"),
						number: z.string().optional().describe('call-phone'),
						to: z
							.union([z.string(), z.array(z.string())])
							.optional()
							.describe('send-email'),
						cc: z.union([z.string(), z.array(z.string())]).optional(),
						bcc: z.union([z.string(), z.array(z.string())]).optional(),
						subject: z.string().optional(),
						body: z.string().optional(),
					})
					.describe('Read only when the button is pressed'),
			}),
		)
		.describe('Required by generic tools (mapped without a guard); the Wi-Fi tool guards it'),
})

/** A PaperCut printer. */
const printer = z.looseObject({
	printerName: z.string().describe('List key, title, and the name sent back to release a job'),
	location: z
		.string()
		.optional()
		.describe(
			"Groups the list; '<BUILDING> <number>…' groups by the building word, missing groups under 'Unknown Building'",
		),
})

/** A PaperCut print job from the job status list. */
const printJob = z.looseObject({
	id: z
		.union([z.string(), z.number()])
		.describe('Calls .toString(); matched as a prefix of the held-job id'),
	documentName: z.string(),
	usageTimeFormatted: z
		.string()
		.describe("Parsed strictly with moment.tz(…, 'h:mm:ss A') to show when it expires"),
	usageCostFormatted: z.string(),
	totalPages: z.number().describe('Calls .toString()'),
	statusFormatted: z
		.string()
		.optional()
		.describe(
			"Groups the list ('Other' when missing); 'Pending Release' opens the printer picker, 'Sent to Printer' shows the printer",
		),
	grayscaleFormatted: z.string().describe("'No' limits the printer picker to color printers"),
	paperSizeFormatted: z.string(),
	printerName: z.string().optional(),
})

/** A course as the course search list, filters and detail screen read it. */
const course = z.looseObject({
	name: z.string().describe('Calls .toLowerCase() when searching'),
	title: z.string().optional(),
	department: z.string(),
	number: z.union([z.number(), z.string()]),
	section: z.string().optional(),
	term: z.number().describe('Groups results; e.g. 20181'),
	level: z.number().describe('Filtered against 100, 200, 300'),
	enrolled: z.number().describe('Compared with `max` to compute spaceAvailable'),
	max: z.number(),
	status: z.string().describe("'O' is open; anything else is closed"),
	type: z.string().describe("'Lab' matches the labs-only filter"),
	instructors: z.array(z.string()).optional(),
	gereqs: z.array(z.string()).optional(),
	notes: z.array(z.string()).optional(),
	description: z.array(z.string()).optional().describe('Only the first element is shown'),
	pn: z.boolean().optional(),
	prerequisites: z.union([z.string(), z.literal(false)]).optional(),
	credits: z.number().optional(),
	offerings: z
		.array(
			z.looseObject({
				day: z.string().describe('Two-letter day code (Mo Tu We Th Fr)'),
				start: z.string().describe("Parsed with moment.tz(…, 'H:mm')"),
				end: z.string().describe("Parsed with moment.tz(…, 'H:mm')"),
				location: z.string(),
			}),
		)
		.optional(),
})

/** The final 2.6 build, tagged v2.6.3. */
export const release: Release = {
	tag: 'v2.6.3',
	version: '2.6.3',
	contracts: [
		{
			name: 'building-hours',
			method: 'GET',
			url: `${API_ROOT}/spaces/hours`,
			format: 'json',
			source: ['source/views/building-hours/stateful-list.js:95'],
			response: z.looseObject({data: z.array(building)}),
			notes:
				'On a failed request the release uses its bundled copy of data/building-hours. Chapel times come from the bundled docs/chapel.json, not the network.',
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
						accentColor: z
							.tuple([z.number(), z.number(), z.number()])
							.describe('RGB components of the gradient'),
						textColor: z.string(),
						thumbnail: z.string().optional().describe('Key into the bundled webcam images'),
						thumbnailUrl: z.string().optional().describe('Preferred over `thumbnail` when present'),
					}),
				),
			}),
			notes: 'On a failed request the release uses its bundled copy of data/webcams.',
		},
		{
			name: 'streams-upcoming',
			method: 'GET',
			url: `${API_ROOT}/streams/upcoming?dateFrom={dateFrom}&dateTo={dateTo}&sort=ascending`,
			format: 'json',
			source: ['source/views/streaming/streams/list.js:84'],
			response: z.array(
				z.looseObject({
					eid: z.string().describe('List key'),
					title: z.string().describe('HTML; its text is the row title'),
					category: z.string().describe("Title-cased; 'athletics' streams are dropped"),
					status: z
						.string()
						.describe("Calls .toLowerCase(); 'live' groups under Live, 'archived' hides the time"),
					starttime: z.string().describe('Parsed with moment(); groups by day'),
					player: z.string().describe('Opened in the browser on tap'),
					subtitle: z.string().optional().nullable(),
					performer: z.string().optional().nullable(),
					thumb: z.string().optional().describe('Thumbnail image URL'),
				}),
			),
			notes:
				"dateFrom is today and dateTo two months later, both 'YYYY-MM-DD' in Central time; query-string sorts the keys. A failed request shows an error notice.",
		},
		{
			name: 'student-orgs',
			method: 'GET',
			url: `${API_ROOT}/orgs`,
			format: 'json',
			source: ['source/views/student-orgs/list.js:98'],
			response: z.array(
				z.looseObject({
					name: z
						.string()
						.describe("Calls .replace(); a leading 'St. Olaf' or 'The' is dropped for sorting"),
					category: z.string().describe('Shown in the row; lower-cased when searching'),
					description: z
						.string()
						.describe('Lower-cased when searching; entity-decoded on the detail screen'),
					meetings: z.string().optional(),
					website: z.string().optional(),
					contacts: z.array(
						z.looseObject({
							firstName: z.string().describe('Calls .trim()'),
							lastName: z.string().describe('Calls .trim()'),
							email: z.string(),
							title: z.string().optional(),
						}),
					),
					advisors: z.array(z.looseObject({name: z.string(), email: z.string()})),
					lastUpdated: z.string().describe("Parsed with moment(…, 'MMMM, DD YYYY HH:mm:ss')"),
				}),
			),
			notes:
				'A bare array, not wrapped in `data`. A failed request shows "No organizations found."',
		},
		{
			name: 'student-jobs',
			method: 'GET',
			url: `${API_ROOT}/jobs`,
			format: 'json',
			source: ['source/views/sis/student-work/index.js:59'],
			response: z.array(
				z.looseObject({
					id: z.union([z.string(), z.number()]).describe('Put in the shared stuwork URL'),
					type: z.string().describe('Title-cased; groups the list'),
					title: z.string().describe('HTML stripped with a regex'),
					office: z.string().describe('HTML stripped with a regex'),
					hoursPerWeek: z
						.string()
						.describe("HTML stripped with a regex; 'Full-time' drops the hrs/week suffix"),
					lastModified: z.string().optional().describe("Parsed with moment(…, 'YYYY/MM/DD')"),
					contactName: z.string().optional(),
					contactEmail: z.string().optional(),
					contactPhone: z.string().optional(),
					timeOfHours: z.union([z.string(), z.number()]).optional(),
					openPositions: z.union([z.string(), z.number()]).optional(),
					year: z.string().optional(),
					goodForIncomingStudents: z.boolean().optional(),
					description: z.string().optional(),
					skills: z.string().optional(),
					comments: z.string().optional(),
					howToApply: z.string().optional(),
					timeline: z.string().optional(),
				}),
			),
			notes:
				'A bare array, not wrapped in `data`. A failed request shows "Could not get open jobs."',
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
						word: z.string().describe('First character groups the list'),
						definition: z.string().describe('Markdown'),
					}),
				),
			}),
			notes: 'On a failed request the release uses its bundled copy of data/dictionary.',
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
						title: z.string().describe('List key'),
						synopsis: z.string(),
						category: z.string().describe('Groups the list'),
						text: z.string().describe('Markdown'),
						buttonText: z.string(),
						phoneNumber: z.string().optional(),
						buttonLink: z.string().optional().describe('Opened instead of calling when present'),
						image: z.string().optional().describe('Key into the bundled contact images'),
					}),
				),
			}),
			notes: 'On a failed request the release uses its bundled copy of data/contact-info.',
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
						name: z.string().describe('List key'),
						synopsis: z.string(),
						category: z.string().describe('Groups the list'),
						description: z.string().describe('Markdown'),
						url: z.string().describe('Opened by More Info'),
					}),
				),
			}),
			notes: 'On a failed request the release uses its bundled copy of data/transportation.',
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
							.describe(
								"Matched exactly against 'Express Bus', 'Red Line', 'Blue Line', 'Oles Go'; a missing line shows a notice",
							),
						colors: z.looseObject({bar: z.string(), dot: z.string()}),
						notice: z.string().optional(),
						schedules: z.array(
							z.looseObject({
								days: z.array(z.string()).describe('Two-letter day codes (Su Mo Tu We Th Fr Sa)'),
								stops: z.array(z.string()),
								coordinates: z
									.record(z.string(), z.tuple([z.number(), z.number()]))
									.describe('Keyed by stop name; [lat, lng] for the map'),
								times: z
									.array(z.array(z.union([z.string(), z.literal(false)])))
									.describe(
										"One row per bus run, one column per stop; parsed strictly as 'h:mma', false for a skipped stop",
									),
							}),
						),
					}),
				),
			}),
			notes: 'On a failed request the release uses its bundled copy of data/bus-times.',
		},
		{
			name: 'faqs',
			method: 'GET',
			url: `${API_ROOT}/faqs`,
			format: 'json',
			source: ['source/views/faqs/index.js:47'],
			response: z.looseObject({text: z.string().describe('Markdown')}),
			notes: "On a failed request the screen shows 'There was a problem loading the FAQs'.",
		},
		{
			name: 'help-tools',
			method: 'GET',
			url: `${API_ROOT}/tools/help`,
			format: 'json',
			source: ['source/lib/cache.js:193'],
			response: z.looseObject({data: z.array(helpTool)}),
			notes:
				'Cached for an hour in AsyncStorage. Offline, the release uses the cache or its bundled copy of data/help; online, a failed request keeps the tools already loaded (none on first open, which shows "No tools are enabled.").',
		},
		{
			name: 'bonapp-menu-named',
			method: 'GET',
			url: `${API_ROOT}/food/named/menu/{cafe}`,
			params: {cafe: ['stav-hall', 'the-cage', 'burton', 'ldc', 'weitz', 'sayles']},
			format: 'json',
			source: ['source/views/menus/menu-bonapp.js:113'],
			response: bonAppMenu,
			notes:
				'Requested alongside bonapp-cafe-named, each retried 3 times. A failure shows an error with a retry button; an HTML response shows "Something between you and BonApp is having problems". burton, ldc, weitz and sayles are Carleton cafes.',
		},
		{
			name: 'bonapp-cafe-named',
			method: 'GET',
			url: `${API_ROOT}/food/named/cafe/{cafe}`,
			params: {cafe: ['stav-hall', 'the-cage', 'burton', 'ldc', 'weitz', 'sayles']},
			format: 'json',
			source: ['source/views/menus/menu-bonapp.js:114'],
			response: bonAppCafe,
			notes: 'Requested alongside bonapp-menu-named; either failing shows the error screen.',
		},
		{
			name: 'bonapp-menu-by-id',
			method: 'GET',
			url: `${API_ROOT}/food/menu/{cafeId}`,
			format: 'json',
			source: ['source/views/menus/menu-bonapp.js:113'],
			response: bonAppMenu,
			notes:
				'Only from the BonApp picker tab, which exists in dev and pre-release (alpha/beta/rc) builds; the cafe id is typed by the user.',
		},
		{
			name: 'bonapp-cafe-by-id',
			method: 'GET',
			url: `${API_ROOT}/food/cafe/{cafeId}`,
			format: 'json',
			source: ['source/views/menus/menu-bonapp.js:114'],
			response: bonAppCafe,
			notes: 'Only from the dev/pre-release BonApp picker; see bonapp-menu-by-id.',
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
								station: z.string().describe("Matched against a station's label"),
								special: z.boolean().optional(),
								description: z.string().optional(),
								cor_icon: itemCorIcons,
							}),
						)
						.optional(),
					stationMenus: z
						.array(
							z.looseObject({
								label: z.string(),
								note: z.string().optional(),
							}),
						)
						.optional(),
					corIcons: corIconMap.optional(),
				}),
			}),
			notes:
				'Not the BonApp shape: the data/pause-menu file wrapped in `data`. On a failed request (or a missing `data`) the release uses its bundled copy.',
		},
		{
			name: 'news-named',
			method: 'GET',
			url: `${API_ROOT}/news/named/{source}`,
			params: {source: ['stolaf', 'oleville', 'mess', 'politicole', 'ksto']},
			format: 'json',
			source: ['source/views/news/news-container.js:50'],
			response: z.array(newsStory),
			notes:
				'A bare array of stories already normalized by the server. A failed request shows "Error: <message>". The /news/rss and /news/wpjson branches exist in the code but no screen in this release uses them.',
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
						subtitle: z
							.string()
							.describe(
								"Name of the event field shown as the row subtitle: 'location' or 'description'",
							),
						startTime: z.boolean().optional().describe('Truthy shows the start time in the row'),
						endTime: z.boolean().optional().describe('Truthy shows the end time in the row'),
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
							startTime: z.boolean().optional().describe('Truthy shows the start time in the row'),
							endTime: z.boolean().optional().describe('Truthy shows the end time in the row'),
						})
						.optional()
						.describe("Spread into a new config whose subtitle is forced to 'description'"),
				}),
			),
			notes:
				'The same endpoint as calendar-named, read by the KSTO and KRLX show schedules. A failed request shows an empty list.',
		},
		{
			name: 'printing-color-printers',
			method: 'GET',
			url: `${API_ROOT}/printing/color-printers`,
			format: 'json',
			source: ['source/lib/stoprint/api.js:101'],
			response: z.looseObject({
				data: z.looseObject({
					colorPrinters: z
						.array(z.string())
						.describe('Printer names matched against PaperCut printerName'),
				}),
			}),
			notes: 'Fetched with the PaperCut printer lists; a failure shows the stoPrint error screen.',
		},
		{
			name: 'papercut-login',
			method: 'POST',
			url: `${PAPERCUT_API}/webclient/users/{username}/log-in?nocache={now}`,
			format: 'json',
			source: ['source/lib/stoprint/api.js:30'],
			request: z
				.looseObject({
					password: z.string().describe('base64 of the password'),
				})
				.describe(
					'application/x-www-form-urlencoded, with an Origin: https://papercut.stolaf.edu header',
				),
			response: z.looseObject({
				success: z
					.boolean()
					.describe('Falsy reports "Your username or password appear to be invalid."'),
			}),
			notes:
				'Made before every printer and job refresh, with the St. Olaf credentials from the keychain; `now` is Date.now(). A failed request reports "The print server seems to be having some issues."',
		},
		{
			name: 'papercut-jobs',
			method: 'GET',
			url: `${PAPERCUT_API}/webclient/users/{username}/jobs/status`,
			format: 'json',
			source: ['source/lib/stoprint/api.js:58'],
			response: z.looseObject({jobs: z.array(printJob)}),
			notes:
				'Relies on the session from papercut-login. A failure shows the stoPrint error screen.',
		},
		{
			name: 'papercut-all-printers',
			method: 'GET',
			url: `${PAPERCUT_MOBILE_RELEASE_API}/all-printers?username={username}`,
			format: 'json',
			source: ['source/lib/stoprint/api.js:71'],
			response: z.array(printer),
			notes: 'A failure shows the stoPrint error screen.',
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
			notes: 'A failure shows the stoPrint error screen.',
		},
		{
			name: 'papercut-held-jobs',
			method: 'GET',
			url: `${PAPERCUT_MOBILE_RELEASE_API}/held-jobs/?username={username}&printerName=printers%5C{printerName}`,
			format: 'json',
			source: ['source/lib/stoprint/api.js:116'],
			response: z.array(
				z.looseObject({
					id: z.string().describe("Calls .startsWith(); matched against the print job's id"),
				}),
			),
			notes:
				'printerName is interpolated without encoding. A failure or no matching job shows a general error alert.',
		},
		{
			name: 'papercut-release-job',
			method: 'POST',
			url: `${PAPERCUT_MOBILE_RELEASE_API}/held-jobs/release?username={username}`,
			format: 'json',
			source: ['source/lib/stoprint/api.js:163'],
			request: z
				.looseObject({
					printerName: z.string().describe("'printers\\<printerName>'"),
					'jobIds[]': z.string().describe('The held-job id'),
				})
				.describe(
					'application/x-www-form-urlencoded (query-string arrayFormat bracket), Origin: https://papercut.stolaf.edu',
				),
			response: z.looseObject({
				numJobsReleased: z.number().optional().describe('0 is reported as a failure'),
			}),
			notes: 'A failure shows an "Error Releasing Job" alert.',
		},
		{
			name: 'papercut-cancel-job',
			method: 'POST',
			url: `${PAPERCUT_MOBILE_RELEASE_API}/held-jobs/cancel?username={username}`,
			format: 'text',
			source: ['source/lib/stoprint/api.js:132'],
			request: z
				.looseObject({
					'jobIds[]': z.string().describe('The held-job id'),
				})
				.describe(
					'application/x-www-form-urlencoded (query-string arrayFormat bracket), Origin: https://papercut.stolaf.edu',
				),
			response: z.unknown().describe('Not read; only a 2xx status matters'),
			notes: 'A non-2xx status or network failure shows an "Error Cancelling Job" alert.',
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
				"Logging in (login.js) treats a page containing the text 'Password' as bad credentials, and retries a 'Network request failed' up to 3 times when validating stored credentials. Before reading balances (balances.js), a final response URL containing 'message=' means the login failed. The session cookie is then used by olecard-balances. A network error during the balances login is not caught.",
		},
		{
			name: 'olecard-balances',
			method: 'GET',
			url: 'https://www.stolaf.edu/apps/olecard/checkbalance/api.cfm',
			format: 'json',
			source: ['source/lib/financials/balances.js:72'],
			response: z.union([
				z.looseObject({
					error: z.string().min(1).describe('A non-empty error is shown as the balances error'),
				}),
				z.looseObject({
					error: z.string().optional().nullable(),
					data: z.looseObject({
						accounts: z.array(
							z.looseObject({
								account: z
									.string()
									.describe(
										"Matched against 'STO Flex', 'STO Ole Dollars', 'STO Student Printing'",
									),
								formatted: z.string().describe('Shown as the balance'),
							}),
						),
						meals: z
							.looseObject({
								leftDaily: z.union([z.string(), z.number()]).optional().nullable(),
								leftWeekly: z.union([z.string(), z.number()]).optional().nullable(),
								plan: z.string().optional().nullable(),
							})
							.optional()
							.nullable(),
					}),
				}),
			]),
			notes:
				'Relies on the session cookie from olecard-login. Balances are cached for 5 minutes; a missing account shows N/A.',
		},
		{
			name: 'wifi-report',
			method: 'POST',
			url: 'https://www.stolaf.edu/apps/all-about-olaf/wifi/index.cfm?fuseaction=Submit',
			format: 'text',
			source: ['source/views/help/wifi-tools.js:46'],
			request: z
				.looseObject({
					version: z.literal(1),
					position: z
						.looseObject({
							coords: z
								.looseObject({})
								.describe('Geolocation coordinates from navigator.geolocation'),
							timestamp: z.number(),
						})
						.nullable()
						.describe('null when location is unavailable'),
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
				.describe('A JSON string body, with no Content-Type set'),
			response: z.unknown().describe('Not read; only a 2xx status matters'),
			notes:
				"The URL is the default; when the help-tools 'wifi' tool's first button has action 'custom', its params.url is used instead. Retried 10 times; failure shows the tool's errorMessage or a generic apology.",
		},
		{
			name: 'course-data-info',
			method: 'GET',
			url: 'https://stodevx.github.io/course-data/info.json',
			format: 'json',
			source: ['source/lib/course-search/update-course-storage.js:49'],
			response: z.looseObject({
				files: z.array(
					z.looseObject({
						type: z.string().describe("Only 'json' entries are used"),
						year: z.number().describe('Only years after five years ago are used'),
						term: z
							.number()
							.describe('e.g. 20181; compared with cached terms and shown as a filter'),
						hash: z.string().describe('A change re-downloads that term'),
						path: z
							.string()
							.describe('Appended to https://stodevx.github.io/course-data/ to fetch the term'),
					}),
				),
			}),
			notes:
				'From the separate StoDevX/course-data GitHub Pages site, not this repository. A failed request is treated as no terms.',
		},
		{
			name: 'course-data-term',
			method: 'GET',
			url: 'https://stodevx.github.io/course-data/{path}',
			format: 'json',
			source: ['source/lib/course-search/update-course-storage.js:61'],
			response: z.array(course),
			notes:
				'path comes from course-data-info. The courses are stored in AsyncStorage; a failed request stores an empty term.',
		},
		{
			name: 'course-data-filter-lists',
			method: 'GET',
			url: 'https://stodevx.github.io/course-data/data-lists/{list}.json',
			params: {list: ['valid_gereqs', 'valid_departments']},
			format: 'json',
			source: ['source/lib/course-search/load-filter-options.js:24'],
			response: z
				.array(z.string())
				.describe('GE codes or department codes offered as course filters'),
			notes: 'A failed request yields an empty list, which replaces the stored one.',
		},
	],
}
