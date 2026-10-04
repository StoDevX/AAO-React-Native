import {reportFinding} from '../findings'
import {installChaos, type ChaosHost} from '../install'
import {memoryLineFile} from '../line-file'
import {STALL_TICK_MS} from '../stall'

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
		stalls: {setInterval: jest.fn(), now: () => 0, onAppStateChange: jest.fn()},
		tape: memoryLineFile(),
		findings: memoryLineFile(),
	}
}

let settings = {
	isChaos: true,
	seed: 1,
	launch: 0,
	mode: 'record' as const,
	faultRate: 0.25,
	profile: 'fuzz' as const,
}

test('does nothing outside a chaos run', () => {
	let h = host()
	expect(installChaos({...settings, isChaos: false}, h)).toBe(false)
	expect(h.global.fetch).toBe(h.fetchBefore)
	// oxlint-disable-next-line typescript/unbound-method
	expect(h.probe.errorUtils.setGlobalHandler).not.toHaveBeenCalled()
	expect(h.linking.openURL).toBe(h.openURLBefore)
	expect(h.share.share).toBe(h.shareBefore)
	expect(h.stalls.setInterval).not.toHaveBeenCalled()
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

test('watches for stalls in a chaos run', () => {
	let h = host()
	installChaos(settings, h)
	expect(h.stalls.setInterval).toHaveBeenCalledWith(expect.any(Function), STALL_TICK_MS)
})

test('records findings under the launch it was installed in', () => {
	let h = host()
	installChaos({...settings, launch: 6}, h)
	reportFinding('console-error', 'boom')
	expect(JSON.parse(h.findings.readLines()[0])).toMatchObject({launch: 6})
})
