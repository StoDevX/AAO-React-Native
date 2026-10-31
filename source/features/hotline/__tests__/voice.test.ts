import {expect, test} from '@jest/globals'
import type {Voice} from 'expo-speech'

import {bestVoice} from '../voice'

function voice(identifier: string, language: string, enhanced = false): Voice {
	let quality = (enhanced ? 'Enhanced' : 'Default') as Voice['quality']
	return {identifier, name: identifier, language, quality}
}

const compact = voice('com.apple.voice.compact.en-US.Samantha', 'en-US')
const enhanced = voice('com.apple.voice.enhanced.en-US.Evan', 'en-US', true)
// expo-speech reports a Premium voice's quality as Default; only its identifier says otherwise.
const premium = voice('com.apple.voice.premium.en-US.Zoe', 'en-US')
const britishPremium = voice('com.apple.voice.premium.en-GB.Malcolm', 'en-GB')

test('prefers a Premium voice, then an Enhanced one', () => {
	expect(bestVoice([compact, enhanced, premium])).toBe(premium.identifier)
	expect(bestVoice([compact, enhanced])).toBe(enhanced.identifier)
})

test("keeps to the prompts' own English", () => {
	expect(bestVoice([britishPremium, enhanced])).toBe(enhanced.identifier)
})

test('leaves the choice to the system when only compact voices are installed', () => {
	expect(bestVoice([compact, britishPremium])).toBeUndefined()
})
