import DataEditorKit
import Foundation

/// What the first column has chosen: the edits in hand, or a pull request already submitted.
enum Changeset: Hashable {
    case current
    case pullRequest(number: Int)
}

/// What the second column has chosen within a changeset.
enum ChangesetItem: Hashable {
    case overview
    case building(file: String)
}
