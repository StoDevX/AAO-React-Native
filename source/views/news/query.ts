import {client} from '@frogpond/api'
import {queryOptions} from '@tanstack/react-query'
import {StoryType} from './types'

export const keys = {
	named: (name: string) => ['news', 'named', name] as const,
	rss: (url: string) => ['news', 'rss', url] as const,
	wpJson: (url: string) => ['news', 'wp-json', url] as const,
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const namedNewsOptions = (source: string) =>
	queryOptions({
		queryKey: keys.named(source),
		queryFn: async ({queryKey, signal}) => {
			let response = await client
				.get(`news/named/${queryKey[2]}`, {signal})
				.json()
			return response as StoryType[]
		},
	})

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const rssNewsOptions = (url: string) =>
	queryOptions({
		queryKey: keys.rss(url),
		queryFn: async ({queryKey, signal}) => {
			let response = await client
				.get('news/rss', {signal, searchParams: {url: queryKey[2]}})
				.json()
			return response as StoryType[]
		},
	})

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const wpJsonNewsOptions = (url: string) =>
	queryOptions({
		queryKey: keys.wpJson(url),
		queryFn: async ({queryKey, signal}) => {
			let response = await client
				.get('news/wpjson', {signal, searchParams: {url: queryKey[2]}})
				.json()
			return response as StoryType[]
		},
	})
