import * as React from 'react'
import {render, screen} from '@testing-library/react-native'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'

import ArchivedConvosPage from '../../../../app/carleton-convos/archived'
import {archivedConvosOptions, type ArchivedConvo} from '../convos'

const convo: ArchivedConvo = {
	title: 'Carleton Convo with Someone',
	description: 'A talk.',
	published: new Date('2026-10-02T00:00:00Z'),
	recordingUrl: 'https://example.com/a.mp3',
	isVideo: false,
}

test('lists the recordings it has loaded', async () => {
	// No garbage collection, whose timer would hold Jest open.
	let client = new QueryClient({defaultOptions: {queries: {gcTime: Infinity, retry: false}}})
	client.setQueryData(archivedConvosOptions.queryKey, [convo])

	await render(
		<QueryClientProvider client={client}>
			<ArchivedConvosPage />
		</QueryClientProvider>,
	)

	expect(screen.getByText(convo.title)).toBeTruthy()
})
