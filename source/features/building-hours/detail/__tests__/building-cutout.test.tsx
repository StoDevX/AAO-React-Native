import React from 'react'
import {describe, expect, test} from '@jest/globals'
import {render} from '@testing-library/react-native'

import {BuildingCutout} from '../building-cutout'
import {makeBuilding} from '../../../map/__tests__/fixtures'
import type {Building, Feature, GeometryCollection} from '../../../map/types'

jest.mock('@maplibre/maplibre-react-native', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../../testing/maplibre-mock') as typeof import('../../../../testing/maplibre-mock')
})
jest.mock('@expo/ui/swift-ui', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../../testing/expo-ui-mock') as typeof import('../../../../testing/expo-ui-mock')
})

function withGeometry(geometry: GeometryCollection): Feature<Building> {
	return {...makeBuilding({id: 'toh', name: 'Tomson Hall'}), geometry}
}

// The rendered case lives in `building-detail.test.tsx`, which asserts the same
// label plus the join and the query wiring that put the feature here. These two
// cover what only this component decides: when to draw nothing.
describe('BuildingCutout', () => {
	// Six St. Olaf venues -- The Cage, Stav Hall and the rest of Buntrock's
	// dining rooms among them -- key to a point-of-interest record whose only
	// geometry is a Point. There is no footprint to fill, outline or label, and
	// framing on a zero-area box clamps MapLibre to maximum zoom: a blank tile
	// with a name floating on it.
	test('renders nothing for a feature whose only geometry is a Point', async () => {
		let feature = withGeometry({
			type: 'GeometryCollection',
			geometries: [{type: 'Point', coordinates: [-93.1827, 44.4619]}],
		})

		let {queryByLabelText} = await render(<BuildingCutout campus="stolaf" feature={feature} />)

		expect(queryByLabelText('Map showing Tomson Hall')).toBeNull()
	})

	// The building-hours data can carry a `building` key that resolves to a
	// feature with no coordinates at all (a records-only stub, say), so this
	// has to render nothing rather than an unframeable map.
	test('renders nothing for a feature with no coordinates', async () => {
		let feature = withGeometry({type: 'GeometryCollection', geometries: []})

		let {queryByLabelText} = await render(<BuildingCutout campus="stolaf" feature={feature} />)

		expect(queryByLabelText('Map showing Tomson Hall')).toBeNull()
	})
})
