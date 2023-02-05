//
//  UIImage+Extensions.swift
//  AllAboutOlafUITests
//
//  https://pspdfkit.com/blog/2021/swift-render-tests-in-practice-part-1/
//  https://pspdfkit.com/blog/2021/swift-render-tests-in-practice-part-2/
//  https://pspdfkit.com/blog/2021/swift-render-tests-in-practice-part-3/
//

import XCTest
import UIKit

extension UIImage {

  func ensureMatches(reference: UIImage, requiredAccuracy: Double) throws {
    // For simplicity, require images to be backed by Core Graphics.
    // This will be true for most images. Notable exceptions are images
    // obtained from Core Image.
    guard
      let pixels = cgImage,
      let referencePixels = reference.cgImage
    else {
      throw ImageComparisonError.unsupportedBackingStore(
          referenceImage: reference,
          actualImage: self
      )
    }

    // We cannot compare images that don't have the same dimensions.
    guard
      referencePixels.width == pixels.width,
      referencePixels.height == pixels.height
    else {
      throw ImageComparisonError.dimensionMismatch(
          expectedWidth: referencePixels.width,
          expectedHeight: referencePixels.height,
          actualWidth: pixels.width,
          actualHeight: pixels.height
      )
    }

    // Unfortunately, Core Graphics doesn’t offer direct access to the
    // underlying uncompressed buffer for an image. We can use this to
    // our advantage to give us some flexibility when it comes to
    // storing/representing images for different purposes, which we’ll do
    // in a helper function.
    let deviceRGB = CGColorSpaceCreateDeviceRGB()
    let imageBuffer = try makeRGBABuffer(
      for: pixels,
      colorSpace: deviceRGB
    )
    // Since the function returns an unmanaged buffer — which makes sense
    // for what we want — never let it escape without deallocating it!
    defer {
      imageBuffer.deallocate()
    }
    let referenceBuffer = try makeRGBABuffer(
      for: referencePixels,
      colorSpace: deviceRGB
    )
    defer {
      referenceBuffer.deallocate()
    }

    // We already checked this above, but in case we made a mistake in our
    // helper, fail here.
    let pixelCount = imageBuffer.count
    precondition(
      pixelCount == referenceBuffer.count,
      "Cannot compare contents of buffer that differ in size"
    )
    // Now we iterate over all the pixels, counting the mismatches.
    var mismatchingPixelCount = 0
    for i in 0..<pixelCount {
      if !imageBuffer[i].isSimilar(to: referenceBuffer[i]) {
        mismatchingPixelCount += 1
      }
    }

    // Finally, throw an error if the number of mismatches exceeds what the caller allowed.
    let acceptableMismatchCount = Int(
      Double(pixelCount) * (1 - requiredAccuracy)
    )
    if acceptableMismatchCount < mismatchingPixelCount {
      throw ImageComparisonError.imageMismatch(
          pixelCount: pixelCount,
          acceptableMismatchCount: acceptableMismatchCount,
          actualMismatchCount: mismatchingPixelCount
      )
    }
  }

  private func makeRGBABuffer(for image: CGImage, colorSpace: CGColorSpace) -> UnsafeMutableBufferPointer<RGBA>
  {
    precondition(
      colorSpace.numberOfComponents == 3
        && colorSpace.model == .rgb,
      "For RGBA, we need a compatible colorspace"
    )

    let bitsPerComponent = 8
    let bytesPerPixel = 4  // 3 components plus alpha.
    let width = image.width
    let height = image.height

    // We make a buffer that can fit all the pixels to back a `CGContext`.
    let imageBuffer = UnsafeMutableBufferPointer<RGBA>
      .allocate(capacity: width * height)

    // And we make sure the buffer is empty.
    imageBuffer.initialize(repeating: .init(r: 0, g: 0, b: 0, a: 0))

    // Since we’ve handpicked the configuration, we know this can’t fail.
    let context = CGContext(
      data: imageBuffer.baseAddress,
      width: width,
      height: height,
      bitsPerComponent: bitsPerComponent,
      bytesPerRow: width * bytesPerPixel,
      space: colorSpace,
      bitmapInfo: (
        CGImageAlphaInfo.premultipliedFirst.rawValue
        | CGBitmapInfo.byteOrder32Big.rawValue)
    )!

    // Draw the image into the context to get the pixel data into our buffer.
    context.draw(image, in: .init(x: 0, y: 0, width: width, height: height))

    return imageBuffer
  }
}
