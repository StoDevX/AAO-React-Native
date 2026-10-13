import * as React from 'react'
import {afterEach, beforeEach, describe, expect, test} from '@jest/globals'
import {render, screen} from '@testing-library/react-native'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'

import {messKeys} from '../lib/keys'
import {QuietHeader} from '../quiet-header'
import type {MessStory, StaffProfile} from '../types'
import {InMessenger} from './in-messenger'

const POEM: MessStory = {
	id: 37010,
	title: 'Ode to the Cage',
	excerpt: 'E',
	link: 'https://olafmessenger.com/37010/',
	published: '2026-04-29T22:24:19.000Z',
	section: 'Variety',
	column: 'Poetry',
	featured: false,
	bylines: [
		{id: 392, name: 'Kenzie Nguyen'},
		{id: 423, name: 'Ashlyn Wuench'},
	],
	photo: null,
	blocks: [{type: 'paragraph', runs: [{text: 'A line.'}]}],
	layout: {kind: 'poem', stanzas: [[{indent: 0, runs: [{text: 'A line.'}]}]]},
}

function profile(name: string, url: string): StaffProfile {
	return {id: 1, name, role: '', bio: '', photo: {url, width: 300, height: 300}, year: '2025-2026'}
}

const PLACEHOLDER = 'mess-byline-avatar-placeholder'

type Node = {type: string; props: Record<string, unknown>; children: Array<Node | string> | null}

/** The sources of every rendered image, depth first. */
function imageUris(node: Node | Node[] | null): unknown[] {
	if (node === null) return []
	if (Array.isArray(node)) return node.flatMap(imageUris)
	let children = (node.children ?? []).filter((child): child is Node => typeof child !== 'string')
	let own = node.type === 'Image' ? [(node.props.source as {uri: string}).uri] : []
	return [...own, ...imageUris(children)]
}

let queryClient: QueryClient

beforeEach(() => {
	queryClient = new QueryClient({defaultOptions: {queries: {staleTime: Infinity, retry: false}}})
})

afterEach(() => {
	queryClient.clear()
})

async function renderHeader(story: MessStory) {
	await render(
		<QueryClientProvider client={queryClient}>
			<InMessenger>
				<QuietHeader story={story} />
			</InMessenger>
		</QueryClientProvider>,
	)
}

describe('QuietHeader', () => {
	test("shows the first writer's photo beside the credit line", async () => {
		queryClient.setQueryData(
			messKeys.profile(392),
			profile('Kenzie Nguyen', 'https://x.test/kenzie.jpg'),
		)
		queryClient.setQueryData(
			messKeys.profile(423),
			profile('Ashlyn Wuench', 'https://x.test/ashlyn.jpg'),
		)
		await renderHeader(POEM)

		expect(imageUris(screen.toJSON() as Node | Node[] | null)).toStrictEqual([
			'https://x.test/kenzie.jpg',
		])
		expect(screen.getByText(/Kenzie Nguyen/u)).toBeTruthy()
	})

	// A story with no byline has no writer to picture, so its credit line is the date alone.
	test('shows no photo and holds no place for a story with no byline', async () => {
		await renderHeader({...POEM, bylines: []})

		expect(screen.queryByTestId(PLACEHOLDER)).toBeNull()
		expect(imageUris(screen.toJSON() as Node | Node[] | null)).toStrictEqual([])
		expect(screen.getByText('Ode to the Cage')).toBeTruthy()
	})
})
