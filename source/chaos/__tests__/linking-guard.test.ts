import {guardLinking} from '../linking-guard'
import {memoryLineFile} from '../line-file'
import {setFindingsFile, useChaosFindings} from '../findings'
import {parseLines} from '../tape'

beforeEach(() => {
	useChaosFindings.setState({latest: '', file: null})
})

test('replaces openURL with one that reports instead of opening', async () => {
	let file = memoryLineFile()
	setFindingsFile(file)
	let original = jest.fn()
	let stub = {openURL: original}

	guardLinking(stub)

	await expect(stub.openURL('maps:?q=Holland')).resolves.toBe(false)
	expect(original).not.toHaveBeenCalled()

	let findings = parseLines<{kind: string; message: string}>(file.readLines())
	expect(findings).toEqual([
		expect.objectContaining({kind: 'out-of-app', message: 'maps:?q=Holland'}),
	])
})
