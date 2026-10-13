#import <AVFoundation/AVFoundation.h>
#import "RadioScrubTap.h"

NS_ASSUME_NONNULL_BEGIN
/// Decodes a station's MP3 broadcast on the device and renders its scratch buffer.
@interface RadioScrubPCM : RadioScrubTap <NSURLSessionDataDelegate>
- (BOOL)attachToURL:(NSURL *)url player:(AVPlayer *)player;
- (void)setPitch:(double)percent;
- (void)setQuartzLocked:(BOOL)locked;
- (void)setEffect:(NSString *)effect enabled:(BOOL)enabled amount:(double)amount;
- (void)setEffectParameter:(NSString *)effect parameter:(NSString *)parameter value:(double)value;
- (void)setPlaying:(BOOL)playing;
@end
NS_ASSUME_NONNULL_END
