import * as React from 'react'
import {describe, expect, test} from '@jest/globals'
import {render} from '@testing-library/react-native'

import {RemotePhoto} from '../remote-photo'
import {loadBeforeTests} from '../../../testing/load-before-tests'

loadBeforeTests('Image')

type Node = {type: string; props: Record<string, unknown>; children: Array<Node | string> | null}

/** The first rendered host element of `type`, searching depth first. */
function findHost(node: Node | Node[] | null, type: string): Node | undefined {
	if (node === null) return undefined
	if (Array.isArray(node)) return node.map((n) => findHost(n, type)).find(Boolean)
	if (node.type === type) return node
	let children = (node.children ?? []).filter((child): child is Node => typeof child !== 'string')
	return findHost(children, type)
}

describe('RemotePhoto', () => {
	// A writer's photo is not read, and a figure's caption is read as its own text.
	test('keeps the photo out of VoiceOver', async () => {
		let result = await render(<RemotePhoto height={40} url="https://x.test/a.jpg" width={40} />)
		let image = findHost(result.toJSON() as Node | Node[] | null, 'Image')

		expect(image?.props.source).toStrictEqual({uri: 'https://x.test/a.jpg'})
		expect(image?.props.accessible).toBe(false)
		expect(image?.props.accessibilityElementsHidden).toBe(true)
	})
})
