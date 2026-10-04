import {installChaos, type ChaosHost} from '../install'
import {memoryLineFile} from '../line-file'

function host(): ChaosHost & {
	fetchBefore: typeof fetch
	openURLBefore: jest.Mock
	shareBefore: jest.Mock
} {
	let fetchBefore = jest.fn() as unknown as typeof fetch
	let openURLBefore = jest.fn()
	let shareBefore = jest.fn()
	return {
		fetchBefore,
		openURLBefore,
		shareBefore,
		global: {fetch: fetchBefore},
		probe: {
			errorUtils: {getGlobalHandler: () => jest.fn(), setGlobalHandler: jest.fn()},
			exceptionsManager: {handleException: jest.fn()},
			console: {error: jest.fn()},
		},
		linking: {openURL: openURLBefore},
		share: {share: shareBefore},
		tape: memoryLineFile(),
		findings: memoryLineFile(),
	}
}

let settings = {isChaos: true, seed: 1, launch: 0, mode: 'record' as const, faultRate: 0.25}

test('does nothing outside a chaos run', () => {
	let h = host()
	expect(installChaos({...settings, isChaos: false}, h)).toBe(false)
	expect(h.global.fetch).toBe(h.fetchBefore)
	// oxlint-disable-next-line typescript/unbound-method
	expect(h.probe.errorUtils.setGlobalHandler).not.toHaveBeenCalled()
	expect(h.linking.openURL).toBe(h.openURLBefore)
	expect(h.share.share).toBe(h.shareBefore)
})

test('wraps fetch, installs the probe, and guards linking and sharing in a chaos run', () => {
	let h = host()
	expect(installChaos(settings, h)).toBe(true)
	expect(h.global.fetch).not.toBe(h.fetchBefore)
	// oxlint-disable-next-line typescript/unbound-method
	expect(h.probe.errorUtils.setGlobalHandler).toHaveBeenCalled()
	expect(h.linking.openURL).not.toBe(h.openURLBefore)
	expect(h.share.share).not.toBe(h.shareBefore)
})
