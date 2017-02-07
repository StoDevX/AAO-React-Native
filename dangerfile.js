import { danger, fail, warn } from "danger"
import fs from "fs"

const jsFiles = danger.git.created_files.filter(path => path.endsWith("js"))

// new js files should have `@flow` at the top
const unFlowedFiles = jsFiles.filter(filepath => {
  const content = fs.readFileSync(filepath)
  return !content.includes("@flow")
})

if (unFlowedFiles.length > 0) {
  warn(`These new JS files do not have Flow enabled: ${unFlowedFiles.join(", ")}`)
}

const packageChanged = includes(danger.git.modified_files, 'package.json');
const lockfileChanged = includes(danger.git.modified_files, 'yarn.lock');
if (packageChanged && !lockfileChanged) {
	  const message = 'Changes were made to package.json, but not to yarn.lock';
	    const idea = 'Perhaps you need to run `yarn install`?';
	      warn(`${message} - <i>${idea}</i>`);
}
