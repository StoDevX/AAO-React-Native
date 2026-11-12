// node:child_process for the helper in JavaScriptCore. The helper runs
// bundle-data as `spawn(node, [script, ...args])`; the host runs that script
// in a fresh context instead and hands back its exit code and error output.

export function spawn(_command, args) {
	let listeners = {}
	let errorListeners = []
	let child = {
		stderr: {
			// the host hands back text already
			setEncoding() {
				return this
			},
			on(event, listener) {
				if (event === 'data') errorListeners.push(listener)
			},
		},
		on(event, listener) {
			;(listeners[event] ??= []).push(listener)
			return child
		},
	}
	child.once = (event, listener) => child.on(event, listener)
	globalThis.setTimeout(() => {
		let {code, stderr} = globalThis.__host.runScript(String(args[0]), args.slice(1).map(String))
		if (stderr) {
			for (let listener of errorListeners) listener(stderr)
		}
		for (let event of ['exit', 'close']) {
			for (let listener of listeners[event] ?? []) listener(code, null)
		}
	}, 0)
	return child
}

/** Only scripts the helper never runs call this, such as the image converter. */
export function execFileSync() {
	throw new Error('execFileSync has no stand-in: the Mac app runs no other program')
}

export default {spawn, execFileSync}
