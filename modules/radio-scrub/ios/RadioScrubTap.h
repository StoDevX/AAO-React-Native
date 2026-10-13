#import <AVFoundation/AVFoundation.h>

NS_ASSUME_NONNULL_BEGIN

/// Owns a native audio tap and its bounded history for a single player item.
@interface RadioScrubTap : NSObject
- (BOOL)attachToItem:(AVPlayerItem *)item;
- (void)detach;
- (void)beginScratch;
- (void)moveWithRate:(double)rate;
- (void)releaseWithRate:(double)rate;
- (void)goLive;
- (NSDictionary<NSString *, id> *)status;
@end

NS_ASSUME_NONNULL_END
