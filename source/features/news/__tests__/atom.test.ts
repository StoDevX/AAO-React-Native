import {readFileSync} from 'node:fs'
import {join} from 'node:path'
import {parseAtomFeed} from '../parsers/atom'

const fixture = readFileSync(join(__dirname, 'fixtures/atom.xml'), 'utf8')

function feed(entries: string): string {
	return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
	<title>Test feed</title>
	<link rel="self" href="https://example.test/feed/atom/" />
	<id>https://example.test/</id>
	<updated>2025-04-22T10:48:38Z</updated>
	${entries}
</feed>`
}

test('parses the live KRLX fixture into stories', () => {
	const stories = parseAtomFeed(fixture)
	expect(stories).toHaveLength(10)
})

test('parses a normal entry', () => {
	const stories = parseAtomFeed(
		feed(`
		<entry>
			<title type="html"><![CDATA[From the Archives]]></title>
			<link rel="alternate" type="text/html" href="https://content.krlx.org/2025/04/22/from-the-archives/" />
			<author><name>Matthew Sigmond</name></author>
			<published>2025-04-22T10:42:59Z</published>
			<updated>2025-04-22T10:43:56Z</updated>
			<category scheme="https://content.krlx.org" term="Uncategorized" />
			<summary type="html"><![CDATA[a short summary]]></summary>
			<content type="html"><![CDATA[<p>full post body</p>]]></content>
		</entry>
	`),
	)

	expect(stories).toHaveLength(1)
	const [story] = stories
	expect(story.title).toBe('From the Archives')
	expect(story.link).toBe('https://content.krlx.org/2025/04/22/from-the-archives/')
	expect(story.authors).toStrictEqual(['Matthew Sigmond'])
	expect(story.categories).toStrictEqual(['Uncategorized'])
	expect(story.excerpt).toBe('a short summary')
	expect(story.content).toBe('full post body')
	expect(story.datePublished).toBe('2025-04-22T10:42:59.000Z')
})

test('collects every author name when an entry has more than one', () => {
	const stories = parseAtomFeed(
		feed(`
		<entry>
			<title>Two authors</title>
			<id>https://content.krlx.org/a/</id>
			<updated>2025-04-22T10:43:56Z</updated>
			<author><name>Ada Lovelace</name></author>
			<author><name>Grace Hopper</name></author>
			<content type="text">body</content>
		</entry>
	`),
	)

	expect(stories[0].authors).toStrictEqual(['Ada Lovelace', 'Grace Hopper'])
})

test('falls back to Unknown Author when no author is present', () => {
	const stories = parseAtomFeed(
		feed(`
		<entry>
			<title>No author</title>
			<id>https://content.krlx.org/b/</id>
			<updated>2025-04-22T10:43:56Z</updated>
			<content type="text">body</content>
		</entry>
	`),
	)

	expect(stories[0].authors).toStrictEqual(['Unknown Author'])
})

test('uses updated when published is absent', () => {
	const stories = parseAtomFeed(
		feed(`
		<entry>
			<title>No published date</title>
			<id>https://content.krlx.org/c/</id>
			<updated>2025-04-22T10:43:56Z</updated>
			<content type="text">body</content>
		</entry>
	`),
	)

	expect(stories[0].datePublished).toBe('2025-04-22T10:43:56.000Z')
})

test('falls back to summary when content carries a src attribute', () => {
	const stories = parseAtomFeed(
		feed(`
		<entry>
			<title>External content</title>
			<id>https://content.krlx.org/d/</id>
			<updated>2025-04-22T10:43:56Z</updated>
			<summary type="text">the summary text</summary>
			<content type="text" src="https://content.krlx.org/external.html" />
		</entry>
	`),
	)

	expect(stories[0].content).toBe('the summary text')
})

test('falls back to (no content) when content is external and summary is absent', () => {
	const stories = parseAtomFeed(
		feed(`
		<entry>
			<title>Nothing to show</title>
			<id>https://content.krlx.org/e/</id>
			<updated>2025-04-22T10:43:56Z</updated>
			<content type="text" src="https://content.krlx.org/external.html" />
		</entry>
	`),
	)

	expect(stories[0].content).toBe('(no content)')
})

test('falls back to a truncated content when summary is absent', () => {
	// Mirrors the RSS parser's own fallback (see rss.test.ts): a feed
	// configured for full text only -- no <summary>, just <content> -- must
	// not render a blank excerpt just because it skipped the dedicated
	// excerpt field.
	const longContent = 'x'.repeat(250)
	const stories = parseAtomFeed(
		feed(`
		<entry>
			<title>No summary</title>
			<id>https://content.krlx.org/longcontent/</id>
			<updated>2025-04-22T10:43:56Z</updated>
			<content type="text">${longContent}</content>
		</entry>
	`),
	)

	expect(stories[0].excerpt).toHaveLength(201)
	expect(stories[0].excerpt).toBe('x'.repeat(200) + '…')
})

test('reads categories from the term attribute, not element text', () => {
	const stories = parseAtomFeed(
		feed(`
		<entry>
			<title>Categorised</title>
			<id>https://content.krlx.org/f/</id>
			<updated>2025-04-22T10:43:56Z</updated>
			<category term="Music">should not be used</category>
			<content type="text">body</content>
		</entry>
	`),
	)

	expect(stories[0].categories).toStrictEqual(['Music'])
})

test('does not mistake a rel="self" link for the entry link', () => {
	const stories = parseAtomFeed(
		feed(`
		<entry>
			<title>Self link first</title>
			<id>https://content.krlx.org/g/</id>
			<updated>2025-04-22T10:43:56Z</updated>
			<link rel="self" href="https://content.krlx.org/feed/atom/g/" />
			<link rel="alternate" href="https://content.krlx.org/g/" />
			<content type="text">body</content>
		</entry>
	`),
	)

	expect(stories[0].link).toBe('https://content.krlx.org/g/')
})

test('treats a link with no rel as alternate', () => {
	const stories = parseAtomFeed(
		feed(`
		<entry>
			<title>Unmarked link</title>
			<id>https://content.krlx.org/h/</id>
			<updated>2025-04-22T10:43:56Z</updated>
			<link href="https://content.krlx.org/h/" />
			<content type="text">body</content>
		</entry>
	`),
	)

	expect(stories[0].link).toBe('https://content.krlx.org/h/')
})

test('ignores an enclosure whose type is not an image', () => {
	const stories = parseAtomFeed(
		feed(`
		<entry>
			<title>Audio enclosure</title>
			<id>https://content.krlx.org/i/</id>
			<updated>2025-04-22T10:43:56Z</updated>
			<link rel="enclosure" type="audio/mpeg" href="https://content.krlx.org/audio.mp3" />
			<content type="text">body</content>
		</entry>
	`),
	)

	expect(stories[0].featuredImage).toBeUndefined()
})

test('uses an enclosure whose type is an image', () => {
	const stories = parseAtomFeed(
		feed(`
		<entry>
			<title>Image enclosure</title>
			<id>https://content.krlx.org/j/</id>
			<updated>2025-04-22T10:43:56Z</updated>
			<link rel="enclosure" type="image/jpeg" href="https://content.krlx.org/photo.jpg" />
			<content type="text">body</content>
		</entry>
	`),
	)

	expect(stories[0].featuredImage).toBe('https://content.krlx.org/photo.jpg')
})

test('skips an entry with an unparseable date while its siblings still come through', () => {
	const stories = parseAtomFeed(
		feed(`
		<entry>
			<title>Good entry</title>
			<id>https://content.krlx.org/k/</id>
			<updated>2025-04-22T10:43:56Z</updated>
			<content type="text">body</content>
		</entry>
		<entry>
			<title>Bad entry</title>
			<id>https://content.krlx.org/l/</id>
			<updated>not a date</updated>
			<content type="text">body</content>
		</entry>
	`),
	)

	expect(stories.map((s) => s.title)).toStrictEqual(['Good entry'])
})

test('throws when every entry in a non-empty feed is malformed', () => {
	expect(() =>
		parseAtomFeed(
			feed(`
		<entry>
			<title>Bad entry one</title>
			<id>https://content.krlx.org/m/</id>
			<updated>not a date</updated>
		</entry>
		<entry>
			<title>Bad entry two</title>
			<id>https://content.krlx.org/n/</id>
			<updated>also not a date</updated>
		</entry>
	`),
		),
	).toThrow()
})

test('returns an empty list when the feed legitimately has no entries', () => {
	expect(parseAtomFeed(feed(''))).toStrictEqual([])
})

test('strips html and trims titles and excerpts', () => {
	const stories = parseAtomFeed(
		feed(`
		<entry>
			<title type="html"><![CDATA[<b>Bold</b> title]]></title>
			<id>https://content.krlx.org/o/</id>
			<updated>2025-04-22T10:43:56Z</updated>
			<summary type="html"><![CDATA[  <p>an excerpt</p>  ]]></summary>
			<content type="text">body</content>
		</entry>
	`),
	)

	expect(stories[0].title).toBe('Bold title')
	expect(stories[0].excerpt).toBe('an excerpt')
})

test('throws when the response is not a string', () => {
	expect(() => parseAtomFeed({not: 'a string'})).toThrow()
})
