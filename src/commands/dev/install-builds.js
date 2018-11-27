import chalk from 'chalk';
import fs from 'fs';
import { spawn } from 'child_process';
import which from 'which-promise';

function spawnAsync(command, args, options = { stdio: 'ignore' }) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, options);
    child.on('error', reject);
    child.on(
      'close',
      (code, signal) =>
        code !== 0
          ? reject(new Error(`Exited with ${code || signal}`))
          : resolve()
    );
  });
}

module.exports = async function installBuilds({ builds = [], output }) {
  const nowPath = await which('now');
  const nowStats = await fs.promises.lstat(nowPath);

  // If `now` is a symlink, then we're doing local development
  // TODO Found out that now is *always* a local link.
  // Instead, check `build.use` to see if it is `yarn link`-able...
  const isDev = nowStats.isSymbolicLink();

  if (isDev) {
    output.log(
      `Development build of ${chalk.bold('now')} discovered! Using ${chalk.dim(
        'yarn link'
      )} for installing builders...`
    );
  }

  let yarn = (process.platform === "win32" ? "yarn.cmd" : "yarn");
  for (const build of builds) {
    const { use } = build;
    
    try {
      await spawnAsync(yarn, ['link', use], { stdio: 'ignore' });
      output.log(`Using local ${chalk.bold(use)}.`);
    } catch (error) {
      try {
        output.log(`Installing @now/build-utils...`);
        await spawnAsync(yarn, ['add', '--dev', '@now/build-utils']);
        output.log(`Installing ${chalk.bold(use)}...`);
        await spawnAsync(yarn, ['add', '--dev', use]);
      } catch (error) {
        output.error(error.message);
      }
    }
  }
};