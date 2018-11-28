const util = require('util');
const exec = util.promisify(require('child_process').exec);

module.exports = async function runLambda({
  runtime,
  handler,
  dir
}, event) {
  // exec will return result on stdout.
  var cmd = `docker run --rm -v ${dir}:/var/task lambci/lambda:${runtime} ${handler} ${event}`;
  const { stdout, stderr } = await exec(cmd);
  return {
    data: JSON.parse(stdout),
    log: stderr
  };
};