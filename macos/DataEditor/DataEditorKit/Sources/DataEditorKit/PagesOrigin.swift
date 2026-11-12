import Foundation

/// Where the phone and the local Worker read the build from. The Bonjour name
/// (System Settings → General → Sharing → Local hostname) is DNS-safe, where the
/// computer's display name may have spaces and apostrophes.
public func pagesOrigin(localHostName: String, port: Int) -> String {
    "http://\(localHostName).local:\(port)/"
}

/// The local Worker's St. Olaf routes, as the mDNS advert names them.
public let cccLocalBase = URL(string: "http://localhost:8787/edu.stolaf/v1/")!
