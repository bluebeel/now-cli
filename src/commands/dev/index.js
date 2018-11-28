import {
  Server
} from 'http';

import createOutput from '../../util/output';
import {
  readLocalConfig
} from '../../util/config/files';
import {
  handleError
} from '../../util/error';
import getArgs from '../../util/get-args';

import installBuilds from './install-builds';
import runBuilds from './run-builds';
import createHandler from './handler';

module.exports = async function main(ctx) {
  let argv = null;

  try {
    // Slice after ['node', 'now', 'dev']
    argv = getArgs(ctx.argv.slice(3));
  } catch (error) {
    handleError(error);
    return 1;
  }

  const localConfig = readLocalConfig(process.cwd());
  const output = createOutput({
    debug: argv['--debug']
  });

  if (argv['--help']) {
    output.print(require('./help')());
    return 2;
  }

  const {
    builds
  } = localConfig;
  await installBuilds({
    builds,
    output: output
  });

  const config = await runBuilds({
    builds,
    output: output
  });

  const handler = createHandler({ localConfig: config, output });

  const server = new Server();
  server.on('request', handler);
  server.listen(process.env.PORT || 3000, undefined, undefined, () => {
    output.log(`🚀 Ready! http://localhost:${server.address().port}`);
    output.log('');
  });
};
