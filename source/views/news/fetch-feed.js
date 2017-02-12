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

export async function fetchRssFeed(url: string, query?: Object): Promise<StoryType[]> {
  const responseText = await fetch(`${url}?${qs.stringify(query)}`).then(r => r.text())
  const feed: FeedResponseType = await parseXml(responseText)
  return feed.rss.channel[0].item.map(convertRssItemToStory)
}

export async function fetchWpJson(url: string, query?: Object): Promise<StoryType[]> {
  const feed: WpJsonResponseType = await fetchJson(`${url}?${qs.stringify(query)}`)
  return feed.map(convertWpJsonItemToStory)
}

export function convertRssItemToStory(item: RssFeedItemType): StoryType {
  const authors = item['dc:creator'] || ['Unknown Author']
  const categories = item.category || []
  const link = (item.link || [])[0] || null
  const title = entities.decode(item.title[0] || '<no title>')
  const datePublished = (item.pubDate || [])[0] || null

  let content = (item['content:encoded'] || item.description || [])[0] || '<No content>'

  let excerpt = (item.description || [])[0] || content.substr(0, 250)
  excerpt = entities.decode(fastGetTrimmedText(excerpt))

  return {
    authors,
    categories,
    content,
    excerpt,
    link,
    title,
    datePublished,
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

  return {
    authors: [author],
    categories: [],
    content: item.content.rendered,
    excerpt: entities.decode(fastGetTrimmedText(item.excerpt.rendered)),
    link: item.link,
    title: entities.decode(item.title.rendered),
    datePublished: item.date_gmt,
  }
}
