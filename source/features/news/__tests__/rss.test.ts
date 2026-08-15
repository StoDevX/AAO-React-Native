import {readFileSync} from 'node:fs'
import {join} from 'node:path'
import {parseRssFeed} from '../parsers/rss'

const fixture = readFileSync(join(__dirname, 'fixtures/rss.xml'), 'utf8')

function feed(items: string): string {
	return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
	xmlns:content="http://purl.org/rss/1.0/modules/content/"
	xmlns:dc="http://purl.org/dc/elements/1.1/">
<channel>
	<title>Test feed</title>
	<link>https://example.test</link>
	<description>a feed</description>
	${items}
</channel>
</rss>`
}

test('parses the live KRLX fixture into stories', () => {
	const stories = parseRssFeed(fixture)
	expect(stories).toHaveLength(10)
})

test('parses a normal item', () => {
	const stories = parseRssFeed(
		feed(`
		<item>
			<title>From the Archives</title>
			<link>https://content.krlx.org/2025/04/22/from-the-archives/</link>
			<dc:creator><![CDATA[Matthew Sigmond]]></dc:creator>
			<pubDate>Tue, 22 Apr 2025 10:42:59 +0000</pubDate>
			<category><![CDATA[Uncategorized]]></category>
			<description><![CDATA[a short summary]]></description>
			<content:encoded><![CDATA[<p>full post body</p>]]></content:encoded>
		</item>
	`),
	)

	expect(stories).toHaveLength(1)
	const [story] = stories
	expect(story.title).toBe('From the Archives')
	expect(story.link).toBe('https://content.krlx.org/2025/04/22/from-the-archives/')
	expect(story.authors).toStrictEqual(['Matthew Sigmond'])
	expect(story.categories).toStrictEqual(['Uncategorized'])
	expect(story.excerpt).toBe('a short summary')
	expect(story.datePublished).toBe('2025-04-22T10:42:59.000Z')
})

test('uses content:encoded for content, not the description, when it is present', () => {
	const stories = parseRssFeed(
		feed(`
		<item>
			<title>Has full content</title>
			<link>https://content.krlx.org/a/</link>
			<dc:creator><![CDATA[Someone]]></dc:creator>
			<pubDate>Tue, 22 Apr 2025 10:42:59 +0000</pubDate>
			<description><![CDATA[the short excerpt]]></description>
			<content:encoded><![CDATA[<p>the full post body, longer than the excerpt</p>]]></content:encoded>
		</item>
	`),
	)

	const [story] = stories
	expect(story.excerpt).toBe('the short excerpt')
	expect(story.content).toBe('the full post body, longer than the excerpt')
	expect(story.content).not.toBe(story.excerpt)
})

test('falls back to the description for content when content:encoded is absent', () => {
	const stories = parseRssFeed(
		feed(`
		<item>
			<title>No full content</title>
			<link>https://content.krlx.org/b/</link>
			<dc:creator><![CDATA[Someone]]></dc:creator>
			<pubDate>Tue, 22 Apr 2025 10:42:59 +0000</pubDate>
			<description><![CDATA[the only text this item has]]></description>
		</item>
	`),
	)

	const [story] = stories
	expect(story.content).toBe('the only text this item has')
	expect(story.content).toBe(story.excerpt)
})

test('falls back to Unknown Author when dc:creator is absent', () => {
	const stories = parseRssFeed(
		feed(`
		<item>
			<title>No creator</title>
			<link>https://content.krlx.org/c/</link>
			<pubDate>Tue, 22 Apr 2025 10:42:59 +0000</pubDate>
			<description><![CDATA[body]]></description>
		</item>
	`),
	)

	expect(stories[0].authors).toStrictEqual(['Unknown Author'])
})

test('ignores an enclosure whose type is not an image', () => {
	const stories = parseRssFeed(
		feed(`
		<item>
			<title>Audio enclosure</title>
			<link>https://content.krlx.org/d/</link>
			<dc:creator><![CDATA[Someone]]></dc:creator>
			<description><![CDATA[body]]></description>
			<enclosure url="https://content.krlx.org/audio.mp3" length="123" type="audio/mpeg" />
		</item>
	`),
	)

	expect(stories[0].featuredImage).toBeUndefined()
})

test('uses an enclosure whose type is an image', () => {
	const stories = parseRssFeed(
		feed(`
		<item>
			<title>Image enclosure</title>
			<link>https://content.krlx.org/e/</link>
			<dc:creator><![CDATA[Someone]]></dc:creator>
			<description><![CDATA[body]]></description>
			<enclosure url="https://content.krlx.org/photo.jpg" length="123" type="image/jpeg" />
		</item>
	`),
	)

	expect(stories[0].featuredImage).toBe('https://content.krlx.org/photo.jpg')
})

test('skips an item with an unparseable pubDate while its siblings still come through', () => {
	const stories = parseRssFeed(
		feed(`
		<item>
			<title>Good item</title>
			<link>https://content.krlx.org/f/</link>
			<dc:creator><![CDATA[Someone]]></dc:creator>
			<pubDate>Tue, 22 Apr 2025 10:42:59 +0000</pubDate>
			<description><![CDATA[body]]></description>
		</item>
		<item>
			<title>Bad item</title>
			<link>https://content.krlx.org/g/</link>
			<dc:creator><![CDATA[Someone]]></dc:creator>
			<pubDate>not a date</pubDate>
			<description><![CDATA[body]]></description>
		</item>
	`),
	)

	expect(stories.map((s) => s.title)).toStrictEqual(['Good item'])
})

test('throws when every item in a non-empty feed is malformed', () => {
	expect(() =>
		parseRssFeed(
			feed(`
		<item>
			<title>Bad item one</title>
			<link>https://content.krlx.org/h/</link>
			<pubDate>not a date</pubDate>
		</item>
		<item>
			<title>Bad item two</title>
			<link>https://content.krlx.org/i/</link>
			<pubDate>also not a date</pubDate>
		</item>
	`),
		),
	).toThrow()
})

test('returns an empty list when the feed legitimately has no items', () => {
	expect(parseRssFeed(feed(''))).toStrictEqual([])
})

test('strips html and trims titles and excerpts', () => {
	const stories = parseRssFeed(
		feed(`
		<item>
			<title><![CDATA[<b>Bold</b> title]]></title>
			<link>https://content.krlx.org/j/</link>
			<dc:creator><![CDATA[Someone]]></dc:creator>
			<description><![CDATA[  <p>an excerpt</p>  ]]></description>
		</item>
	`),
	)

	expect(stories[0].title).toBe('Bold title')
	expect(stories[0].excerpt).toBe('an excerpt')
})

test('throws when the response is not a string', () => {
	expect(() => parseRssFeed({not: 'a string'})).toThrow()
})
