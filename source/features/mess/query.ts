import {fetchManifest, REL_NEWS, resolveSource} from '@frogpond/data-sources'
import {infiniteQueryOptions, queryOptions} from '@tanstack/react-query'
import {queryClient} from '../../init/tanstack-query'
import {parseMessCategories, parseMessPosts} from './lib/posts'
import {parseAboutPage} from './lib/about'
import {parseGalleryPhotos} from './lib/gallery'
import {bodyParagraphs} from './lib/issue-grid'
import {ISSUE_PAGE_SIZE, parseLightPosts, parseMediaUrls, withPhotoUrls} from './lib/issues'
import {latestProfile, parseStaffProfiles} from './lib/profiles'
import {newestStaffYear} from './lib/staff'
import {seriesKey, seriesName} from './lib/series'
import {findSpotifyRef} from './lib/spotify'
import {messFetch} from './lib/fixtures'
import {wpRoot} from './lib/wp-root'
import {paperKeys} from './lib/keys'
import type {Paper} from './campus-section'
import {emptyPastLastPage, nextPage, pageHref} from './lib/paging'
import type {
	AboutSection,
	CaptionedPhoto,
	LightPost,
	MessCategory,
	MessIssue,
	MessStory,
	SpotifyRef,
	StaffProfile,
} from './types'

const WP_V2_POSTS = 'application/vnd.wordpress.v2.posts+json'
const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000
const FIVE_MINUTES_IN_MS = 5 * 60 * 1000

/** How many profiles a page of the staff asks for, WordPress's most. A shorter page is the last. */
const STAFF_PAGE_SIZE = 100

/** Other stories to read after one, under a heading such as `More Mouse Friends`. */
export type MessSeries = {title: string; stories: MessStory[]}

/** A paper's feed href. Accepting only WordPress sends an older manifest's feed-items entry to the bundled one. */
async function feedHref(paper: Paper): Promise<string> {
	let manifest = await fetchManifest(queryClient)
	return resolveSource(manifest, REL_NEWS, paper.id, [WP_V2_POSTS]).href
}

/** A post that came back but holds no story the reader can show. */
export class MissingMessStoryError extends Error {
	constructor(id: number) {
		super(`no Mess story ${id}`)
		this.name = 'MissingMessStoryError'
	}
}

/**
 * Every query the reader makes of `paper`'s site, under the paper's own keys. Built once per
 * paper, so a screen gets the same options each render.
 */
/* oxlint-disable @tanstack/query/exhaustive-deps -- every key comes from paperKeys(paper.id), so
   it names the paper; the rule cannot see through it, and the other values a query reads follow
   from the paper too */
function queriesFor(paper: Paper) {
	const keys = paperKeys(paper.id)

	/** The Mess's category tree, which every query shares to work out sections and columns. */
	const categoriesOptions = queryOptions({
		queryKey: keys.categories,
		// The paper adds a category a few times a year.
		staleTime: ONE_DAY_IN_MS,
		queryFn: async ({signal}): Promise<MessCategory[]> => {
			let root = wpRoot(await feedHref(paper))
			let body = await messFetch(
				`${root}/categories?per_page=100&_fields=id,name,parent`,
				signal,
				`${paper.label} categories`,
			)
			return parseMessCategories(body)
		},
	})

	/** How many stories a page of a section's or column's list asks for. A shorter page is the last. */
	const CATEGORY_PAGE_SIZE = 30

	/** Stories from a WordPress posts path on the Mess's site, parsed like the feed. */
	async function storiesAt(
		path: string,
		signal: AbortSignal,
		label: string,
		page = 1,
	): Promise<MessStory[]> {
		let root = wpRoot(await feedHref(paper))
		// A failed categories fetch fails the stories on purpose: sections come from it.
		let [body, categories] = await Promise.all([
			messFetch(pageHref(`${root}/${path}`, page), signal, label).catch(emptyPastLastPage(page)),
			queryClient.query(categoriesOptions),
		])
		// A single post comes back as an object rather than a list.
		return parseMessPosts(Array.isArray(body) ? body : [body], categories, paper)
	}

	/** A page of the feed's stories, with sections worked out from the category tree. */
	async function feedStories(page: number, signal: AbortSignal): Promise<MessStory[]> {
		let href = pageHref(await feedHref(paper), page)
		// A failed categories fetch fails the feed on purpose: sections come from it.
		let [postsBody, categories] = await Promise.all([
			messFetch(href, signal, `${paper.label}`).catch(emptyPastLastPage(page)),
			queryClient.query(categoriesOptions),
		])
		return parseMessPosts(postsBody, categories, paper)
	}

	/** A page of a category's stories, newest first. */
	function categoryStories(
		categoryId: number,
		page: number,
		signal: AbortSignal,
	): Promise<MessStory[]> {
		return storiesAt(
			`posts?categories=${categoryId}&per_page=${CATEGORY_PAGE_SIZE}&_embed=true`,
			signal,
			`${paper.label} section`,
			page,
		)
	}

	/** The Mess's newest stories, a page at a time, with sections worked out from its category tree. */
	const feedOptions = infiniteQueryOptions({
		queryKey: keys.feed,
		// The reader shares this query, so without a stale time every story opened would fetch the
		// whole feed again. Five minutes spans a sitting of reading; the paper publishes a few times a
		// week, and pull-to-refresh fetches regardless, since refetch ignores stale time.
		staleTime: FIVE_MINUTES_IN_MS,
		// Latest needs only the first page at launch, and so does By Issue's offline fallback.
		meta: {persistPages: 1},
		initialPageParam: 1,
		queryFn: ({pageParam, signal}) => feedStories(pageParam, signal),
		// The manifest's feed address sets the page size, so the first page, full while the paper has
		// more stories than a page holds, stands for it.
		getNextPageParam: (lastPage, allPages, lastPageParam) =>
			nextPage(lastPage, lastPageParam, allPages[0]?.length ?? 0),
	})

	/** One story, by its WordPress post id. */
	const storyOptions = (id: number) =>
		queryOptions({
			queryKey: keys.story(id),
			staleTime: FIVE_MINUTES_IN_MS,
			// A post that holds no story will hold none on a second try either.
			retry: (failureCount, error) => !(error instanceof MissingMessStoryError) && failureCount < 3,
			queryFn: async ({signal}): Promise<MessStory> => {
				let [story] = await storiesAt(`posts/${id}?_embed=true`, signal, `${paper.label} story`)
				if (!story) throw new MissingMessStoryError(id)
				return story
			},
		})

	/**
	 * A story's words alone, for the columns under a grid tile's fold: its body and nothing else,
	 * a few kilobytes. Fetched again each launch rather than saved, since every photo-less tile a
	 * reader scrolls past would otherwise add one to the saved cache.
	 */
	const leadTextOptions = (id: number) =>
		queryOptions({
			queryKey: keys.leadText(id),
			// A story's words rarely change once it runs.
			staleTime: ONE_DAY_IN_MS,
			meta: {persist: false},
			queryFn: async ({signal}): Promise<string[]> => {
				let root = wpRoot(await feedHref(paper))
				let body = await messFetch(
					`${root}/posts/${id}?_fields=content`,
					signal,
					`${paper.label} story text`,
				)
				return bodyParagraphs(body)
			},
		})

	/** A category's newest stories, such as every Variety column's, a page at a time. */
	const categoryOptions = (categoryId: number) =>
		infiniteQueryOptions({
			queryKey: keys.category(categoryId),
			staleTime: FIVE_MINUTES_IN_MS,
			// The list needs only its first page at launch; the rest load again as it scrolls to them.
			meta: {persistPages: 1},
			initialPageParam: 1,
			queryFn: ({pageParam, signal}) => categoryStories(categoryId, pageParam, signal),
			getNextPageParam: (lastPage, _allPages, lastPageParam) =>
				nextPage(lastPage, lastPageParam, CATEGORY_PAGE_SIZE),
		})
	/**
	 * Every post the paper has published, newest first, a page at a time and in only the fields an
	 * issue needs, for grouping into issues, with the page's photo addresses looked up in one more
	 * request. A short page is the last.
	 */
	const issuesOptions = infiniteQueryOptions({
		queryKey: keys.issues,
		// As the feed: a sitting of reading, while pull to refresh fetches regardless.
		staleTime: FIVE_MINUTES_IN_MS,
		// Top needs only the first page at launch; the rest load again as Issues scrolls to them.
		meta: {persistPages: 1},
		initialPageParam: 1,
		queryFn: async ({pageParam, signal}): Promise<LightPost[]> => {
			let root = wpRoot(await feedHref(paper))
			// A failed categories fetch fails the page on purpose: sections come from it.
			let [body, categories] = await Promise.all([
				messFetch(
					`${root}/posts?per_page=${ISSUE_PAGE_SIZE}&page=${pageParam}&_fields=id,date,title,categories,featured_media`,
					signal,
					`${paper.label} issues`,
				).catch(emptyPastLastPage(pageParam)),
				queryClient.query(categoriesOptions),
			])
			let posts = parseLightPosts(body, categories, paper)
			let photoIds = [
				...new Set(posts.flatMap((post) => (post.photo === null ? [] : [post.photo]))),
			]
			if (photoIds.length === 0) return posts
			// A row without its photo draws a tinted square, so a failed lookup leaves the page whole.
			let urls = await messFetch(
				`${root}/media?include=${photoIds.join(',')}&per_page=${ISSUE_PAGE_SIZE}&_fields=id,source_url`,
				signal,
				`${paper.label} photos`,
			)
				.then(parseMediaUrls)
				.catch(() => new Map<number, string>())
			return withPhotoUrls(posts, urls)
		},
		getNextPageParam: (lastPage, _allPages, lastPageParam) =>
			nextPage(lastPage, lastPageParam, ISSUE_PAGE_SIZE),
	})

	/**
	 * One issue's stories, asked for by their ids and parsed like the feed. Only the newest issue's,
	 * the front page's top tile, are saved for the next launch; any other is fetched again when opened.
	 */
	const issueOptions = (
		issue: Pick<MessIssue, 'key' | 'storyIds'>,
		{persist = false}: {persist?: boolean} = {},
	) =>
		queryOptions<MessStory[]>({
			queryKey: keys.issue(issue),
			meta: {persist},
			// A published issue rarely changes.
			staleTime: ONE_DAY_IN_MS,
			// A story joining or leaving the issue changes its key; the stories already on screen stay
			// while the new set loads. Another issue's stories never stand in.
			placeholderData: (previous, previousQuery) =>
				previousQuery?.queryKey[2] === issue.key ? previous : undefined,
			// By id rather than by date: a week's range can take in a special edition, which is an issue
			// of its own. WordPress answers at most a page of ids at once, and an issue that runs over a
			// quiet summer can hold more, so they are asked for a page at a time.
			queryFn: async ({signal, client}) => {
				let batches = []
				for (let i = 0; i < issue.storyIds.length; i += ISSUE_PAGE_SIZE) {
					batches.push(issue.storyIds.slice(i, i + ISSUE_PAGE_SIZE))
				}
				let stories = await Promise.all(
					batches.map((ids) =>
						storiesAt(
							`posts?include=${ids.join(',')}&per_page=${ISSUE_PAGE_SIZE}&_embed=true`,
							signal,
							`${paper.label} issue`,
						),
					),
				)
				// The issue's ids change as its paper goes up, and each earlier set is a query of its own,
				// saved for the next launch with every story's body. The current set replaces them.
				let current = JSON.stringify(issue.storyIds)
				client.removeQueries({
					queryKey: [...keys.anyIssue, issue.key],
					predicate: (query) => JSON.stringify(query.queryKey[3]) !== current,
				})
				return stories.flat()
			},
		})

	/**
	 * What to read after a story: the other episodes of its series, such as a comic's, or failing
	 * that its writer's other work in the same column. Never includes the story itself.
	 */
	const seriesOptions = (story: MessStory) =>
		// oxlint-disable-next-line @tanstack/query/exhaustive-deps -- the title, column and bylines all follow from the id
		queryOptions({
			queryKey: keys.series(story.id),
			staleTime: ONE_DAY_IN_MS,
			queryFn: async ({signal}): Promise<MessSeries> => {
				let categories = await queryClient.query(categoriesOptions)
				let column = categories.find((c) => c.name === story.column)
				if (!column) return {title: '', stories: []}

				let name = seriesName(story.title)
				if (name) {
					let key = name.toLowerCase()
					// The column's list as far as it has loaded, cached under the same key the Mess list
					// uses for it.
					let recent = (await queryClient.infiniteQuery(categoryOptions(column.id))).pages.flat()
					let episodes = recent.filter((s) => s.id !== story.id && seriesKey(s.title) === key)
					// The newest episode spells the series as the paper now does, which an older title may not.
					let newest = episodes[0]
					if (newest) {
						return {
							title: `More ${seriesName(newest.title) ?? name}`,
							stories: episodes.slice(0, 6),
						}
					}
				}

				let writer = story.bylines[0]
				if (!writer) return {title: '', stories: []}
				// Seven, so that six remain once the story itself is dropped.
				let byWriter = await storiesAt(
					`posts?categories=${column.id}&staff_name=${writer.id}&per_page=7&_embed=true`,
					signal,
					`${paper.label} writer`,
				)
				return {
					title: `More by ${writer.name}`,
					stories: byWriter.filter((s) => s.id !== story.id).slice(0, 6),
				}
			},
		})

	/**
	 * The Spotify playlist on a Playlist post's web page, for a post whose body names none: the
	 * site's theme draws those players from a field the REST API does not return. Null when the
	 * page names none either.
	 */
	const playlistPageOptions = (story: MessStory) =>
		// oxlint-disable-next-line @tanstack/query/exhaustive-deps -- the link follows from the id
		queryOptions({
			queryKey: keys.playlistPage(story.id),
			// A published post's playlist does not change.
			staleTime: ONE_DAY_IN_MS,
			// The page shows a placeholder until this settles, so it fails at once offline, and
			// after one retry otherwise, letting the page fall back; it is fetched again when the
			// network returns.
			networkMode: 'always',
			retry: 1,
			queryFn: async ({signal}): Promise<SpotifyRef | null> => {
				let page = await messFetch(story.link, signal, `${paper.label} page`, 'text')
				return typeof page === 'string' ? findSpotifyRef(page) : null
			},
		})

	/**
	 * A gallery's photos, which its slideshow names by media id but carries only the first of, in
	 * the slideshow's order. WordPress answers at most 100 ids at once, more than any gallery holds.
	 */
	const galleryOptions = (photoIds: number[]) =>
		queryOptions({
			queryKey: keys.gallery(photoIds),
			// A published gallery's photos do not change.
			staleTime: ONE_DAY_IN_MS,
			queryFn: async ({signal}): Promise<CaptionedPhoto[]> => {
				let root = wpRoot(await feedHref(paper))
				let body = await messFetch(
					`${root}/media?include=${photoIds.join(',')}&per_page=100&_fields=id,source_url,media_details,caption,alt_text`,
					signal,
					`${paper.label} gallery`,
				)
				return parseGalleryPhotos(body, photoIds)
			},
		})

	/** One writer's newest staff profile, or null when they have none. */
	const staffProfileOptions = (staffId: number) =>
		queryOptions({
			queryKey: keys.profile(staffId),
			staleTime: ONE_DAY_IN_MS,
			queryFn: async ({signal}): Promise<StaffProfile | null> => {
				let root = wpRoot(await feedHref(paper))
				let body = await messFetch(
					`${root}/staff_profile?staff_name=${staffId}&_embed=true`,
					signal,
					`${paper.label} staff profile`,
				)
				return latestProfile(parseStaffProfiles(body))
			},
		})

	/** The paper's About page: whom to write to, and its submission policy. */
	const aboutOptions = queryOptions({
		queryKey: keys.about,
		// The paper edits the page when its staff changes, about once a year.
		staleTime: ONE_DAY_IN_MS,
		queryFn: async ({signal}): Promise<AboutSection[]> => {
			let root = wpRoot(await feedHref(paper))
			let body = await messFetch(
				`${root}/pages?slug=${paper.contactPageSlug}&_fields=content`,
				signal,
				`${paper.label} About page`,
			)
			return parseAboutPage(body)
		},
	})

	/** Everyone on the newest staff year, for the staff directory. */
	const staffOptions = queryOptions({
		queryKey: keys.staff,
		// The paper adds its staff at the start of a year, and a new hire or two after.
		staleTime: ONE_DAY_IN_MS,
		queryFn: async ({signal}): Promise<StaffProfile[]> => {
			let root = wpRoot(await feedHref(paper))
			// The newest year with anyone on it: a year the paper has made but not yet filled would
			// otherwise hide last year's staff behind an empty page. Every year is asked for, not just
			// the first by name, so a term not named as a year cannot stand in for the newest.
			let years = await messFetch(
				`${root}/staff_year?hide_empty=true&per_page=100&_fields=id,name`,
				signal,
				`${paper.label} staff years`,
			)
			let year = newestStaffYear(years)
			// No year with anyone on it lists nobody, which the directory says, rather than an error.
			if (!year) return []
			// _fields must name featured_media, _links and _embedded, or WordPress embeds no photo.
			let href = `${root}/staff_profile?staff_year=${year.id}&per_page=${STAFF_PAGE_SIZE}&_embed=wp:featuredmedia,wp:term&_fields=id,title,content,excerpt,featured_media,_links,_embedded`
			let people: StaffProfile[] = []
			for (let page: number | undefined = 1; page !== undefined;) {
				// Each page says whether there is another, so the pages are fetched one after another.
				// oxlint-disable-next-line eslint/no-await-in-loop
				let body = await messFetch(pageHref(href, page), signal, `${paper.label} staff`).catch(
					emptyPastLastPage(page),
				)
				let list = Array.isArray(body) ? body : []
				people.push(...parseStaffProfiles(list))
				page = nextPage(list, page, STAFF_PAGE_SIZE)
			}
			return people
		},
	})

	return {
		categoriesOptions,
		feedOptions,
		storyOptions,
		leadTextOptions,
		categoryOptions,
		issuesOptions,
		issueOptions,
		seriesOptions,
		playlistPageOptions,
		galleryOptions,
		staffProfileOptions,
		aboutOptions,
		staffOptions,
	}
}
/* oxlint-enable @tanstack/query/exhaustive-deps */

/** The reader's queries for one paper. */
export type PaperQueries = ReturnType<typeof queriesFor>

const byPaper = new Map<Paper['id'], PaperQueries>()

/** The reader's queries for `paper`, the same object each time. */
export function paperQueries(paper: Paper): PaperQueries {
	let queries = byPaper.get(paper.id)
	if (!queries) {
		queries = queriesFor(paper)
		byPaper.set(paper.id, queries)
	}
	return queries
}
