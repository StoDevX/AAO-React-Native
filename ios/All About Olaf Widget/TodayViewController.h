//
//  TodayViewController.h
//  All About Olaf Balances Widget
//

#import <UIKit/UIKit.h>

@interface TodayViewController : UIViewController

// Labels
@property (weak, nonatomic) IBOutlet UILabel *printBalanceLabel;
@property (weak, nonatomic) IBOutlet UILabel *oleBalanceLabel;
@property (weak, nonatomic) IBOutlet UILabel *flexBalanceLabel;

// File names/paths
@property (weak, nonatomic) NSString *filePath;
@property (weak, nonatomic) NSString *fileName;
@property (weak, nonatomic) NSString *fileAtPath;

@end
