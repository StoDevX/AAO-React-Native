import {Share} from 'react-native'

import {guardShare} from '../share-guard'
import {memoryLineFile} from '../line-file'
import {setFindingsFile, useChaosFindings} from '../findings'
import {parseLines} from '../tape'

let file = memoryLineFile()

beforeEach(() => {
	file = memoryLineFile()
	useChaosFindings.setState({latest: '', file: null})
	setFindingsFile(file)
})

function messages(): string[] {
	return parseLines<{kind: string; message: string}>(file.readLines()).map(
		(f) => `${f.kind}: ${f.message}`,
	)
}

test('replaces share with one that reports instead of opening the share sheet', async () => {
	let original = jest.fn()
	let stub = {share: original}

	guardShare(stub)

	await expect(stub.share({url: 'https://olafmessenger.com/x'})).resolves.toEqual({
		action: Share.dismissedAction,
	})
	expect(original).not.toHaveBeenCalled()
	expect(messages()).toEqual(['out-of-app: share https://olafmessenger.com/x'])
})

test('names a share by its title, then its URL, then its message', async () => {
	let stub = {share: jest.fn()}
	guardShare(stub)

	await stub.share({title: 'Job', url: 'https://a.test/', message: 'Apply'})
	await stub.share({url: 'https://a.test/', message: 'Apply'})
	await stub.share({message: 'Chapel at 10'})

	expect(messages()).toEqual([
		'out-of-app: share Job',
		'out-of-app: share https://a.test/',
		'out-of-app: share Chapel at 10',
	])
})
