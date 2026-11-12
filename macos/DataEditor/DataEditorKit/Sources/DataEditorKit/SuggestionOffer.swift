import FoundationModels

/// What the submit sheet offers for suggesting a summary, by whether the
/// on-device model can run.
public enum SuggestionOffer: Equatable, Sendable {
    /// the Suggest button, ready
    case offered
    /// the Suggest button, dimmed, with what the contributor can do about it
    case waiting(String)
    /// no button: this Mac cannot run the model
    case hidden

    public init(_ availability: SystemLanguageModel.Availability) {
        switch availability {
        case .available: self = .offered
        case .unavailable(.appleIntelligenceNotEnabled): self = .waiting("Turn on Apple Intelligence in System Settings to get a suggestion.")
        case .unavailable(.modelNotReady): self = .waiting("The on-device model is still downloading.")
        case .unavailable: self = .hidden
        }
    }
}
