#!/usr/bin/env python3
"""Discover XCTestCase classes and split them across N shards for CI.

Scans Swift source files for test classes and methods, then uses greedy
bin-packing to balance test counts across shards. Outputs a JSON matrix
suitable for GitHub Actions `fromJSON()`.

Usage:
    python3 scripts/split-uitests.py --test-dir ios/AllAboutOlafUITests --shards 2
"""

import argparse
import json
import re
import sys
from pathlib import Path


def discover_test_classes(test_dir: Path) -> list[tuple[str, int]]:
    """Find XCTestCase subclasses and count their test methods.

    Returns a list of (class_name, test_count) tuples sorted by test count
    descending (for optimal greedy packing).
    """
    class_pattern = re.compile(r"class\s+(\w+)\s*:\s*XCTestCase")
    method_pattern = re.compile(r"func\s+(test\w+)\s*\(")

    classes = []
    for swift_file in sorted(test_dir.glob("*.swift")):
        source = swift_file.read_text()

        class_match = class_pattern.search(source)
        if not class_match:
            continue

        class_name = class_match.group(1)
        test_count = len(method_pattern.findall(source))

        if test_count > 0:
            classes.append((class_name, test_count))

    classes.sort(key=lambda c: c[1], reverse=True)
    return classes


def pack_shards(
    classes: list[tuple[str, int]], num_shards: int
) -> list[list[tuple[str, int]]]:
    """Distribute classes across shards using greedy bin-packing.

    Assigns each class (largest first) to the shard with the lowest current
    total test count. This is the classic LPT (Longest Processing Time)
    multiprocessor scheduling heuristic.
    """
    shards: list[list[tuple[str, int]]] = [[] for _ in range(num_shards)]
    totals = [0] * num_shards

    for class_name, test_count in classes:
        lightest = min(range(num_shards), key=lambda i: totals[i])
        shards[lightest].append((class_name, test_count))
        totals[lightest] += test_count

    return shards


def format_matrix(
    shards: list[list[tuple[str, int]]], target: str
) -> dict:
    """Format shards as a GitHub Actions matrix JSON object.

    Output format:
    {
      "include": [
        {"shard": 1, "tests": "-only-testing:Target/Class1 -only-testing:Target/Class2"},
        {"shard": 2, "tests": "-only-testing:Target/Class3 -only-testing:Target/Class4"}
      ]
    }
    """
    include = []
    for i, shard in enumerate(shards):
        flags = " ".join(
            f"-only-testing:{target}/{cls}" for cls, _ in shard
        )
        include.append({"shard": i + 1, "tests": flags})

    return {"include": include}


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Split XCTest classes across CI shards"
    )
    parser.add_argument(
        "--test-dir",
        type=Path,
        required=True,
        help="Directory containing XCTestCase Swift files",
    )
    parser.add_argument(
        "--shards",
        type=int,
        default=2,
        help="Number of shards (default: 2)",
    )
    parser.add_argument(
        "--target",
        default="AllAboutOlafUITests",
        help="XCTest target name (default: AllAboutOlafUITests)",
    )
    args = parser.parse_args()

    if not args.test_dir.is_dir():
        print(f"Error: {args.test_dir} is not a directory", file=sys.stderr)
        sys.exit(1)

    classes = discover_test_classes(args.test_dir)

    if not classes:
        print(f"Error: no test classes found in {args.test_dir}", file=sys.stderr)
        sys.exit(1)

    total_tests = sum(count for _, count in classes)
    print(
        f"Found {len(classes)} test classes with {total_tests} tests, "
        f"splitting across {args.shards} shards",
        file=sys.stderr,
    )

    shards = pack_shards(classes, args.shards)

    for i, shard in enumerate(shards):
        shard_total = sum(count for _, count in shard)
        names = ", ".join(cls for cls, _ in shard)
        print(f"  Shard {i + 1} ({shard_total} tests): {names}", file=sys.stderr)

    matrix = format_matrix(shards, args.target)
    print(json.dumps(matrix))


if __name__ == "__main__":
    main()
