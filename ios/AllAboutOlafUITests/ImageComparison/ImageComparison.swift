//
//  UITests+Extensions.swift
//  AllAboutOlafUITests
//
//  https://pspdfkit.com/blog/2021/swift-render-tests-in-practice-part-1/
//  https://pspdfkit.com/blog/2021/swift-render-tests-in-practice-part-2/
//  https://pspdfkit.com/blog/2021/swift-render-tests-in-practice-part-3/
//

import XCTest

func assert(
  image imageProducer: @autoclosure () -> UIImage,
  matches reference: UIImage,
  requiredAccuracy: Double,
  comparisonName: String,
  file: StaticString = #file,
  line: UInt = #line
) {
  let image = imageProducer()

  do {
    try image.ensureMatches(reference: reference, requiredAccuracy: requiredAccuracy)
  } catch let ImageComparisonError.imageMismatch(
      pixelCount: totalPixels,
      acceptableMismatchCount: acceptable,
      actualMismatchCount: actual
  ) {
    XCTContext.runActivity(named: comparisonName) { activity in
      let imageAttachment = XCTAttachment(image: image)
      imageAttachment.name = "Actual render"
      activity.add(imageAttachment)

      let referenceAttachment = XCTAttachment(image: reference)
      referenceAttachment.name = "Reference image"
      activity.add(referenceAttachment)

      // New: Generate the difference image and attach it.
      let fullFrame = CGRect(origin: .zero, size: reference.size)
      let renderer = UIGraphicsImageRenderer(size: fullFrame.size)
      let difference = renderer.image { context in
        // Produce black pixels wherever things are the same.
        reference.draw(in: fullFrame)
        image.draw(in: fullFrame, blendMode: .difference, alpha: 1)

        // Highlight everything not black — aka the differences — in red.
        // This step is optional, but I’ve found it to be helpful in some cases,
        // e.g. where the differences are subtle and tinted themselves.
        UIColor.red.withAlphaComponent(0.5).setFill()
        context.fill(fullFrame, blendMode: .colorDodge)
      }

      let differenceAttachment = XCTAttachment(image: difference)
      differenceAttachment.name = "Diff image"
      activity.add(differenceAttachment)

      XCTFail(
        "Image with \(totalPixels) pixels differed from reference by \(actual) pixels (allowed: \(acceptable)",
        file: file,
        line: line
      )
    }
  } catch{
    print("Something very bad happened and we're note sure how to recover.")
  }
}
