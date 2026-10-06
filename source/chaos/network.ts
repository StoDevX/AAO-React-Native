import {create} from 'zustand'

/** Whether a session has taken the network away, for the monkey to read. */
export const useChaosNetwork = create<{offline: boolean}>(() => ({offline: false}))

let backOnline: ReturnType<typeof setTimeout> | null = null

/** Takes the network away for `ms`, replacing any window already open. */
export function goOfflineFor(ms: number): void {
	useChaosNetwork.setState({offline: true})
	if (backOnline) clearTimeout(backOnline)
	backOnline = setTimeout(() => {
		backOnline = null
		useChaosNetwork.setState({offline: false})
	}, ms)
}

/** The network element's label. */
export function networkLabel(offline: boolean): 'online' | 'offline' {
	return offline ? 'offline' : 'online'
}
