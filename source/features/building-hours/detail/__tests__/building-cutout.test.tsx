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

describe('BuildingCutout', () => {
	test('renders a labelled map for a feature with a real footprint', async () => {
		let feature = withGeometry({
			type: 'GeometryCollection',
			geometries: [
				{
					type: 'Polygon',
					coordinates: [
						[
							[-93.18, 44.46],
							[-93.17, 44.46],
							[-93.17, 44.47],
							[-93.18, 44.47],
						],
					],
				},
			],
		})

		let {getByLabelText} = await render(<BuildingCutout campus="stolaf" feature={feature} />)

		expect(getByLabelText('Map showing Tomson Hall')).toBeTruthy()
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
