/// A campus a UI test can run on, by its reverse-DNS id: the value of `--campus`.
enum Campus: String {
	case stolaf = "edu.stolaf"
	case carleton = "edu.carleton"
	/// The College of the Norway Valley Wiki Monkeys: the deep tests' campus, served from hand-written fixtures.
	case example = "example.college"
}
