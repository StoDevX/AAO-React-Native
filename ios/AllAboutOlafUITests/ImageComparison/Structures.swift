//
//  Structures.swift
//  AllAboutOlafUITests
//
//  https://pspdfkit.com/blog/2021/swift-render-tests-in-practice-part-1/
//  https://pspdfkit.com/blog/2021/swift-render-tests-in-practice-part-2/
//  https://pspdfkit.com/blog/2021/swift-render-tests-in-practice-part-3/
//

import Foundation

struct RGBA {
  let r: UInt8
  let g: UInt8
  let b: UInt8
  let a: UInt8

  func isSimilar(to other: RGBA) -> Bool {
    (r.distance(to: other.r) < 2
      && g.distance(to: other.g) < 2
      && b.distance(to: other.b) < 2
      && a.distance(to: other.a) < 2)
  }
}

/// Comprehensive list of errors that can occur when evaluating a render test.
enum ImageComparisonError: Error {
    // :MARK: Test Setup Errors — see last week's article
    case unsupportedBackingStore(referenceImage: UIImage, actualImage: UIImage)
    case dimensionMismatch(expectedWidth: Int, expectedHeight: Int, actualWidth: Int, actualHeight: Int)

    // :MARK: Actual Comparison Failure
    /// The image has the same dimensions as the reference, but too many pixels differ.
    /// - Parameters:
    ///   - pixelCount:
    ///     The total number of pixels in the image.
    ///   - acceptableMismatchCount:
    ///     The maximum number of pixels that would have been allowed to differ from
    ///     the reference to still be considered a match.
    ///   - actualMismatchCount:
    ///     The actual number of pixels in the image that differed from the reference.
    case imageMismatch(
        pixelCount: Int,
        acceptableMismatchCount: Int,
        actualMismatchCount: Int
    )
}
