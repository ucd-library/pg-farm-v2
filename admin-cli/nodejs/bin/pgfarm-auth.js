import {Command} from 'commander';
import auth from '../lib/auth.js';
import {config} from '../lib/config.js';
const program = new Command();

program.command('login')
  .description('Login using UCD CAS Authentication')
  .option('-h, --headless', 'Login without local browser (ie you are in a pure shell, no Desktop UI), copy and paste token')
  .action(options => {
    auth.login(options);
  });

program.command('token')
  .description('Print current user token')
  .option('-j, --jwt', 'Print full JWT token instead of the hash token')
  .action(opts => {
    if( opts.jwt ) {
      console.log(config.token);
      return;
    }
    console.log(config.tokenHash);
  });

program.command('logout')
  .description('Logout current user')
  .action(() => {
    auth.logout();
  });

program.command('update-service')
  .description('Update local .pg_service.conf file')
  .action(() => {
    auth.updateService();
  });

program.parse(process.argv);