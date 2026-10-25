/// Which caption sessions may run: the bookkeeping that lets a stop reach a start whose body
/// has not run yet.
///
/// The JavaScript side numbers each start and says, when it stops, the highest number it has
/// started. A start numbered at or below that is dead on arrival, and one numbered above it is
/// untouched. The ledger is a plain value; the module keeps it under a lock, so taking the
/// previous session and installing the new one is one step.
struct CaptionSessionLedger<Session> {
	private var stoppedThrough = 0
	private var current: (id: Int, session: Session)?

	/// Whether a start with this id has not been stopped.
	func mayStart(id: Int) -> Bool { id > stoppedThrough }

	/// Whether the session installed for this id is still the running one.
	func isCurrent(id: Int) -> Bool { current?.id == id }

	/// Installs a session unless its start was stopped or a newer start already holds the
	/// ledger. `previous` is the session it replaced, for the caller to end outside the lock.
	mutating func begin(id: Int, session: Session) -> (installed: Bool, previous: Session?) {
		guard mayStart(id: id), id > (current?.id ?? 0) else { return (false, nil) }
		let previous = current?.session
		current = (id, session)
		return (true, previous)
	}

	/// Stops every start numbered `id` or lower. Returns the running session if it is one of
	/// them, for the caller to end outside the lock.
	mutating func stop(through id: Int) -> Session? {
		stoppedThrough = max(stoppedThrough, id)
		guard let held = current, held.id <= id else { return nil }
		current = nil
		return held.session
	}

	/// Stops every start, now and later.
	mutating func stopAll() -> Session? { stop(through: .max) }
}
