var URL = require('url');
import createContainer from './docker';

module.exports = function createHandler({
  localConfig,
  output
}) {
  const config = localConfig;
  return async function launcher(req, res) {
    const {
      headers,
      method,
      url
    } = req;
    var {
      path,
      query
    } = URL.parse(url, true);

    var payload = {
      body: {
        path: path,
        query: query,
        headers: headers
      }
    }

    await createContainer(config, `'${JSON.stringify(payload)}'`, output);
  };
};
