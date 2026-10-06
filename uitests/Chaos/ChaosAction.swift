/// Which kind of run the monkey is on: a fuzzer, or a realistic session.
enum ChaosProfile: String {
	case fuzz, session
}

/// Something the monkey can do, and how often it does it out of 100.
enum ChaosAction: String, CaseIterable {
	case tap, scroll, type, back, openRoute, background, rotate, kill, teleport

	/// How often the action is picked in `profile`. A session never opens a
	/// route by chance, which relaunches the app; it teleports only when it is
	/// stuck, so `.teleport` is never picked by weight. Fuzzing's `.rotate`
	/// keeps its weight without `--rotate`, as a step that does nothing.
	func weight(in profile: ChaosProfile, rotate: Bool) -> Int {
		switch profile {
		case .fuzz:
			switch self {
			case .tap: 55
			case .scroll: 15
			case .type: 8
			case .back: 10
			case .openRoute: 7
			case .background: 3
			case .rotate: 2
			case .kill, .teleport: 0
			}
		case .session:
			switch self {
			case .tap: rotate ? 58 : 60
			case .scroll: 17
			case .type: 8
			case .back: 10
			case .background: 3
			case .kill: 2
			case .rotate: rotate ? 2 : 0
			case .openRoute, .teleport: 0
			}
		}
	}

	static func pick(in profile: ChaosProfile, rotate: Bool, using random: inout ChaosRandom) -> ChaosAction {
		var roll = Int.random(in: 0..<100, using: &random)
		for action in allCases {
			let weight = action.weight(in: profile, rotate: rotate)
			if roll < weight { return action }
			roll -= weight
		}
		return .tap
	}
}

/// Text that has broken text handling before: nothing, emoji, right-to-left,
/// combining marks, very long, markup, and whitespace alone.
let chaosStrings = [
	"",
	"olaf",
	"👩🏽‍🔬🏳️‍🌈",
	"مرحبا بالعالم",
	"Z̤͔ͧ̑a̮l͖g̘o",
	String(repeating: "lefse ", count: 90),
	"<script>alert(1)</script>",
	"'; DROP TABLE courses; --",
	"   \n\t  ",
	"%s%n%x",
]

/// Values for a route's dynamic segment: plausible, empty, and hostile.
let chaosSegmentValues = ["1", "0", "-1", "999999999", "not-a-real-id", "%F0%9F%92%A5", "a%2Fb", ""]
