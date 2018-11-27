const Docker = require('dockerode');

module.exports = async function createContainer({
  runtime,
  handler,
  dir
}, event, output) {
  var docker = new Docker();
  docker.createContainer({
    Image: `lambci/lambda:${runtime}`,
    AttachStdin: false,
    AttachStdout: true,
    AttachStderr: true,
    Tty: true,
    Cmd: [handler, event],
    OpenStdin: false,
    StdinOnce: false,
    'HostConfig': {
      'Binds': [`${dir}:/var/task`]
    }
  }).then((container) => {
    output.log(container.id);
    output.log("Starting the container...");
    return container.start();
  }).catch(function (err) {
    output.log(err);
  });
}
