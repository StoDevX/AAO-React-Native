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
