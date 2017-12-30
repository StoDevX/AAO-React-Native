#!/usr/bin/env node
// @flow

import meow from 'meow'
import {validate} from './validate.mjs'
import findUp from 'find-up'
import path from 'path'
import memoize from 'lodash/memoize'
import assert from 'assert'
import junk from 'junk'
import fs from 'fs'
import flattenDeep from 'lodash/flattenDeep'
import yaml from 'js-yaml'
import util from 'util'

const getProjectRoot = memoize(() => path.dirname(findUp.sync('package.json')))

function tryBoolean(cb: () => any) {
  // try a function; return a boolean version of success
  try {
    return Boolean(cb())
  } catch (err) {
    return false
  }
}

const readDirAsync = util.promisify(fs.readdir)
const readFileAsync = util.promisify(fs.readFile)
const writeFileAsync = util.promisify(fs.writeFile)
const isDir = pth => tryBoolean(() => fs.statSync(pth).isDirectory())
const isFile = pth => tryBoolean(() => fs.statSync(pth).isFile())

async function readDir(pth: string): Promise<Array<string>> {
  return (await readDirAsync(pth))
    .filter(junk.not)
    .filter(entry => !entry.startsWith('_'))
    .filter(entry => !entry.startsWith('README'))
}

async function readYaml(pth: string): Promise<Object> {
  const contents = await readFileAsync(pth, 'utf-8')
  const obj = yaml.safeLoad(contents, {filename: pth})
  return JSON.parse(JSON.stringify(obj))
}

async function readJson(pth: string): Promise<Object> {
  return JSON.parse(await readFileAsync(pth, 'utf-8'))
}

function writeJson(contents: any, dest: string): Promise<any> {
  const body = JSON.stringify(contents)
  return writeFileAsync(dest, body, 'utf-8')
}

function removeExt(pth: string): string {
  return pth
    .split('.')
    .slice(0, -1)
    .join('.')
}

function resolvePathInProject(pth: string): string {
  const root = getProjectRoot()
  return path.resolve(root, pth)
}

function printValidationErrors(errors: Array<Error>) {
  errors.forEach(err => console.error(err.message))
}

type Args = {
  root: string,
}

type DataType = {
  kind: 'folder' | 'single',
  path: string,
  filename: string,
  name: string,
}

async function loadSchema(
  type: DataType,
  {root}: Args,
): Promise<false | Object> {
  // Expects to find a schema file at $root/$type-name.yaml
  try {
    return await readYaml(path.join(root, `${type.name}.yaml`))
  } catch (err) {
    if (err.code === 'ENOENT' || err.code === 'EACCES') {
      return false
    } else {
      throw err
    }
  }
}

async function loadDataFile(args: {fullPath: string, filename: string}) {
  const {fullPath, filename} = args
  const ext = filename.split('.').slice(-1)[0]
  switch (ext) {
    case 'md':
      // return readMarkdownAsData(fullPath)
      return {text: await readFileAsync(fullPath, 'utf-8')}
    case 'css':
      return {css: await readFileAsync(fullPath, 'utf-8')}
    case 'json':
      return readJson(fullPath)
    case 'yaml':
      return readYaml(fullPath)
    default:
      throw new Error(`unhandled file type ${ext}`)
  }
}

async function findDataFiles(type: DataType): Promise<Array<Object>> {
  // Loads all of the data files for a given type of data

  let files = []
  if (type.kind === 'folder') {
    files = (await readDir(type.path)).map(filename => ({
      fullPath: path.join(type.path, filename),
      filename: filename,
    }))
  } else if (type.kind === 'single') {
    files = [{fullPath: type.path, filename: type.filename}]
  } else {
    throw new Error(`unknown kind ${type.kind}`)
  }

  return Promise.all(files.map(loadDataFile))
}

function findBundledFile(
  type: DataType,
  version: number,
  {root}: Args,
): Promise<string> {
  return Promise.resolve(path.join(root, `v${version}`, `${type.name}.json`))
}

async function loadBundledFile(
  type: DataType,
  version: number,
  {root}: Args,
): Promise<Object> {
  const filepath = await findBundledFile(type, version, {root})
  try {
    return JSON.parse(await readFileAsync(filepath, 'utf-8'))
  } catch (err) {
    throw err
  }
}

async function findOutputVersions(
  type: DataType,
  {root}: Args,
): Promise<Array<number>> {
  const allVersions = await readDir(root)
  return allVersions
    .filter(ver => isFile(path.join(root, ver, `${type.name}.yaml`)))
    .map(ver => parseInt(ver.slice(1), 10))
}

async function findTransformer(
  type: DataType,
  version: number,
  {root}: Args,
): Promise<(Object) => string> {
  // Returns the transformer function for a given data type/version pair
  try {
    // two-step process here in case we want to offer shorthand transforms in the future
    const filePath = path.join(root, `v${version}`, `${type.name}.mjs`)
    const transformerModule = await import(filePath)
    return transformerModule.transform
  } catch (err) {
    throw err
  }
}

type ProgramArgs = {
  args: CliArgs,
  dataTypes: Array<DataType>,
}

type ExitStatus = 0 | 1

async function validateInput(params: ProgramArgs): Promise<ExitStatus> {
  const {args, dataTypes} = params
  // for each data type:
  // verify that there is an input schema for that type
  // validate each data file of that given type against that type's input schema
  // run the js-language validator for the type, if any

  const promises = dataTypes.map(async type => {
    console.log(`validating "${type.name}"`)

    const schemaRoot = path.join(args.flags.meta, '_schema', 'input')
    const schema = await loadSchema(type, {root: schemaRoot})
    if (!schema) {
      return new Error(
        `No input schema exists for ${type.name} (at ${schemaRoot})`,
      )
    }

    const dataFiles = await findDataFiles(type)
    const results = dataFiles.map(dataFile => validate(schema, dataFile))

    // console.log(type.name, results)

    // todo: discover and run the js-language validators

    return results
  })

  // Array<true | Array<Error>>
  const results = await Promise.all(promises)

  const problems = flattenDeep(results).filter(set => set && set !== true)
  if (problems.length) {
    console.log(problems)
    printValidationErrors(problems)
    return 1
  }

  console.log('no problems')
  return 0
}

async function validateOutput(params: ProgramArgs): Promise<ExitStatus> {
  const {args, dataTypes} = params
  // for each data type:
  // for each output schema version:
  // validate the bundled data file for that type against the equivalent output schema

  const promises = dataTypes.map(async type => {
    const schemaRoot = path.join(args.flags.meta, '_schema', 'output')
    const versions = await findOutputVersions(type, {root: schemaRoot})

    const pending = versions.map(async version => {
      const versionSchemaRoot = path.join(schemaRoot, `v${version}`)
      const schema = await loadSchema(type, {root: versionSchemaRoot})
      if (!schema) {
        return new Error(`No input schema exists for ${type.name} (at %path)`)
      }

      const bundledData = await loadBundledFile(type, version, {
        root: path.join(args.flags.output),
      })

      return validate(schema, bundledData)
    })

    return Promise.all(pending)
  })

  const results = await Promise.all(promises)

  const problems = flattenDeep(results).filter(set => set && set !== true)
  if (problems.length) {
    printValidationErrors(problems)
    return 1
  }

  return 0
}

type BundledDataFile = {type: string, contents: {data: mixed, version: number}}

async function bundleDataFiles(
  params: ProgramArgs,
): Promise<Array<BundledDataFile>> {
  const {args, dataTypes} = params
  // for each data type:
  // verify that a transformer exists
  // for each transformer version:
  // run the input data through the transformer to generate the versioned bundled output file

  const promises = dataTypes.map(async type => {
    console.log(`bundling ${type.name}:`)
    const schemaRoot = path.join(args.flags.meta, '_schema', 'output')
    const versions = await findOutputVersions(type, {root: schemaRoot})
    console.log(versions)

    const promises = versions.map(async version => {
      console.log(`bundling ${type.name}, version ${version}`)
      const tfRoot = path.join(args.flags.meta, '_transform')
      const transformer = await findTransformer(type, version, {root: tfRoot})
      if (!transformer) {
        const typeName = type.name
        return new Error(
          `No transformer exists for ${typeName} version ${version} (at %path)`,
        )
      }

      const dataFiles = await findDataFiles(type)
      let bundledFiles = await Promise.all(dataFiles.map(transformer))

      if (type.mode === 'single') {
        // if we have a single file, we store that file's contents in
        // the bundled file, instead of an array of file contents
        assert(bundledFiles.length === 1)
        bundledFiles = bundledFiles[0]
      }

      return {
        contents: {
          data: bundledFiles,
          version: version,
        },
        type: type.name,
      }
    })

    return Promise.all(promises)
  })

  const results = await Promise.all(promises)

  // console.log(flattenDeep(results))

  return flattenDeep(results)
}

async function bundle(params: ProgramArgs): Promise<ExitStatus> {
  const {args, dataTypes} = params
  const isInputValid = await validateInput({args, dataTypes})
  if (isInputValid === 1) {
    console.log('invalid input')
    return 1
  }

  const bundledData = await bundleDataFiles({args, dataTypes})
  const promises = bundledData.map(async dataVersion => {
    if (dataVersion.contents.version === 1) {
      // put a copy at the top level with the v1 format
      await writeJson(
        dataVersion.contents,
        path.join(args.flags.output, `${dataVersion.type}.json`),
      )
    }

    await writeJson(
      dataVersion.contents,
      path.join(
        args.flags.output,
        `v${dataVersion.contents.version}`,
        `${dataVersion.type}.json`,
      ),
    )
  })

  await Promise.all(promises)

  const isOutputValid = await validateOutput({args, dataTypes})

  if (isOutputValid === 1) {
    return 1
  }

  return 0
}

async function discoverData(params: {args: CliArgs}): Promise<Array<DataType>> {
  const {args} = params
  const items = await readDir(args.flags.input)

  return items.map(fileName => {
    const fullPath = path.join(args.flags.input, fileName)
    const kind = isFile(fullPath) ? 'single' : 'folder'

    return {
      kind: kind,
      path: fullPath,
      name: kind === 'single' ? removeExt(fileName) : fileName,
      filename: kind === 'single' ? fileName : `${fileName}/`,
    }
  })
}

const COMMANDS = {
  validate: validateInput,
  bundle,
}

type CliArgs = {
  flags: {
    input: string,
    output: string,
    meta: string,
  },
}

async function main() {
  const args = meow({
    flags: {
      input: {type: 'string', default: './data'},
      output: {type: 'string', default: './docs'},
      meta: {type: 'string', default: './data'},
    },
  })

  const [command = 'bundle'] = args.input
  const runnable = COMMANDS[command]

  args.flags.input = resolvePathInProject(args.flags.input)
  args.flags.output = resolvePathInProject(args.flags.output)
  args.flags.meta = resolvePathInProject(args.flags.meta)

  const dataTypes = await discoverData({args})

  // eslint-disable-next-line no-return-await
  try {
    let exitCode = await runnable({args, dataTypes})
    process.exit(exitCode)
  } catch (err) {
    console.error('unhandled error')
    console.error(err)
  }
}

main()
