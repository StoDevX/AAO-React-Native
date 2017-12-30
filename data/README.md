The folders and files within this `/data` folder contain the data for All About Olaf.

## Overview

Folders prefixed with `_` are metadata; they contain the data schema and transform functions to create the output files.

A folder of files will create a JSON file like the following, where each file in the folder becomes an entry in the `data` array:

```json
{
    "data": [], // array of the data files
    "version": 1 // version of the data files
}
```

A single file will become a single JSON file, similar to the following:

```json
{
    "data": {},
    "version": 1
}
```

The shape of the file varies slightly depending on the input file type:

- If the single file is a YAML file, its contents will be attached as an object under the `data` key.
- If it is CSS, it is copied directly, and also created as a `{"css": ""}` object, where `css` replaces `data`
- If it is markdown, the raw markdown is attached as `{"text": ""}`

## Structure

### `_schema/`
There are two types of schema: "input" and "output". They live in the `/data/_schema/input` and `/data/_schema/output` folders, respectively.

A "schema" is a [JSON Schema](http://json-schema.org) (Draft 06) file, written in YAML instead of JSON because JSON is annoying to write by hand. They're then validated by [AJV](https://github.com/epoberezkin/ajv), and there are additional JSON Schema definitions defined in `/data/_schema/_defs.yaml`.

The _input_ schema define the shape of the input data files (either the standalone single files or the individual ones combined into arrays). The _output_ schema are grouped into `vX` folders, where X is a monotonically increasing positive integer (1, 2, 3, etc).

Each output folder defines the expected shape of the output files of that data format version, to guarantee that the app loads the expected data and doesn't break.

### `_validate/`
There are some things that are just easier to implement in plain JS instead of JSON Schema, such as dictating that each bus arrival time happens after the previous one.

For these situations, we have the `/data/_validate/input/$type.js`, which validate the input files.

`$type.js` should export a `validateItem` function that accepts two parameters: `(data, opts) => true | Error`. `data` is the contents of the raw file, before transformation; `opts` is an object that passes along other information (currently, it passes `{filename, path}`, where `filename` is the source file's name without path information, and `path` is the path, rooted at the repository root.) It should return either `true` or an Error instance, which will be formatted and printed to stderr at the end of validation.

If you have a situation that needs to validate the _output_ file, we can add `/data/_validate/output/$type.js` support, but I don't want to build the infrastructure for that until we need it.

### `_transform/`
This is a folder of folders. Each subfolder (named `vX`, like the `_schema/output/vX` folders) maintains a transformation from the source files to a particular version of the output file for that type of data.

The output files do not need to all share a version; `bus-times` v4 can come when `contact-info` is just at v2, for example. This works because we will continue to generate the old output data format versions for each type for the forseeable future, so as to not accidentally EOL any old versions of All About Olaf.

As such, each `output` transforms folder only needs to contain the transforms for the files that have new transformations to be applied.

### `/docs`
The (default) output folder for all of this is `/docs`, a sibling of `/data`. The top-level items are in their v1 formats, for backwards-compatibility reasons.

There is also a `v1` folder, for simplicity.

Each data version has a folder, named `vX`, which corresponds to a folder in `/data/_transform/vX`.

## Instructions

This whole process is controlled by the `/scripts/data.mjs` script.

1. The script requires `@std/esm` - use `node -r @std/esm` if you use node's CLI.
2. The script has two optional subcommands, `validate` and `bundle`. `bundle` validates before it creates the bundle. If you omit the subcommand, it defaults to `bundle`.
3. Both subcommands take one positional argument, `input`, which is the folder to operate on.
4. Both subcommand accept two named arguments, `-o,--output` (the destination folder) and `--meta` (the folder that contains `_schema`/`_validate`/`_transform`). `output` defaults to `(cwd)/docs`, and `meta` defaults to the `input` folder.

Thus, the simplest possible invocation is as follows:

```shell
% node -r @std/esm scripts/data.mjs
```

which will bundle all of the files in `/data` into files in `/docs`, validating against the schema in `data`.

You can also simply call `npm run data`, which will execute the above command for you.
