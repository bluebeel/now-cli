import chalk from 'chalk';

import logo from '../../util/output/logo';

module.exports = () => `
  ${chalk.bold(`${logo} now`)} dev [options]
  ${chalk.dim('Options:')}
    -d, --debug                    Debug mode [off]
`;