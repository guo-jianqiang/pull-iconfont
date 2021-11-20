#!/usr/bin/env node

const childProcess = require('child_process')

const child = childProcess.spawn('node',
  [require.resolve(`../scripts/index.js`)]
)

child.stdout.on('data', (data) => {
  console.log(`${data}`);
});

child.stderr.on('data', (data) => {
  console.error(`${data}`);
});

child.on('close', (code) => {
  console.log((`child process exited with code ${code}`))
});
