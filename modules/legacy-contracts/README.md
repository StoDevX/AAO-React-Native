# Legacy contracts

What the final build of each minor version from 2.0 to 2.7 expects from every
request it makes, read from its tagged source. Copies of these releases are
still installed, and they cannot be updated, so a server or data file they
read has to keep answering in the shape they expect.

| Release | Tag | Requests | Answered by |
| --- | --- | --- | --- |
| 2.0 | `v2.0.1` | 7 | Google Feed API, Oleville, Google Calendar, SIS |
| 2.1 | `v2.1.1` | 16 | GitHub Pages, BonApp, feeds, Google Calendar, SIS, OleCard |
| 2.2 | `v2.2.4` | 14 | GitHub Pages, BonApp, feeds, Google Calendar, Presence, SIS, OleCard |
| 2.3 | `v2.3.0-final` | 14 | GitHub Pages, BonApp, feeds, Google Calendar, stolaf.edu, SIS, OleCard |
| 2.4 | `v2.4.2` | 22 | GitHub Pages, BonApp, feeds, Google Calendar, stolaf.edu, SIS, OleCard |
| 2.5 | `v2.5.2` | 20 | GitHub Pages, BonApp, feeds, Google Calendar, stolaf.edu, OleCard |
| 2.6 | `v2.6.3` | 33 | ccc-server, PaperCut, OleCard, course-data Pages |
| 2.7 | `v2.7.0` | 33 | ccc-server, PaperCut, OleCard, course-data Pages |

`v2.3.0-final`'s package.json says `2.3.0-beta.7`, and `v2.1.1`'s says `2.1.2`.

Each release is a list of contracts (`types.ts`): the method and URL, with
`{name}` for a part filled in at runtime and `params` listing the values the
release fixes; where in the tagged tree the request is made; and a zod schema
of the response. A schema holds only what the release reads. Its objects are
loose, so a server may add fields, but a field it requires must stay, with the
type it gives. A `.describe()` on a field says how the release uses it, such as
the moment format it parses a date with, and `notes` say what the release does
when the request fails.

Scraped pages (SIS, OleCard) are `z.string()`, with the selectors and form
fields the release relies on in `notes`.

Left out: links opened in a browser or web view, audio and video streams,
images, analytics, and code nothing in the release calls, such as the
directory search in `lib/stalkernet.js`.

```ts
import {releases} from '@frogpond/legacy-contracts'

for (let release of releases) {
	for (let contract of release.contracts) {
		if (!contract.url.startsWith('https://stolaf.api.frogpond.tech/v1')) {
			continue
		}
		// fill in contract.params, fetch, then contract.response.safeParse(body)
	}
}
```
