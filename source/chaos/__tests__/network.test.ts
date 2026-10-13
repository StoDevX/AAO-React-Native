import {goOfflineFor, networkLabel, useChaosNetwork} from '../network'

beforeEach(() => {
	jest.useFakeTimers()
	useChaosNetwork.setState({offline: false})
})

afterEach(() => {
	jest.useRealTimers()
})

test('goes offline for a while, then back online', () => {
	goOfflineFor(5000)
	expect(useChaosNetwork.getState().offline).toBe(true)
	jest.advanceTimersByTime(4999)
	expect(useChaosNetwork.getState().offline).toBe(true)
	jest.advanceTimersByTime(1)
	expect(useChaosNetwork.getState().offline).toBe(false)
})

test('a second window replaces the first', () => {
	goOfflineFor(5000)
	jest.advanceTimersByTime(4000)
	goOfflineFor(5000)
	jest.advanceTimersByTime(2000)
	expect(useChaosNetwork.getState().offline).toBe(true)
})

test('labels the network for the monkey', () => {
	expect(networkLabel(true)).toBe('offline')
	expect(networkLabel(false)).toBe('online')
})
