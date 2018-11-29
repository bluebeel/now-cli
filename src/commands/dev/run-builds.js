const chalk = require('chalk');
const path = require('path');
const _glob = require('glob');
const Docker = require('dockerode');
const AdmZip = require('adm-zip');

// ! __non_webpack_require__ didn't work, so hacking the hacky hacks
const nodeRequire = eval('require');

const glob = async function (pattern, options) {
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

module.exports = async function runBuilds({
  builds,
  output
}) {
  var docker = new Docker();
  for (const build of builds) {
    const {
      use,
      src
    } = build;

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
      'entrypoint': "",
      'workPath': process.cwd()
    };
    var entrypoint = "";

    const files = await glob(src);
    files.forEach((file) => {
      if (file.includes("index")) {
        buildInput.entrypoint = file;
        entrypoint = file;
      }
      var p = path.join(process.cwd(), file);
      buildInput.files[file] = new FileFsRef({
        fsPath: p
      });
    });

    output.log(`Building ${chalk.bold(use)}...`);
    var lambda = await builder.build(buildInput);

    var zip = new AdmZip(lambda[entrypoint].zipBuffer);
    // extracts everything
	  zip.extractAllTo(`${path.resolve(process.cwd(), "now-dev")}`, true);

    // check if we have the image locally.
    // if not we pull the image.
    try {
      var image = docker.getImage(`lambci/lambda:${lambda[entrypoint].runtime}`);
      await image.inspect();
      output.log(`Image for the runtime ${lambda[entrypoint].runtime} available on the system...`);
      return { 
        runtime: lambda[entrypoint].runtime,
        handler: lambda[entrypoint].handler,
        dir: path.resolve(process.cwd(), "now-dev")
      };
    } catch (e) {
      // we pull the image
      output.log(`Image for the runtime ${lambda[entrypoint].runtime} not available on the system...`);
      output.log(`Pulling the image from remote...`);
      await docker.pull(`lambci/lambda:${lambda[entrypoint].runtime}`, (err, stream) => {
        output.log(`Building the image lambci/lambda:${lambda[entrypoint].runtime}...`);
        stream.on('end', () => {
          output.log(`Image pulled...`);
          return { 
            runtime: lambda[entrypoint].runtime,
            handler: lambda[entrypoint].handler,
            dir: indexDirectory
          };
        });
      });
    }
  }
};
