/// Something the monkey can do, and how often it does it out of 100.
enum ChaosAction: String, CaseIterable {
	case tap, scroll, type, back, openRoute, background, rotate

	var weight: Int {
		switch self {
		case .tap: 55
		case .scroll: 15
		case .type: 8
		case .back: 10
		case .openRoute: 7
		case .background: 3
		case .rotate: 2
		}
	}

	static func pick(using random: inout ChaosRandom) -> ChaosAction {
		var roll = Int.random(in: 0..<100, using: &random)
		for action in allCases {
			if roll < action.weight { return action }
			roll -= action.weight
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
