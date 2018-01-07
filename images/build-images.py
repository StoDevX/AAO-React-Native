#!/usr/bin/env python3
'''Process building hours image files for distribution'''

import concurrent.futures
import subprocess
import argparse
import glob
import os


def convert_file(infile, outfile, *, kind='.jpg', width, quant_table=5, quality=29.4):
    print(f'{infile} at w{str(width)}, qt{str(quant_table)}, q{str(quality)}')
    if not os.path.exists(outfile):
        if kind == '.jpg':
            subprocess.run([
                '/usr/local/bin/convert',
                infile,
                '-resize', str(width),
                outfile + '.resized.jpg',
            ], check=True)
            subprocess.run([
                '/usr/local/opt/mozjpeg/bin/cjpeg',
                '-quant-table', str(quant_table),
                '-quality', str(quality),
                '-outfile', outfile,
                outfile + '.resized.jpg'
            ], check=True)
            os.remove(outfile + '.resized.jpg')
        elif kind == '.png':
            subprocess.run([
                '/usr/local/bin/convert',
                infile,
                '-resize', str(width),
                outfile,
            ], check=True)


def glob_images(root):
    return list(glob.glob(os.path.join(root, 'source', '**.jpg'))) + list(glob.glob(os.path.join(root, 'source', '**.png')))


def main():
    parser = argparse.ArgumentParser(description='Process some images.')
    parser.add_argument('root', nargs='*', default=['buildinghours', 'contacts'],
                        help='a folder which contains a "source/" folder containing the images to be optimized')
    args = parser.parse_args()

    # information from https://www.paintcodeapp.com/news/ultimate-guide-to-iphone-resolutions
    sizes = {
        # used for android@2x; ios 5s/SE/6
        # this is at the high end of the sizes, but I'm ok with this because there's less
        # downsampling from 750->640 than 1440->640, so it's an improvement
        '2x': 750,
        # used for android@3x; ios 6+/X
        # 1440 is the max display in use on Android currently.
        # I'm OK with the downsizing here because all the phones that use it are fast
        '3x': 1440,
    }

    for root in args.root:
        files = glob_images(root)
        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex:
            outdir = os.path.join(root, 'optimized')
            os.makedirs(outdir, exist_ok=True)
            for nx, width in sizes.items():
                for filename in files:
                    infile = os.path.basename(filename)
                    basename, ext = os.path.splitext(infile)
                    outfile = os.path.join(outdir, f'{basename}@{nx}{ext}')
                    if not os.path.exists(outfile):
                        ex.submit(
                            convert_file,
                            filename,
                            outfile,
                            kind=ext,
                            width=width)


if __name__ == '__main__':
    main()
