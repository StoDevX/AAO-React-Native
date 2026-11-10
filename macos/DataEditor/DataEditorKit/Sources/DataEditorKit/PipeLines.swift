import Foundation

/// The lines `handle` gives until end of file, each without its "\n", and a
/// last line that has none. Lines end at 0x0A alone, so U+2028, U+2029 and
/// U+0085 stay inside one. A failed read ends the stream with its error.
///
/// Each handle gets a thread of its own blocked in `read`, as `FileHandle.bytes`
/// readers in one process take turns: one waiting on a quiet pipe holds up the rest.
func lines(of handle: FileHandle) -> AsyncThrowingStream<Data, any Error> {
    let (stream, continuation) = AsyncThrowingStream<Data, any Error>.makeStream()
    Thread.detachNewThread {
        var chunk = [UInt8](repeating: 0, count: 64 * 1024)
        var line = Data()
        while true {
            let count = chunk.withUnsafeMutableBytes { read(handle.fileDescriptor, $0.baseAddress, $0.count) }
            if count == 0 { break }
            if count < 0 {
                if errno == EINTR { continue }
                continuation.finish(throwing: POSIXError(POSIXErrorCode(rawValue: errno) ?? .EIO))
                return
            }
            var start = 0
            for end in 0..<count where chunk[end] == UInt8(ascii: "\n") {
                line.append(contentsOf: chunk[start..<end])
                continuation.yield(line)
                line = Data()
                start = end + 1
            }
            line.append(contentsOf: chunk[start..<count])
        }
        if !line.isEmpty { continuation.yield(line) }
        continuation.finish()
    }
    return stream
}
