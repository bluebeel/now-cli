var URL = require('url');
import runLambda from './docker';

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

    var body = {
        path: path,
        query: query,
        headers: headers,
        method: method
      };
    var payload = {
      body: JSON.stringify(body)
    };

    var {data, log} = await runLambda(config, `'${JSON.stringify(payload)}'`);
    output.log(log);
    res.writeHead(data.statusCode, data.headers);
    if (data.encoding) {
      res.write(Buffer.from(data.body, 'base64'));
    } else {
      res.write(data.body);
    }
    res.end( );
  };
};
