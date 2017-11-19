// @flow
import {fastGetTrimmedText} from '../../lib/html'
import qs from 'querystring'
import {AllHtmlEntities} from 'html-entities'
import {parseString} from 'xml2js'
import pify from 'pify'
import type {
  StoryType,
  FeedResponseType,
  RssFeedItemType,
  WpJsonItemType,
  WpJsonResponseType,
} from './types'

const parseXml = pify(parseString)
const entities = new AllHtmlEntities()

const fetchText = url => fetch(url).then(r => r.text())

export async function fetchRssFeed(
  url: string,
  query: Object = {},
): Promise<StoryType[]> {
  const responseText = await fetchText(`${url}?${qs.stringify(query)}`)
  const feed: FeedResponseType = await parseXml(responseText)
  return feed.rss.channel[0].item.map(convertRssItemToStory)
}

export async function fetchWpJson(
  url: string,
  query: Object = {},
): Promise<StoryType[]> {
  const feed: WpJsonResponseType = await fetchJson(
    `${url}?${qs.stringify(query)}`,
  )
  return feed.map(convertWpJsonItemToStory)
}

export function convertRssItemToStory(item: RssFeedItemType): StoryType {
  const authors = item['dc:creator'] || ['Unknown Author']
  const categories = item.category || []
  const link = (item.link || [])[0] || null
  const title = entities.decode(item.title[0] || '<no title>')
  const datePublished = (item.pubDate || [])[0] || null

  let content =
    (item['content:encoded'] || item.description || [])[0] || '<No content>'

  let excerpt = (item.description || [])[0] || content.substr(0, 250)
  excerpt = entities.decode(fastGetTrimmedText(excerpt))

  return {
    authors,
    categories,
    content,
    datePublished,
    excerpt,
    featuredImage: null,
    link,
    title,
  }
}

export function convertWpJsonItemToStory(item: WpJsonItemType): StoryType {
  let author = item.author
  if (item._embedded && item._embedded.author) {
    let authorInfo = item._embedded.author.find(a => a.id === item.author)
    author = authorInfo ? authorInfo.name : 'Unknown Author'
  } else {
    author = 'Unknown Author'
  }

  let featuredImage = null
  if (item._embedded && item._embedded['wp:featuredmedia']) {
    let featuredMediaInfo = item._embedded['wp:featuredmedia'].find(
      m => m.id === item.featured_media && m.media_type === 'image',
    )

    if (featuredMediaInfo) {
      if (
        featuredMediaInfo.media_details.sizes &&
        featuredMediaInfo.media_details.sizes.medium_large
      ) {
        featuredImage =
          featuredMediaInfo.media_details.sizes.medium_large.source_url
      } else {
        featuredImage = featuredMediaInfo.source_url
      }
    }
  }

  return {
    authors: [author],
    categories: [],
    content: item.content.rendered,
    datePublished: item.date_gmt,
    excerpt: entities.decode(fastGetTrimmedText(item.excerpt.rendered)),
    featuredImage: featuredImage,
    link: item.link,
    title: entities.decode(item.title.rendered),
  }
}
