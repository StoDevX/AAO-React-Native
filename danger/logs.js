module.exports.isBadBundleLog = log => {
  const allLines = log.split('\n')
  const requiredLines = [
    'bundle: start',
    'bundle: finish',
    'bundle: Done writing bundle output',
    'bundle: Done copying assets',
  ]
  return requiredLines.some(line => !allLines.includes(line))
}

module.exports.isBadDataValidationLog = log => {
  return log.split('\n').some(l => !l.endsWith('is valid'))
}

module.exports.fileLog = (name, log, {lang = null} = {}) => {
  message(
    `
<details>
  <summary>${name}</summary>

\`\`\`${lang || ''}
${log}
\`\`\`

</details>`,
  )
}
