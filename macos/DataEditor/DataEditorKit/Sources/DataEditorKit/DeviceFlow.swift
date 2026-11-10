import Foundation

/// GitHub's OAuth device flow: the contributor enters a short code at github.com.
public struct DeviceFlow: Sendable {
    public struct DeviceCode: Sendable, Hashable {
        public let deviceCode: String
        public let userCode: String
        public let verificationURL: URL
        public let interval: Int
    }

    public enum Failure: Error, Equatable, Sendable { case denied, expired, unexpected(String) }

    private let clientID: String
    private let session: URLSession
    private let sleep: @Sendable (Duration) async -> Void

    public init(clientID: String, session: URLSession = .shared,
                sleep: @escaping @Sendable (Duration) async -> Void = { try? await Task.sleep(for: $0) }) {
        self.clientID = clientID
        self.session = session
        self.sleep = sleep
    }

    private func post(_ path: String, _ form: [String: String]) async throws -> JSONValue {
        var request = URLRequest(url: URL(string: "https://github.com\(path)")!)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")
        var components = URLComponents()
        components.queryItems = form.sorted { $0.key < $1.key }.map { URLQueryItem(name: $0.key, value: $0.value) }
        request.httpBody = Data((components.percentEncodedQuery ?? "").utf8)
        let (data, _) = try await session.data(for: request)
        return try JSONDecoder().decode(JSONValue.self, from: data)
    }

    public func start() async throws -> DeviceCode {
        let reply = try await post("/login/device/code", ["client_id": clientID, "scope": "public_repo"])
        guard let device = reply["device_code"]?.string, let user = reply["user_code"]?.string,
              let url = reply["verification_uri"]?.string.flatMap(URL.init(string:)),
              case .number(let interval)? = reply["interval"] else {
            throw Failure.unexpected(reply["error_description"]?.string ?? "GitHub did not start sign-in")
        }
        return DeviceCode(deviceCode: device, userCode: user, verificationURL: url, interval: Int(interval))
    }

    /// Waits for the contributor to enter the code, and returns the token.
    public func token(for code: DeviceCode) async throws -> String {
        var interval = code.interval
        while true {
            await sleep(.seconds(interval))
            let reply = try await post("/login/oauth/access_token", [
                "client_id": clientID, "device_code": code.deviceCode,
                "grant_type": "urn:ietf:params:oauth:grant-type:device_code",
            ])
            if let token = reply["access_token"]?.string { return token }
            switch reply["error"]?.string {
            case "authorization_pending": continue
            case "slow_down":
                if case .number(let next)? = reply["interval"] { interval = Int(next) } else { interval += 5 }
            case "access_denied": throw Failure.denied
            case "expired_token": throw Failure.expired
            default: throw Failure.unexpected(reply["error_description"]?.string ?? "sign-in failed")
            }
        }
    }
}
