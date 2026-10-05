import * as React from 'react'
import {render, screen} from '@testing-library/react-native'
import {NewsPicker} from '../news-picker'

// The menu keeps its rows in the order they are written (`menuOrder('fixed')`),
// so the order they render in here is the order a reader sees.

test('lists All Stories first, then the categories in the order given', async () => {
	await render(
		<NewsPicker categories={['Arts', 'Sports']} onSelect={jest.fn()} selectedCategory={null} />,
	)

	let labels = screen
		.getAllByText(/^(All Stories|Arts|Sports)$/u)
		.map((text) => text.props.children)
	expect(labels).toEqual(['All Stories', 'Arts', 'Sports'])
})
