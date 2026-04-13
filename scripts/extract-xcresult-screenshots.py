#!/usr/bin/env python3
"""Extract screenshot attachments from an xcresult bundle.

Usage: extract-xcresult-screenshots.py <xcresult-path> <output-dir>

Uses xcresulttool v3 API to find test activities and their attachments,
then exports image attachments using the legacy export command.
"""

import json
import os
import subprocess
import sys


def run_xcresulttool(*args):
    """Run xcresulttool and return parsed JSON output."""
    result = subprocess.run(
        ["xcrun", "xcresulttool", *args], capture_output=True, text=True
    )
    if result.returncode != 0:
        return None
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError:
        return None


def find_test_ids(nodes):
    """Recursively find all test node identifiers."""
    ids = []
    for node in nodes:
        if "children" in node:
            ids.extend(find_test_ids(node["children"]))
        elif "nodeIdentifier" in node:
            ids.append(node["nodeIdentifier"])
    return ids


def find_attachments(obj, attachments):
    """Recursively find all image attachments in an activities response."""
    if isinstance(obj, dict):
        if "attachments" in obj:
            for a in obj["attachments"]:
                name = a.get("name", "") or a.get("filename", "attachment")
                payload_id = a.get("payloadId", "")
                if payload_id and any(
                    name.lower().endswith(ext) for ext in (".png", ".jpg", ".jpeg")
                ):
                    attachments.append((name, payload_id))
        for v in obj.values():
            find_attachments(v, attachments)
    elif isinstance(obj, list):
        for i in obj:
            find_attachments(i, attachments)


def main():
    if len(sys.argv) != 3:
        print(
            f"Usage: {sys.argv[0]} <xcresult-path> <output-dir>",
            file=sys.stderr,
        )
        sys.exit(1)

    xcresult_path = sys.argv[1]
    output_dir = sys.argv[2]

    if not os.path.isdir(xcresult_path):
        print(
            f"Error: xcresult bundle not found at '{xcresult_path}'",
            file=sys.stderr,
        )
        sys.exit(1)

    os.makedirs(output_dir, exist_ok=True)

    # Step 1: Get test results to find test IDs
    tests = run_xcresulttool("get", "test-results", "tests", "--path", xcresult_path)
    if tests is None:
        print("Failed to get test results from xcresult bundle", file=sys.stderr)
        sys.exit(1)

    test_ids = find_test_ids(tests.get("testNodes", []))
    print(f"Found {len(test_ids)} test(s)")

    # Step 2: Get activities for each test to find attachments
    all_attachments = []
    for test_id in test_ids:
        activities = run_xcresulttool(
            "get",
            "test-results",
            "activities",
            "--test-id",
            test_id,
            "--path",
            xcresult_path,
        )
        if activities is not None:
            find_attachments(activities, all_attachments)

    print(f"Found {len(all_attachments)} screenshot attachment(s)")

    # Step 3: Export each attachment using legacy export
    exported = 0
    for i, (name, payload_id) in enumerate(all_attachments):
        out_path = os.path.join(output_dir, f"{i:03d}_{name}")
        result = subprocess.run(
            [
                "xcrun",
                "xcresulttool",
                "export",
                "--legacy",
                "--type",
                "file",
                "--path",
                xcresult_path,
                "--id",
                payload_id,
                "--output-path",
                out_path,
            ],
            capture_output=True,
        )
        if result.returncode == 0:
            exported += 1
            print(f"  Exported: {os.path.basename(out_path)}")
        else:
            print(f"  Failed to export: {name} (id={payload_id})")

    print(f"\nExported {exported}/{len(all_attachments)} screenshot(s)")


if __name__ == "__main__":
    main()
