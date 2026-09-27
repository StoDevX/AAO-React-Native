import assert from 'node:assert/strict'
import {test} from 'node:test'
import {decodeEntities, htmlText} from './html-text.mjs'

test('decodes decimal, hex and named entities', () => {
	assert.equal(decodeEntities('Grab &#039;n&#039; Go'), "Grab 'n' Go")
	assert.equal(decodeEntities('&#x24;12.00'), '$12.00')
	assert.equal(decodeEntities('Salt &amp; Pepper'), 'Salt & Pepper')
})

test('leaves an unknown named entity alone', () => {
	assert.equal(decodeEntities('&bogus;'), '&bogus;')
})

test('strips tags and collapses whitespace', () => {
	assert.equal(htmlText('<td>\n\t\tStandard Tier 1 (ST1)   </td>'), 'Standard Tier 1 (ST1)')
	assert.equal(htmlText('$12.00&nbsp;/hour'), '$12.00 /hour')
})
