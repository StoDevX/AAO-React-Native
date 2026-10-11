import {z} from 'zod'

import type {Release} from '../types'

/** One entry of a Google Feed API `feed.entries` array, as the news tab reads it. */
const googleFeedEntry = z.looseObject({
	title: z.string().describe('HTML-entity-encoded; decoded and shown as the row title'),
	contentSnippet: z.string().describe('HTML-entity-encoded; decoded and shown as the row preview'),
	content: z.string().describe('HTML body, interpolated into the story WebView page'),
})

/** A Google Calendar event time: the code reads `date || dateTime`. */
const googleCalendarTime = z
	.looseObject({
		date: z.string().optional().describe('YYYY-MM-DD for all-day events; parsed with moment()'),
		dateTime: z.string().optional().describe('RFC 3339 timestamp; parsed with moment()'),
	})
	.describe('At least one of date or dateTime must be present')

/** The final 2.0 build, tagged v2.0.1. */
export const release: Release = {
	tag: 'v2.0.1',
	version: '2.0.1',
	contracts: [
		{
			name: 'news-google-feed',
			method: 'GET',
			url: 'https://ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=-1&q={feed}',
			params: {
				feed: [
					'https://wp.stolaf.edu/feed',
					'http://oleville.com/politicole/feed',
					'http://manitoumessenger.com/feed',
				],
			},
			format: 'json',
			source: ['views/news/news-container.js:47', 'views/news/tabs.js:12'],
			response: z.looseObject({
				responseData: z.looseObject({
					feed: z.looseObject({
						entries: z.array(googleFeedEntry),
					}),
				}),
			}),
			notes:
				'Each News tab (St. Olaf, PoliticOle, Mess) fetches its RSS feed through the Google Feed API; the feed URL is appended unencoded as q. Google shut this API down in December 2016, so this release can no longer load news. On failure it sets an error flag that render ignores and shows an empty list; there is no bundled fallback.',
		},
		{
			name: 'oleville-posts',
			method: 'GET',
			url: 'http://oleville.com/wp-json/wp/v2/posts?per_page=5',
			format: 'json',
			source: ['views/oleville/index.js:92'],
			response: z.array(
				z.looseObject({
					featured_media: z
						.number()
						.optional()
						.describe(
							'Media id; a falsy value skips the media request and leaves the row without an image',
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
				'WordPress REST API v2 over plain http. On failure (including any failed media lookup, since they are awaited together with Promise.all) the view shows an empty list; no bundled fallback.',
		},
		{
			name: 'oleville-media',
			method: 'GET',
			url: 'http://oleville.com/wp-json/wp/v2/media/{id}',
			format: 'json',
			source: ['views/oleville/index.js:76'],
			response: z.looseObject({
				media_details: z.looseObject({
					sizes: z.looseObject({
						medium: z.looseObject({
							source_url: z
								.string()
								.describe(
									'Image URL shown behind the post title; a falsy value falls back to the bundled-URL Oleville logo',
								),
						}),
					}),
				}),
			}),
			notes:
				'One request per post with a truthy featured_media, id taken from oleville-posts. media_details.sizes.medium is read without a guard: a missing medium size throws, which fails the whole Oleville list (empty list shown).',
		},
		{
			name: 'google-calendar-events',
			method: 'GET',
			url: 'https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events?maxResults=50&orderBy=startTime&showDeleted=false&singleEvents=true&timeMin={timeMin}&key={key}',
			params: {
				calendarId: [
					'le6tdd9i38vgb7fcmha0hu66u9gjus2e%40import.calendar.google.com',
					'stolaf.edu_fvulqo4larnslel75740vglvko@group.calendar.google.com',
				],
			},
			format: 'json',
			source: ['views/calendar/calendar.js:82', 'views/calendar/tabs.js:10'],
			response: z.looseObject({
				error: z
					.looseObject({
						message: z.string().optional(),
					})
					.optional()
					.describe('When present, its message is shown in place of the list'),
				items: z
					.array(
						z.looseObject({
							summary: z.string().describe('HTML; parsed and its text shown as the event title'),
							start: googleCalendarTime,
							end: googleCalendarTime,
							location: z.string().optional(),
						}),
					)
					.optional(),
			}),
			notes:
				"Calls Google Calendar API v3 directly. The Master Events id is written pre-encoded (%40) and the Oleville Events id with a literal @; neither is re-encoded when placed in the path. timeMin is new Date().toISOString(); key is GOOGLE_CALENDAR_API_KEY from the build's .env.js. A thrown fetch or JSON error shows its message as text; there is no bundled fallback.",
		},
		{
			name: 'sis-financials',
			method: 'GET',
			url: 'https://www.stolaf.edu/sis/st-financials.cfm',
			format: 'html',
			source: ['lib/financials.js:50'],
			response: z.string(),
			notes:
				'Sent with the session cookie (JSESSIONID) left by the SIS login WebView (https://www.stolaf.edu/sis/login.cfm); only made when AsyncStorage credentials:valid is true and the device is online, at most once a minute unless refreshed. A final response URL starting with https://www.stolaf.edu/sis/landing-page.cfm means signed out. Scrape: css-select `.sis-money`, last three matches in order flex, ole, print; each text has `$` removed and `.` dropped, then parseInt gives cents (NaN becomes null). On a network error all three balances are null; the last values stay cached in AsyncStorage.',
		},
		{
			name: 'sis-courses-terms',
			method: 'GET',
			url: 'https://www.stolaf.edu/sis/st-courses.cfm',
			format: 'html',
			source: ['lib/courses.js:95'],
			response: z.string(),
			notes:
				'Sent with the SIS WebView session cookie, only when credentials:valid is true, at most once an hour. A final URL starting with https://www.stolaf.edu/sis/landing-page.cfm means signed out. Scrape: every `[name=stnum]` element\'s value attribute (none throws "no student number!", differing values throw "multiple student numbers!"); the first `[name=searchyearterm]` element\'s child <option> tags give the term list via Number(value). A thrown error shows "Error: <message>" in the Courses tab.',
		},
		{
			name: 'sis-courses-term',
			method: 'POST',
			url: 'https://www.stolaf.edu/sis/st-courses.cfm',
			format: 'html',
			source: ['lib/courses.js:110'],
			request: z
				.looseObject({
					stnum: z.string().describe('Student number scraped from sis-courses-terms'),
					searchyearterm: z
						.number()
						.describe('Term code such as 20163, from the searchyearterm options'),
				})
				.describe('multipart/form-data (React Native FormData)'),
			response: z.string(),
			notes:
				'One POST per term from sis-courses-terms, with the SIS WebView session cookie. Landing-page redirect means signed out. Scrape: the first `[name=CLBIDLIST]` value attribute, split on commas into numbers (missing throws and the Courses tab shows the error); rows are `tr.sis-line1, tr.sis-line2`, whose tag children are read positionally as deptnum, lab ("L" means lab), name, halfsemester, credits (Number), gradeOption, gereqs, times, locations, instructors (the last three: child nodes\' text, trimmed, blanks dropped). deptnum must match /(([A-Z]+)(?=\\/)(?:\\/)([A-Z]+)|[A-Z]+) *([0-9]{3,}) *([A-Z]?)/i, or that term shows a single error row. A network error yields an empty term.',
		},
	],
}
