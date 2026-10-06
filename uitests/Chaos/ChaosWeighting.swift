import XCTest

/// One of `items`, each weighted by `1 / (1 + uses)`, so what the monkey has
/// used least is likeliest. Draws exactly once from `random`, even when there
/// is nothing to pick, so a seed's later draws do not shift with the screen.
func pickWeighted<Item>(_ items: [Item], uses: (Item) -> Int, using random: inout ChaosRandom) -> Item? {
	let roll = Double.random(in: 0..<1, using: &random)
	guard !items.isEmpty else { return nil }
	let weights = items.map { 1.0 / Double(1 + uses($0)) }
	var remaining = roll * weights.reduce(0, +)
	for (item, weight) in zip(items, weights) {
		if remaining < weight { return item }
		remaining -= weight
	}
	return items.last
}

/// What tells one target from another on a screen: its identifier, else its
/// label, else its type and position to the nearest 10 points.
func targetKey(_ target: ChaosTarget) -> String {
	if !target.identifier.isEmpty { return "id:\(target.identifier)" }
	if !target.label.isEmpty { return "label:\(target.label)" }
	let x = Int((target.frame.minX / 10).rounded(.down)) * 10
	let y = Int((target.frame.minY / 10).rounded(.down)) * 10
	return "\(target.type.rawValue)@\(x),\(y)"
}
