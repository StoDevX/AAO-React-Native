import Foundation

/// What a session types: a word the app received, whole half the time and
/// otherwise a prefix of at least two characters, as a person types until
/// the results look right. `choice` picks the word and `fraction`, in [0, 1),
/// how much of it. With no words it falls back to the fuzzing strings.
func sessionText(vocab: [String], choice: Int, fraction: Double) -> String {
	guard !vocab.isEmpty else { return chaosStrings[choice % chaosStrings.count] }
	let word = Array(vocab[choice % vocab.count])
	guard fraction >= 0.5, word.count > 2 else { return String(word) }
	let length = 2 + Int((fraction - 0.5) * 2 * Double(word.count - 2))
	return String(word.prefix(min(length, word.count)))
}

/// Watches for a loading spinner left on screen after a session's network
/// came back: the mark of a request that never retried, or a state that never
/// cleared. Judges each outage once, 20 seconds after the network returned.
struct ChaosSpinnerWatch {
	private var outage = false
	private var backOnline: Date?

	mutating func observe(network: String?, hasSpinner: Bool, title: String, at now: Date) -> String? {
		if network == "offline" {
			outage = true
			backOnline = nil
			return nil
		}
		guard outage else { return nil }
		let since = backOnline ?? now
		backOnline = since
		guard now.timeIntervalSince(since) > 20 else { return nil }
		outage = false
		backOnline = nil
		return hasSpinner ? "stuck spinner: \(title)" : nil
	}
}

/// Counts the steps since a session saw a screen title it had not seen, to
/// tell when it is stuck going round the same screens.
struct ChaosNovelty {
	private var seen: Set<String> = []
	private var stale = 0

	mutating func see(_ title: String) {
		if seen.insert(title).inserted { stale = 0 } else { stale += 1 }
	}

	var isStuck: Bool { stale >= 40 }

	mutating func moved() { stale = 0 }
}

/// Screens that open with nothing passed to them, the way a link from a
/// widget or a quick action opens one: top-level routes only, since a nested
/// or detail screen expects what the screen before it hands over, and opened
/// bare it shows a state no person can reach.
func teleportRoutes(_ routes: [String]) -> [String] {
	routes.filter { !$0.contains("/") && !$0.contains("[") && !$0.hasSuffix("-detail") }
}
