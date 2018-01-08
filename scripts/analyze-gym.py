#!/usr/bin/env python2

"""Usage: analyze-gym.py < travis-ios-log.log

You can download log files with the `travis` gem:
    $ travis logs 3498.3 > 3498.3.log

Then just pass that logfile to this script's stdin.
    $ python3 analyze-gym.py < 3498.3.log

Options:
  -h, --help  Print this message
  -v          Print the input lines as they are processed
  -m          Change the "module" minimum time filter
  -s          Change the "step" minimum time filter
  -d          Print the python object for each step
"""

from __future__ import absolute_import
from __future__ import print_function
import sys
import re
import json
from pprint import pprint
from datetime import timedelta

ansi_escape = re.compile(ur'\x1b[^m]*m')
fltime_pattern = ur'\[(?P<hours>\d{1,2}):(?P<minutes>\d{1,2}):(?P<seconds>\d{1,2})\]'
fltime_regex = re.compile(fltime_pattern)


def remove_control_chars(string):
    """Remove ANSI control codes from a string"""
    return ansi_escape.sub('', string)


def to_timedelta(fastlanetime):
    """Takes a 'fastlane time', like 20:52:42, and turns it
    into a timedelta from midnight.

    >>> to_timedelta('20:52:42')
    timedelta(days=0, seconds=75162)
    """
    groups = fltime_regex.match(fastlanetime).groupdict()
    return timedelta(**dict((k, int(v)) for k, v in groups.items()))


def pick(dictionary, *keys):
    """Return a dictionary comprised of _only_ these keys.

    >>> pick({1: 'a', 2: 'b'}, 1)
    {1: 'a'}
    """
    return dict((k, v) for k, v in dictionary.items() if k in keys)


def unpick(dictionary, *keys):
    """Return a dictionary comprised of everything _but_ these keys.

    >>> pick({1: 'a', 2: 'b'}, 1)
    {2: 'b'}
    """
    return dict((k, v) for k, v in dictionary.items() if k not in keys)


def pretty_td(delta):
    """Turn a timedelta instance into a formatted string

    >>> pretty_td(timedelta(minutes=3, seconds=32))
    '3m 32s'
    """
    days, seconds = delta.days, delta.seconds
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    seconds = (seconds % 60)
    # return days, hours, minutes, seconds
    return '{}m {:02}s'.format(minutes, seconds)


def extract_gym_log(stream):
    """Given a stream of text, extract the chunk that is the
    relevant `gym` log.
    """
    start_gym_regex = re.compile(fltime_pattern + ': --- Step: (gym|xcodebuild) ---')
    stop_gym_regex = re.compile(fltime_pattern + ': Cruising back')

    reading = False
    for line in stream:
        line = remove_control_chars(line).strip()

        if not reading and start_gym_regex.match(line):
            reading = True
        elif reading and stop_gym_regex.match(line):
            reading = False
            break

        if reading:
            yield line


def process(stream, verbose=False):
    """Given a stream of text, process it into a data structure
    of how long various modules took to run.
    """

    time_regex = ur'^(?P<time>' + fltime_pattern + ur'): [^ ]+ '

    # Indicates the start of a "module"
    module_regex = re.compile(time_regex + ur'Building (?P<file>.*) \[(?P<mode>.*)\]$')

    # The "verbs" are the different things that xcbuild? prints out as the steps go by
    verbs = ['Copying', 'Compiling', 'Building library', 'Linking', 'Processing', 'Generating', 'Running script', 'Touching', 'Signing']
    action_regex = re.compile(time_regex + '(?P<action>{}) '.format("|".join(verbs)) + ur'(?P<file>.*)$')

    # Indicates the end of the log
    # (kinda a duplicate of stop_gym_regex)
    done_regex = re.compile(time_regex + ur'Archive Succeeded')

    modules = {}
    current_module_name = None
    for line in extract_gym_log(stream):
        if verbose:
            print(line, end='')

        module_match = module_regex.match(line)
        action_match = action_regex.match(line)
        done_match = done_regex.match(line)

        if module_match:
            module_match = module_match.groupdict()
            if current_module_name is not None:
                # add the "end times" to the just-finished module
                last_module = modules[current_module_name]
                last_module['end'] = to_timedelta(module_match['time'])
                last_module['duration'] = last_module['end'] - last_module['start']

                last_step = last_module['steps'][-1]
                last_step['end'] = last_module['end']
                last_step['duration'] = last_step['end'] - last_step['start']

            current_module_name = module_match['file']
            modules[current_module_name] = {
                'start': to_timedelta(module_match['time']),
                'end': None,
                'duration': timedelta(seconds=0),
                'mode': module_match['mode'],
                'steps': [],
            }

            continue

        elif action_match:
            action_match = action_match.groupdict()
            if modules[current_module_name].get('steps', None):
                # add the "end times" to the previous step
                prior_step = modules[current_module_name]['steps'][-1]
                prior_step['end'] = to_timedelta(action_match['time'])
                prior_step['duration'] = prior_step['end'] - prior_step['start']

            # make file paths relative to the project
            needle = 'AAO-React-Native/'
            filepath = action_match['file']
            if needle in filepath:
                filepath = filepath[filepath.index(needle) + len(needle):]

            modules[current_module_name]['steps'].append({
                'start': to_timedelta(action_match['time']),
                'file': filepath,
                'action': action_match['action'],
                'end': None,
                'duration': None,
            })

        elif done_match:
            done_match = done_match.groupdict()
            m = modules[current_module_name]
            m['end'] = to_timedelta(done_match['time'])
            m['duration'] = m['end'] - m['start']
            m['steps'][-1]['end'] = to_timedelta(done_match['time'])

            if modules[current_module_name].get('steps', None):
                # add the "end times" to the final step
                prior_step = modules[current_module_name]['steps'][-1]
                prior_step['end'] = to_timedelta(done_match['time'])
                prior_step['duration'] = prior_step['end'] - prior_step['start']

            break

    return modules


def analyze(modules, module_duration_filter=10, step_duration_filter=1, debug=False):
    """Pretty-print the analysis of how long the various modules
    took to build.
    """
    for name, module in modules.items():
        if module['duration'] >= timedelta(seconds=module_duration_filter):
            if debug:
                pprint({name: unpick(module, 'steps')})
            print('{}: {} [{}]'.format(pretty_td(module["duration"]), name, module["mode"]))

            for step in module['steps']:
                if step['duration'] >= timedelta(seconds=step_duration_filter):
                    if debug:
                        pprint(step)
                    print('  {}: {} {}'.format(pretty_td(step["duration"]), step["action"], step["file"]))


if __name__ == '__main__':
    args = sys.argv
    if '-h' in args or '--help' in args:
        print(__doc__)
        sys.exit(1)

    analyze(process(sys.stdin, verbose='-v' in args),
            module_duration_filter=int(args[args.index('-m') + 1]) if '-m' in args else 10,
            step_duration_filter=int(args[args.index('-s') + 1]) if '-s' in args else 1,
            debug='-d' in args)
