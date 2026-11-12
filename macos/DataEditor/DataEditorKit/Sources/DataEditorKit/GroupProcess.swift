import Foundation

/// A child started as the leader of a process group of its own, so a signal to
/// the group reaches every process it starts. Foundation's `Process` cannot
/// ask for a new group.
final class GroupProcess: @unchecked Sendable {
    let processIdentifier: pid_t
    /// When the leader started, which with its id tells it from a later process given the same id.
    let started: String
    /// The exit code, or the signal that ended it. Set before `onExit` runs.
    private(set) var terminationStatus: Int32 = 0

    /// Starts `executable` with stdin from /dev/null and stdout and stderr to
    /// `output`, and calls `onExit` once it has exited.
    init(executable: URL, arguments: [String], workingDirectory: URL, environment: [String: String],
         output: FileHandle, onExit: @escaping @Sendable (GroupProcess) -> Void) throws {
        var actions: posix_spawn_file_actions_t?
        posix_spawn_file_actions_init(&actions)
        defer { posix_spawn_file_actions_destroy(&actions) }
        posix_spawn_file_actions_addopen(&actions, 0, "/dev/null", O_RDONLY, 0)
        posix_spawn_file_actions_adddup2(&actions, output.fileDescriptor, 1)
        posix_spawn_file_actions_adddup2(&actions, output.fileDescriptor, 2)
        posix_spawn_file_actions_addchdir(&actions, workingDirectory.path)

        var attributes: posix_spawnattr_t?
        posix_spawnattr_init(&attributes)
        defer { posix_spawnattr_destroy(&attributes) }
        // a new group led by the child; no descriptor but 0, 1 and 2 leaks into it;
        // and it gets default signal handling and mask, whatever the app set
        posix_spawnattr_setflags(&attributes, Int16(POSIX_SPAWN_SETPGROUP | POSIX_SPAWN_CLOEXEC_DEFAULT | POSIX_SPAWN_SETSIGDEF | POSIX_SPAWN_SETSIGMASK))
        posix_spawnattr_setpgroup(&attributes, 0)
        var allSignals = sigset_t()
        sigfillset(&allSignals)
        posix_spawnattr_setsigdefault(&attributes, &allSignals)
        var noSignals = sigset_t()
        sigemptyset(&noSignals)
        posix_spawnattr_setsigmask(&attributes, &noSignals)

        let argv = ([executable.path] + arguments).map { strdup($0) } + [nil]
        let envp = environment.map { strdup("\($0.key)=\($0.value)") } + [nil]
        defer { (argv + envp).forEach { free($0) } }
        var pid: pid_t = 0
        let error = posix_spawn(&pid, executable.path, &actions, &attributes, argv, envp)
        guard error == 0 else { throw POSIXError(POSIXErrorCode(rawValue: error) ?? .EINVAL) }
        processIdentifier = pid
        started = startTime(of: pid) ?? ""

        // a thread of its own waits, as ccc runs for as long as the app does
        let leader = pid
        Thread.detachNewThread {
            var status: Int32 = 0
            while waitpid(leader, &status, 0) == -1 && errno == EINTR {}
            // the low seven bits hold the signal that ended it, or zero for an exit
            let signal = status & 0x7f
            self.terminationStatus = signal == 0 ? (status >> 8) & 0xff : signal
            onExit(self)
        }
    }

    /// Sends `signal` to every process in the group.
    func signalGroup(_ signal: Int32) {
        kill(-processIdentifier, signal)
    }
}

/// When `pid` started, or nil if no live process has that id.
func startTime(of pid: pid_t) -> String? {
    var info = proc_bsdinfo()
    let size = Int32(MemoryLayout<proc_bsdinfo>.size)
    guard proc_pidinfo(pid, PROC_PIDTBSDINFO, 0, &info, size) == size else { return nil }
    return "\(info.pbi_start_tvsec).\(info.pbi_start_tvusec)"
}
