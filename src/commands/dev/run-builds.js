const chalk = require('chalk');
const path = require('path');
const _glob = require('glob');

// ! __non_webpack_require__ didn't work, so hacking the hacky hacks
const nodeRequire = eval('require');

const glob = async function(pattern, options) {
  return new Promise((resolve, reject) => {
    _glob(pattern, options, (error, files) => {
      if (error) {
        reject(error);
      } else {
        resolve(files);
      }
    });
  });
};

module.exports = async function runBuilds({ builds, output }) {
  for (const build of builds) {
    const { use, src } = build;

    output.debug(`Loading ${chalk.bold(use)}...`);

    // TODO This should be a temporary path
    const buildPath = nodeRequire.resolve(
      path.resolve(process.cwd(), 'node_modules', use)
    );

    const nowPath = nodeRequire.resolve(
      path.resolve(process.cwd(), 'node_modules', '@now/build-utils/file-fs-ref.js')
    );

    const builder = nodeRequire(buildPath);
    const FileFsRef = nodeRequire(nowPath);
    
    var buildInput = {
      'files': {},
      'entrypoint': ""
    };

    const files = await glob(src);
    files.forEach((file) => {
      if (file.includes("index")) {
        buildInput.entrypoint = file;
      }
      var p = path.join(process.cwd(), file);
      buildInput.files[file] = new FileFsRef({mode: 644, fsPath: p});
    });

    if (builder.build) {
      output.log(`Building ${chalk.bold(use)}...`);
      await builder.build(buildInput);
    }
  }
};