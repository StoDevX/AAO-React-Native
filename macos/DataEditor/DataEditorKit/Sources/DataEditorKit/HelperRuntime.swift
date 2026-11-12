import Foundation
import JavaScriptCore

/// Runs the data editor's helper, built for JavaScriptCore by
/// `scripts/build-data-editor-helper.mjs`, in this process. The scripts reach
/// Node's built-ins through stand-ins that call the host functions here, as
/// `__host`. One serial queue owns the virtual machine, so calls run in order,
/// as the helper's process once answered them; each returns once the promise
/// it made settles, running the timers due before then.
public final class HelperRuntime: @unchecked Sendable {
    public struct Failure: LocalizedError, Equatable, Sendable {
        public let message: String
        public var errorDescription: String? { message }
        public init(message: String) { self.message = message }
    }

    /// The version of the handlers' parameters and replies this app speaks.
    /// `PROTOCOL` in `scripts/data-editor-helper.mjs` changes with it.
    public static let protocolVersion = 2

    /// The loaded helper's `PROTOCOL`.
    public let helperProtocol: Int

    private let queue: DispatchQueue
    private let context: JSContext
    private let handlers: JSValue
    private let timers: TimerLoop

    /// Loads `scripts/helper.js` and makes its handlers over `data` and `out`.
    /// A call still waiting on its timers after `callLimit` fails, so it does
    /// not hold up the calls behind it.
    public init(scripts: URL, data: URL, out: URL, oxfmt: URL, callLimit: Duration = .seconds(60)) throws {
        let helperFile = scripts.appending(path: "helper.js")
        let source = try String(contentsOf: helperFile, encoding: .utf8)
        let queue = DispatchQueue(label: "com.drewvolz.allaboutolaf-data-editor.helper")
        let timers = TimerLoop(limit: callLimit)
        let (context, handlers, helperProtocol) = try queue.sync { () throws -> (JSContext, JSValue, Int) in
            let machine = JSVirtualMachine()!
            let context = JSContext(virtualMachine: machine)!
            Self.install(in: context, argv: ["node", helperFile.path], timers: timers, scripts: scripts, oxfmt: oxfmt, machine: machine) {
                FileHandle.standardError.write(Data($0.utf8))
            }
            var thrown: String?
            context.exceptionHandler = { _, error in thrown = Self.describe(error) }
            context.evaluateScript(source, withSourceURL: helperFile)
            guard thrown == nil, let helper = context.objectForKeyedSubscript("dataEditorHelper"), helper.isObject else {
                throw Failure(message: thrown ?? "helper.js did not define dataEditorHelper")
            }
            let options = ["dataDir": data.path, "outDir": out.path, "bundleData": scripts.appending(path: "bundle-data.js").path]
            let handlers = helper.forProperty("createHandlers").call(withArguments: [options])
            if let thrown { throw Failure(message: thrown) }
            // an error thrown later belongs to a call, which reports it itself
            context.exceptionHandler = { _, error in
                FileHandle.standardError.write(Data("helper: \(Self.describe(error))\n".utf8))
            }
            return (context, handlers!, Int(helper.forProperty("PROTOCOL").toInt32()))
        }
        self.queue = queue
        self.timers = timers
        self.context = context
        self.handlers = handlers
        self.helperProtocol = helperProtocol
    }

    /// Calls the handler `method` with `paramsJSON`, and returns its reply as JSON.
    public func call(_ method: String, paramsJSON: String) async throws -> String {
        try await withCheckedThrowingContinuation { continuation in
            queue.async { continuation.resume(with: Result { try self.run(method, paramsJSON) }) }
        }
    }

    private func run(_ method: String, _ paramsJSON: String) throws -> String {
        guard let handler = handlers.forProperty(method), handler.isObject else { throw Failure(message: "no method \(method)") }
        let json = context.objectForKeyedSubscript("JSON")!
        let params = json.invokeMethod("parse", withArguments: [paramsJSON])!
        let box = context.objectForKeyedSubscript("__invoke").call(withArguments: [handler, params])!
        timers.drain { box.forProperty("done").toBool() }
        guard box.forProperty("done").toBool() else {
            throw Failure(message: timers.isEmpty ? "The helper's \(method) never finished" : "The helper's \(method) did not finish in time")
        }
        if let error = box.forProperty("error"), error.isString { throw Failure(message: error.toString()) }
        // a handler that resolves to nothing answers null, which JSON.stringify would leave out
        guard let value = box.forProperty("value"), !value.isUndefined else { return "null" }
        return json.invokeMethod("stringify", withArguments: [value])?.toString() ?? "null"
    }

    /// An uncaught error as Node prints one: "Name: message", then the stack.
    private static func describe(_ error: JSValue?) -> String {
        guard let error else { return "Error" }
        let stack = error.forProperty("stack")?.toString() ?? ""
        return stack.isEmpty || stack == "undefined" ? error.toString() : "\(error.toString()!)\n\(stack)"
    }

    /// Runs `path` in a fresh context with `args`, as Node would run it in a
    /// process of its own, and returns its exit code and error output.
    private static func runScript(_ path: String, args: [String], scripts: URL, oxfmt: URL, machine: JSVirtualMachine,
                                  limit: Duration) -> [String: Any] {
        let context = JSContext(virtualMachine: machine)!
        let timers = TimerLoop(limit: limit)
        var errors = ""
        var code: Int32 = 0
        install(in: context, argv: ["node", path] + args, timers: timers, scripts: scripts, oxfmt: oxfmt, machine: machine) { errors += $0 }
        context.exceptionHandler = { context, error in
            guard let context, let error else { return }
            if error.isInstance(of: context.objectForKeyedSubscript("__Exit")) {
                code = error.forProperty("code").toInt32()
            } else {
                errors += describe(error) + "\n"
                code = 1
            }
        }
        guard let source = try? String(contentsOfFile: path, encoding: .utf8) else {
            return ["code": 1, "stderr": "Error: ENOENT: no such file or directory, open '\(path)'\n"]
        }
        context.evaluateScript(source, withSourceURL: URL(filePath: path))
        timers.drain { false }
        if code == 0, let exitCode = context.evaluateScript("process.exitCode"), exitCode.isNumber { code = exitCode.toInt32() }
        return ["code": code, "stderr": errors]
    }

    /// Gives `context` the host functions and globals the stand-ins call.
    private static func install(in context: JSContext, argv: [String], timers: TimerLoop, scripts: URL, oxfmt: URL,
                                machine: JSVirtualMachine, stderr: @escaping (String) -> Void) {
        let fm = FileManager.default
        let host = JSValue(newObjectIn: context)!
        func define(_ name: String, _ block: Any) { host.setObject(block, forKeyedSubscript: name as NSString) }
        // bytes that are not UTF-8 read as U+FFFD, as Node reads them
        define("readFile", { (path: String) -> Any in
            fm.contents(atPath: path).map { String(decoding: $0, as: UTF8.self) } ?? NSNull()
        } as @convention(block) (String) -> Any)
        define("writeFile", { (path: String, text: String) in
            failing("open", path) { try Data(text.utf8).write(to: URL(filePath: path)) }
        } as @convention(block) (String, String) -> Void)
        define("readdir", { (path: String) -> Any in (try? fm.contentsOfDirectory(atPath: path)) ?? NSNull() } as @convention(block) (String) -> Any)
        define("stat", { (path: String) -> Any in
            var isDirectory: ObjCBool = false
            guard fm.fileExists(atPath: path, isDirectory: &isDirectory), let attributes = try? fm.attributesOfItem(atPath: path) else { return NSNull() }
            let modified = (attributes[.modificationDate] as? Date)?.timeIntervalSince1970 ?? 0
            return ["isDirectory": isDirectory.boolValue, "size": (attributes[.size] as? NSNumber) ?? 0, "mtimeMs": modified * 1000]
        } as @convention(block) (String) -> Any)
        define("mkdir", { (path: String, recursive: Bool) in
            failing("mkdir", path) { try fm.createDirectory(atPath: path, withIntermediateDirectories: recursive) }
        } as @convention(block) (String, Bool) -> Void)
        // force, as Node's rmSync takes it: a missing path is no error
        define("rm", { (path: String, force: Bool) in
            if force && !fm.fileExists(atPath: path) { return }
            failing("rm", path) { try fm.removeItem(atPath: path) }
        } as @convention(block) (String, Bool) -> Void)
        // rename(2) replaces the destination in one step, as Node's does
        define("rename", { (from: String, to: String) in
            if Darwin.rename(from, to) != 0 { throwInJavaScript(errno: errno, "rename", from) }
        } as @convention(block) (String, String) -> Void)
        define("copyFile", { (from: String, to: String) in
            failing("copyfile", from) {
                if fm.fileExists(atPath: to) { try fm.removeItem(atPath: to) }
                try fm.copyItem(atPath: from, toPath: to)
            }
        } as @convention(block) (String, String) -> Void)
        define("realpath", { (path: String) -> String in URL(filePath: path).resolvingSymlinksInPath().path } as @convention(block) (String) -> String)
        define("mkdtemp", { (prefix: String) -> String in
            let path = prefix + String(UUID().uuidString.prefix(6))
            try? fm.createDirectory(atPath: path, withIntermediateDirectories: true)
            return path
        } as @convention(block) (String) -> String)
        define("cwd", { fm.currentDirectoryPath } as @convention(block) () -> String)
        define("runScript", { (path: String, args: [String]) -> Any in
            runScript(path, args: args, scripts: scripts, oxfmt: oxfmt, machine: machine, limit: timers.limit)
        } as @convention(block) (String, [String]) -> Any)
        define("oxfmt", { (file: String, source: String, options: String) -> Any in
            format(file: file, source: source, options: options, oxfmt: oxfmt)
        } as @convention(block) (String, String, String) -> Any)
        context.setObject(host, forKeyedSubscript: "__host" as NSString)
        context.setObject(scripts.path, forKeyedSubscript: "__scriptDir" as NSString)
        context.setObject(scripts.appending(path: "helper.js").absoluteString, forKeyedSubscript: "__scriptURL" as NSString)
        context.setObject(argv, forKeyedSubscript: "__argv" as NSString)
        context.setObject({ (callback: JSValue, delay: Double) -> Int in timers.add(callback, after: delay) }
            as @convention(block) (JSValue, Double) -> Int, forKeyedSubscript: "__setTimeout" as NSString)
        context.setObject({ (id: Int) in timers.cancel(id) } as @convention(block) (Int) -> Void, forKeyedSubscript: "clearTimeout" as NSString)
        context.setObject({ (text: String) in stderr(text) } as @convention(block) (String) -> Void, forKeyedSubscript: "__stderr" as NSString)
        context.evaluateScript(#"""
            globalThis.setTimeout = (callback, delay, ...args) => __setTimeout(() => callback(...args), delay ?? 0)
            globalThis.setImmediate = (callback, ...args) => __setTimeout(() => callback(...args), 0)
            globalThis.queueMicrotask = (callback) => Promise.resolve().then(callback)
            const __line = (...values) => values.map((value) => {
                if (typeof value === 'string') return value
                try { return JSON.stringify(value) } catch { return String(value) }
            }).join(' ') + '\n'
            globalThis.console = {log: (...v) => __stderr(__line(...v)), info: (...v) => __stderr(__line(...v)),
                warn: (...v) => __stderr(__line(...v)), error: (...v) => __stderr(__line(...v))}
            globalThis.__Exit = class { constructor(code) { this.code = code } }
            globalThis.process = {argv: __argv, env: {}, platform: 'darwin', versions: {node: '24'}, execPath: 'node',
                exitCode: undefined, exit(code) { throw new __Exit(code ?? process.exitCode ?? 0) }, cwd: () => __host.cwd(),
                stdout: {write: (text) => { __stderr(String(text)); return true }},
                stderr: {write: (text) => { __stderr(String(text)); return true }},
                emitWarning() {}, on() {}, nextTick: (callback, ...args) => queueMicrotask(() => callback(...args))}
            globalThis.__invoke = (handler, params) => {
                let box = {done: false}
                new Promise((resolve) => resolve(handler(params))).then(
                    (value) => { box.done = true; box.value = value },
                    (error) => { box.done = true; box.error = error instanceof Error ? error.message : String(error) })
                return box
            }
            """#)
    }

    /// Writes `source` to a file named like `file` in a folder of its own,
    /// formats it there with oxfmt's binary and `options` as its config, and
    /// reads the result back, as oxfmt's `format` replies.
    private static func format(file: String, source: String, options: String, oxfmt: URL) -> [String: Any] {
        let fm = FileManager.default
        let folder = fm.temporaryDirectory.appending(path: "data-editor-oxfmt-\(UUID().uuidString)")
        defer { try? fm.removeItem(at: folder) }
        let target = folder.appending(path: (file as NSString).lastPathComponent)
        let config = folder.appending(path: ".oxfmtrc.json")
        do {
            try fm.createDirectory(at: folder, withIntermediateDirectories: true)
            try Data(source.utf8).write(to: target)
            try Data(options.utf8).write(to: config)
            let process = Process()
            let errors = Pipe()
            process.executableURL = oxfmt
            process.arguments = ["-c", config.path, target.path]
            process.currentDirectoryURL = folder
            process.standardOutput = FileHandle.nullDevice
            process.standardError = errors
            try process.run()
            let said = errors.fileHandleForReading.readDataToEndOfFile()
            process.waitUntilExit()
            guard process.terminationStatus == 0 else {
                return ["code": source, "errors": [["message": String(decoding: said, as: UTF8.self)]]]
            }
            return ["code": try String(contentsOf: target, encoding: .utf8), "errors": [Any]()]
        } catch {
            return ["code": source, "errors": [["message": error.localizedDescription]]]
        }
    }
}

/// Runs a file call for the scripts, and throws its failure in JavaScript as Node would.
private func failing(_ syscall: String, _ path: String, _ body: () throws -> Void) {
    do { try body() } catch { throwInJavaScript(errno: errno(of: error as NSError), syscall, path) }
}

/// The POSIX error behind a Foundation file error.
private func errno(of error: NSError) -> Int32 {
    if error.domain == NSPOSIXErrorDomain { return Int32(error.code) }
    if let underlying = error.userInfo[NSUnderlyingErrorKey] as? NSError, underlying.domain == NSPOSIXErrorDomain { return Int32(underlying.code) }
    switch error.code {
    case NSFileNoSuchFileError, NSFileReadNoSuchFileError: return ENOENT
    case NSFileWriteFileExistsError: return EEXIST
    case NSFileWriteNoPermissionError, NSFileReadNoPermissionError: return EACCES
    case NSFileWriteOutOfSpaceError: return ENOSPC
    case NSFileWriteVolumeReadOnlyError: return EROFS
    default: return EIO
    }
}

/// Throws in the calling script an error shaped like Node's: "ENOENT: no such
/// file or directory, open '<path>'", with its `errno`, `code`, `syscall` and `path`.
private func throwInJavaScript(errno number: Int32, _ syscall: String, _ path: String) {
    guard let context = JSContext.current() else { return }
    let names: [Int32: String] = [ENOENT: "ENOENT", EEXIST: "EEXIST", EACCES: "EACCES", EPERM: "EPERM", ENOTDIR: "ENOTDIR",
                                  EISDIR: "EISDIR", ENOTEMPTY: "ENOTEMPTY", ENOSPC: "ENOSPC", EROFS: "EROFS", EXDEV: "EXDEV"]
    let code = names[number] ?? "EIO"
    let description = String(cString: strerror(number))
    let error = JSValue(newErrorFromMessage: "\(code): \(description.prefix(1).lowercased() + description.dropFirst()), \(syscall) '\(path)'", in: context)!
    error.setObject(-Int(number), forKeyedSubscript: "errno" as NSString)
    error.setObject(code, forKeyedSubscript: "code" as NSString)
    error.setObject(syscall, forKeyedSubscript: "syscall" as NSString)
    error.setObject(path, forKeyedSubscript: "path" as NSString)
    context.exception = error
}

/// The timers one context has set, run in the order they fall due.
private final class TimerLoop {
    /// How long one drain waits on timers before it gives up.
    let limit: Duration
    private var timers: [(id: Int, due: Date, callback: JSValue)] = []
    private var next = 1

    func add(_ callback: JSValue, after milliseconds: Double) -> Int {
        let id = next
        next += 1
        timers.append((id, Date.now.addingTimeInterval(max(milliseconds, 0) / 1000), callback))
        return id
    }

    init(limit: Duration) { self.limit = limit }

    var isEmpty: Bool { timers.isEmpty }

    func cancel(_ id: Int) { timers.removeAll { $0.id == id } }

    /// Runs timers in the order they fall due, waiting for each, until `done`
    /// holds, none is left, or the next falls due after `limit` from now. A
    /// timer left over runs in a later drain.
    func drain(until done: () -> Bool) {
        let components = limit.components
        let deadline = Date.now.addingTimeInterval(Double(components.seconds) + Double(components.attoseconds) / 1e18)
        while !done(), let index = timers.indices.min(by: { timers[$0].due < timers[$1].due }) {
            guard timers[index].due <= deadline else { return }
            let timer = timers.remove(at: index)
            let wait = timer.due.timeIntervalSinceNow
            if wait > 0 { Thread.sleep(forTimeInterval: wait) }
            timer.callback.call(withArguments: [])
        }
    }
}
