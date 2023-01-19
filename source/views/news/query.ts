import {client} from '@frogpond/api'
import {useQuery, type UseQueryResult} from '@tanstack/react-query'
import {StoryType} from './types'

export const keys = {
	named: (name: string) => ['news', 'named', name] as const,
	rss: (url: string) => ['news', 'rss', url] as const,
	wpJson: (url: string) => ['news', 'wp-json', url] as const,
}

export function useNamedNewsSource(
	source: string,
): UseQueryResult<StoryType[], unknown> {
	return useQuery({
		queryKey: keys.named(source),
		queryFn: async ({queryKey, signal}) => {
			let response = await client
				.get(`news/named/${queryKey[2]}`, {signal})
				.json()
			return (response as {data: StoryType[]}).data
		},
	})
}

export function useRssNewsSource(
	url: string,
): UseQueryResult<StoryType[], unknown> {
	return useQuery({
		queryKey: keys.rss(url),
		queryFn: async ({queryKey, signal}) => {
			let response = await client
				.get('news/rss', {signal, searchParams: {url: queryKey[2]}})
				.json()
			return (response as {data: StoryType[]}).data
		},
	})
}

export function useWpJsonNewsSource(
	url: string,
): UseQueryResult<StoryType[], unknown> {
	return useQuery({
		queryKey: keys.wpJson(url),
		queryFn: async ({queryKey, signal}) => {
			let response = await client
				.get('news/wpjson', {signal, searchParams: {url: queryKey[2]}})
				.json()
			return (response as {data: StoryType[]}).data
		},
	})
}
