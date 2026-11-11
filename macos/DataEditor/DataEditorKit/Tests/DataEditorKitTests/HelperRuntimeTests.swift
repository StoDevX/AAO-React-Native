import Foundation
import Testing
@testable import DataEditorKit

/// A folder holding `helper.js` (the handlers below) and `bundle-data.js`, as the build writes them.
private func scripts(handlers: String, bundleData: String = "") throws -> URL {
    let folder = FileManager.default.temporaryDirectory.appending(path: "helper runtime \(UUID().uuidString)/scripts")
    try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
    try Data("globalThis.dataEditorHelper = {PROTOCOL: 7, createHandlers: (options) => ({\(handlers)})}".utf8)
        .write(to: folder.appending(path: "helper.js"))
    try Data(bundleData.utf8).write(to: folder.appending(path: "bundle-data.js"))
    return folder
}

private func runtime(_ folder: URL, oxfmt: URL = URL(filePath: "/usr/bin/false")) throws -> HelperRuntime {
    let workspace = folder.deletingLastPathComponent()
    return try HelperRuntime(scripts: folder, data: workspace.appending(path: "data"), out: workspace.appending(path: "out"), oxfmt: oxfmt)
}

/// A stand-in for oxfmt's binary: writes `output` over the file it is given, after keeping its config beside it.
private func fakeOxfmt(output: String, exitCode: Int32 = 0) throws -> URL {
    let file = FileManager.default.temporaryDirectory.appending(path: "oxfmt \(UUID().uuidString)")
    try Data("""
        #!/bin/sh
        printf '%s' '\(output)' > "$3"
        echo 'oxfmt said no' >&2
        exit \(exitCode)
        """.utf8).write(to: file)
    try FileManager.default.setAttributes([.posixPermissions: 0o755], ofItemAtPath: file.path)
    return file
}

/// What `runScript` hands back, and whether the script's globals reached the helper's context.
private struct Ran: Decodable, Equatable { let code: Int; let stderr: String; let leaked: Bool }

/// What the oxfmt stand-in hands back.
private struct Formatted: Decodable, Equatable {
    struct Problem: Decodable, Equatable { let message: String }
    let code: String
    let errors: [Problem]
}

struct HelperRuntimeTests {
    @Test func answersWithTheHandlersReplyInItsOwnKeyOrder() async throws {
        let helper = try runtime(try scripts(handlers: "echo: async (params) => params"))
        #expect(try await helper.call("echo", paramsJSON: #"{"b":1,"a":[2,"x"]}"#) == #"{"b":1,"a":[2,"x"]}"#)
        #expect(helper.helperProtocol == 7)
    }

    @Test func throwsTheHandlersMessage() async throws {
        let helper = try runtime(try scripts(handlers: "fail: () => { throw new Error('nope') }"))
        await #expect(throws: HelperRuntime.Failure(message: "nope")) { try await helper.call("fail", paramsJSON: "{}") }
        await #expect(throws: HelperRuntime.Failure(message: "no method missing")) { try await helper.call("missing", paramsJSON: "{}") }
    }

    @Test func runsTimersBeforeAnswering() async throws {
        let helper = try runtime(try scripts(handlers: """
            later: () => new Promise((resolve) => setTimeout(() => resolve('late'), 20)),
            cancelled: () => new Promise((resolve) => { let t = setTimeout(() => resolve('first'), 5); clearTimeout(t); setTimeout(() => resolve('second'), 10) }),
            """))
        #expect(try await helper.call("later", paramsJSON: "{}") == #""late""#)
        #expect(try await helper.call("cancelled", paramsJSON: "{}") == #""second""#)
    }

    @Test func failsACallWhosePromiseNeverSettles() async throws {
        let helper = try runtime(try scripts(handlers: "hang: () => new Promise(() => {})"))
        await #expect(throws: HelperRuntime.Failure(message: "The helper's hang never finished")) { try await helper.call("hang", paramsJSON: "{}") }
    }

    @Test func readsAndWritesFilesForTheScripts() async throws {
        let folder = try scripts(handlers: """
            files: async () => {
                let dir = __scriptDir + '/../data/sub'
                __host.mkdir(dir, true)
                __host.writeFile(dir + '/b.yaml', 'b: 1\\n')
                __host.writeFile(dir + '/a.yaml', 'a: 1\\n')
                __host.rename(dir + '/a.yaml', dir + '/c.yaml')
                let listed = __host.readdir(dir).sort()
                let read = __host.readFile(dir + '/c.yaml')
                let missing = [__host.readFile(dir + '/gone.yaml'), __host.stat(dir + '/gone.yaml'), __host.readdir(dir + '/gone')]
                let stat = __host.stat(dir)
                __host.rm(dir)
                return {listed, read, missing, isDirectory: stat.isDirectory, gone: __host.stat(dir)}
            }
            """)
        let reply = try await runtime(folder).call("files", paramsJSON: "{}")
        #expect(reply == #"{"listed":["b.yaml","c.yaml"],"read":"a: 1\n","missing":[null,null,null],"isDirectory":true,"gone":null}"#)
    }

    /// The helper runs bundle-data as a second program, and reads its exit code and its last error line.
    @Test func runsAScriptInItsOwnContext() async throws {
        let folder = try scripts(
            handlers: """
                run: async (params) => ({...__host.runScript(__scriptDir + '/bundle-data.js', params.args), leaked: globalThis.leaked === true}),
                """,
            bundleData: """
                if (process.argv[2] === 'fail') throw new TypeError('bad data')
                if (process.argv[2] === 'exit') process.exit(3)
                globalThis.leaked = true
                setTimeout(() => { process.exitCode = process.argv.length }, 5)
                """)
        let helper = try runtime(folder)
        func run(_ args: String) async throws -> Ran {
            try JSONDecoder().decode(Ran.self, from: Data(try await helper.call("run", paramsJSON: #"{"args":\#(args)}"#).utf8))
        }
        #expect(try await run(#"["ok","x"]"#) == Ran(code: 4, stderr: "", leaked: false))
        #expect(try await run(#"["exit"]"#) == Ran(code: 3, stderr: "", leaked: false))
        let failed = try await run(#"["fail"]"#)
        #expect(failed.code == 1)
        #expect(failed.stderr.hasPrefix("TypeError: bad data\n"))
    }

    @Test func formatsThroughTheOxfmtBinary() async throws {
        let folder = try scripts(handlers: """
            format: async (params) => __host.oxfmt(params.file, params.text, JSON.stringify({useTabs: true})),
            """)
        func format(_ helper: HelperRuntime) async throws -> Formatted {
            let reply = try await helper.call("format", paramsJSON: #"{"file":"building-hours/1-1-cage.yaml","text":"a:   1"}"#)
            return try JSONDecoder().decode(Formatted.self, from: Data(reply.utf8))
        }
        #expect(try await format(try runtime(folder, oxfmt: try fakeOxfmt(output: "a: 1"))) == Formatted(code: "a: 1", errors: []))
        // a refusal hands the text back unchanged, with oxfmt's own words
        #expect(try await format(try runtime(folder, oxfmt: try fakeOxfmt(output: "", exitCode: 1)))
            == Formatted(code: "a:   1", errors: [.init(message: "oxfmt said no\n")]))
    }

    /// A write Node would refuse must be refused, not reported done.
    @Test func failsAWriteAsNodeDoes() async throws {
        let folder = try scripts(handlers: """
            write: async () => {
                let file = __scriptDir + '/../missing/a.yaml'
                try { __host.writeFile(file, 'a') } catch (error) { return {code: error.code, message: error.message, file, errno: String(error.errno), syscall: error.syscall, path: error.path} }
                return 'written'
            },
            remove: async () => {
                __host.rm(__scriptDir + '/../gone', true)
                try { __host.rm(__scriptDir + '/../gone', false) } catch (error) { return error.code }
                return 'removed'
            },
            """)
        let helper = try runtime(folder)
        let written = try JSONSerialization.jsonObject(with: Data(try await helper.call("write", paramsJSON: "{}").utf8)) as! [String: String]
        #expect(written["code"] == "ENOENT")
        #expect(written["errno"] == "-2" && written["syscall"] == "open" && written["path"] == written["file"])
        #expect(written["message"] == "ENOENT: no such file or directory, open '\(written["file"]!)'")
        #expect(try await helper.call("remove", paramsJSON: "{}") == #""ENOENT""#)
    }

    /// The scripts save a data file by renaming a finished copy over it, which must never leave neither.
    @Test func renamesOverAFileInOneStep() async throws {
        let folder = try scripts(handlers: """
            rename: async () => {
                let dir = __scriptDir + '/..'
                __host.writeFile(dir + '/a.yaml', 'old')
                __host.writeFile(dir + '/_a.yaml.next', 'new')
                __host.rename(dir + '/_a.yaml.next', dir + '/a.yaml')
                let replaced = __host.readFile(dir + '/a.yaml')
                let code = null
                try { __host.rename(dir + '/_missing.next', dir + '/a.yaml') } catch (error) { code = error.code }
                return {replaced, code, kept: __host.readFile(dir + '/a.yaml')}
            },
            """)
        #expect(try await runtime(folder).call("rename", paramsJSON: "{}") == #"{"replaced":"new","code":"ENOENT","kept":"new"}"#)
    }

    /// Node reads a file that is not UTF-8 with U+FFFD in place of its bad bytes; it is not missing.
    @Test func readsAFileThatIsNotUTF8AsNodeDoes() async throws {
        let folder = try scripts(handlers: "read: async () => __host.readFile(__scriptDir + '/../latin1.yaml'),")
        try Data([0x61, 0xE9, 0x62]).write(to: folder.deletingLastPathComponent().appending(path: "latin1.yaml"))
        #expect(try await runtime(folder).call("read", paramsJSON: "{}") == "\"a\u{FFFD}b\"")
    }

    /// A handler that resolves to nothing answers null, which the app reads as JSON.
    @Test func answersNullForAHandlerThatReturnsNothing() async throws {
        let helper = try runtime(try scripts(handlers: "nothing: async () => {},"))
        #expect(try await helper.call("nothing", paramsJSON: "{}") == "null")
    }

    /// A call waiting on a far-off timer must give up, not hold every later call behind it.
    @Test func givesUpOnACallThatWaitsTooLong() async throws {
        let folder = try scripts(handlers: "slow: () => new Promise((resolve) => setTimeout(resolve, 5000)),")
        let workspace = folder.deletingLastPathComponent()
        let helper = try HelperRuntime(scripts: folder, data: workspace.appending(path: "data"), out: workspace.appending(path: "out"),
                                       oxfmt: URL(filePath: "/usr/bin/false"), callLimit: .milliseconds(200))
        let started = ContinuousClock.now
        await #expect(throws: HelperRuntime.Failure(message: "The helper's slow did not finish in time")) {
            try await helper.call("slow", paramsJSON: "{}")
        }
        #expect(ContinuousClock.now - started < .seconds(2))
    }
}
