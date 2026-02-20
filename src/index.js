import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { getConfig, setConfig, isConfigured } from './config.js';
import {
  upsertUser,
  deleteUser,
  upsertAccount,
  deleteAccount,
  addUsersToAccount,
  removeUsersFromAccount,
  trackEvent,
  getEvents,
  getUserProperties,
  getAccountProperties,
  getUserSegments,
  getAccountSegments,
  linkUserToAccount,
  validateApiKey,
  getTrackingSnippet
} from './api.js';

const program = new Command();

// ============================================================
// Helpers
// ============================================================

function printSuccess(message) {
  console.log(chalk.green('✓') + ' ' + message);
}

function printError(message) {
  console.error(chalk.red('✗') + ' ' + message);
}

function printTable(data, columns) {
  if (!data || data.length === 0) {
    console.log(chalk.yellow('No results found.'));
    return;
  }

  const widths = {};
  columns.forEach(col => {
    widths[col.key] = col.label.length;
    data.forEach(row => {
      const val = String(col.format ? col.format(row[col.key], row) : (row[col.key] ?? ''));
      if (val.length > widths[col.key]) widths[col.key] = val.length;
    });
    widths[col.key] = Math.min(widths[col.key], 50);
  });

  const header = columns.map(col => col.label.padEnd(widths[col.key])).join('  ');
  console.log(chalk.bold(chalk.cyan(header)));
  console.log(chalk.dim('─'.repeat(header.length)));

  data.forEach(row => {
    const line = columns.map(col => {
      const val = String(col.format ? col.format(row[col.key], row) : (row[col.key] ?? ''));
      return val.substring(0, widths[col.key]).padEnd(widths[col.key]);
    }).join('  ');
    console.log(line);
  });

  console.log(chalk.dim(`\n${data.length} result(s)`));
}

function printJson(data) {
  console.log(JSON.stringify(data, null, 2));
}

async function withSpinner(message, fn) {
  const spinner = ora(message).start();
  try {
    const result = await fn();
    spinner.stop();
    return result;
  } catch (error) {
    spinner.stop();
    throw error;
  }
}

function requireAuth() {
  if (!isConfigured()) {
    printError('API key not configured.');
    console.log('\nRun the following to configure:');
    console.log(chalk.cyan('  journy config set --api-key YOUR_API_KEY'));
    console.log('\nGet your API key at: https://system.journy.io');
    process.exit(1);
  }
}

function parseProperties(propertiesStr) {
  if (!propertiesStr) return {};

  try {
    return JSON.parse(propertiesStr);
  } catch (error) {
    throw new Error('Properties must be valid JSON. Example: \'{"name":"John","plan":"Pro"}\'');
  }
}

// ============================================================
// Program metadata
// ============================================================

program
  .name('journy')
  .description(chalk.bold('Journy.io CLI') + ' - Track users, accounts, and events from your terminal')
  .version('1.0.0');

// ============================================================
// CONFIG
// ============================================================

const configCmd = program.command('config').description('Manage CLI configuration');

configCmd
  .command('set')
  .description('Set configuration values')
  .option('--api-key <key>', 'Journy.io API key')
  .action((options) => {
    if (options.apiKey) {
      setConfig('apiKey', options.apiKey);
      printSuccess('API key set');
    } else {
      printError('No options provided. Use --api-key');
    }
  });

configCmd
  .command('show')
  .description('Show current configuration')
  .action(() => {
    const apiKey = getConfig('apiKey');
    console.log(chalk.bold('\nJourny.io CLI Configuration\n'));
    console.log('API Key: ', apiKey ? chalk.green(apiKey.substring(0, 8) + '...' + apiKey.slice(-4)) : chalk.red('not set'));
    console.log('');
  });

// ============================================================
// USERS
// ============================================================

const userCmd = program.command('user').description('Manage users');

userCmd
  .command('upsert <userId>')
  .description('Create or update a user')
  .option('--email <email>', 'User email address')
  .option('--properties <json>', 'User properties as JSON string')
  .option('--json', 'Output as JSON')
  .action(async (userId, options) => {
    requireAuth();

    try {
      const properties = parseProperties(options.properties);

      const data = await withSpinner(`Upserting user ${userId}...`, () =>
        upsertUser(userId, options.email, properties)
      );

      if (options.json) {
        printJson(data);
        return;
      }

      printSuccess(`User ${userId} upserted successfully`);
      console.log(chalk.dim(`Request ID: ${data.meta?.requestId}`));
      console.log('');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

userCmd
  .command('delete <userId>')
  .description('Delete a user')
  .option('--email <email>', 'User email (alternative to userId)')
  .option('--json', 'Output as JSON')
  .action(async (userId, options) => {
    requireAuth();

    try {
      const data = await withSpinner(`Deleting user ${userId}...`, () =>
        deleteUser(userId, options.email)
      );

      if (options.json) {
        printJson(data);
        return;
      }

      printSuccess(`User ${userId} deleted successfully`);
      console.log('');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// ACCOUNTS
// ============================================================

const accountCmd = program.command('account').description('Manage accounts');

accountCmd
  .command('upsert <accountId>')
  .description('Create or update an account')
  .option('--domain <domain>', 'Account domain (e.g., acme.com)')
  .option('--properties <json>', 'Account properties as JSON string')
  .option('--json', 'Output as JSON')
  .action(async (accountId, options) => {
    requireAuth();

    try {
      const properties = parseProperties(options.properties);

      const data = await withSpinner(`Upserting account ${accountId}...`, () =>
        upsertAccount(accountId, options.domain, properties)
      );

      if (options.json) {
        printJson(data);
        return;
      }

      printSuccess(`Account ${accountId} upserted successfully`);
      console.log(chalk.dim(`Request ID: ${data.meta?.requestId}`));
      console.log('');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

accountCmd
  .command('delete <accountId>')
  .description('Delete an account')
  .option('--domain <domain>', 'Account domain (alternative to accountId)')
  .option('--json', 'Output as JSON')
  .action(async (accountId, options) => {
    requireAuth();

    try {
      const data = await withSpinner(`Deleting account ${accountId}...`, () =>
        deleteAccount(accountId, options.domain)
      );

      if (options.json) {
        printJson(data);
        return;
      }

      printSuccess(`Account ${accountId} deleted successfully`);
      console.log('');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

accountCmd
  .command('add-users <accountId> <userIds...>')
  .description('Add users to an account (up to 100)')
  .option('--json', 'Output as JSON')
  .action(async (accountId, userIds, options) => {
    requireAuth();

    if (userIds.length > 100) {
      printError('Maximum 100 users can be added at once');
      process.exit(1);
    }

    try {
      const data = await withSpinner(`Adding ${userIds.length} user(s) to account ${accountId}...`, () =>
        addUsersToAccount(accountId, userIds)
      );

      if (options.json) {
        printJson(data);
        return;
      }

      printSuccess(`Added ${userIds.length} user(s) to account ${accountId}`);
      console.log('');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

accountCmd
  .command('remove-users <accountId> <userIds...>')
  .description('Remove users from an account (up to 100)')
  .option('--json', 'Output as JSON')
  .action(async (accountId, userIds, options) => {
    requireAuth();

    if (userIds.length > 100) {
      printError('Maximum 100 users can be removed at once');
      process.exit(1);
    }

    try {
      const data = await withSpinner(`Removing ${userIds.length} user(s) from account ${accountId}...`, () =>
        removeUsersFromAccount(accountId, userIds)
      );

      if (options.json) {
        printJson(data);
        return;
      }

      printSuccess(`Removed ${userIds.length} user(s) from account ${accountId}`);
      console.log('');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// EVENTS
// ============================================================

const eventCmd = program.command('event').description('Manage events');

eventCmd
  .command('track <eventName>')
  .description('Track an event')
  .option('--user-id <userId>', 'User ID')
  .option('--account-id <accountId>', 'Account ID')
  .option('--metadata <json>', 'Event metadata as JSON string')
  .option('--json', 'Output as JSON')
  .action(async (eventName, options) => {
    requireAuth();

    if (!options.userId && !options.accountId) {
      printError('Either --user-id or --account-id (or both) must be provided');
      process.exit(1);
    }

    try {
      const metadata = parseProperties(options.metadata);

      const data = await withSpinner(`Tracking event "${eventName}"...`, () =>
        trackEvent(eventName, options.userId, options.accountId, metadata)
      );

      if (options.json) {
        printJson(data);
        return;
      }

      printSuccess(`Event "${eventName}" tracked successfully`);
      console.log(chalk.dim(`Request ID: ${data.meta?.requestId}`));
      console.log('');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

eventCmd
  .command('list')
  .description('List all available events')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();

    try {
      const data = await withSpinner('Fetching events...', () => getEvents());

      if (options.json) {
        printJson(data);
        return;
      }

      if (!data.data || data.data.length === 0) {
        console.log(chalk.yellow('No events found.'));
        return;
      }

      console.log(chalk.bold('\nAvailable Events\n'));

      const tableData = data.data.map(event => ({
        name: event.name,
        group: event.group || 'N/A'
      }));

      printTable(tableData, [
        { key: 'name', label: 'Event Name' },
        { key: 'group', label: 'Group' }
      ]);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// PROPERTIES
// ============================================================

const propertiesCmd = program.command('properties').description('View properties');

propertiesCmd
  .command('users')
  .description('List user properties')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();

    try {
      const data = await withSpinner('Fetching user properties...', () => getUserProperties());

      if (options.json) {
        printJson(data);
        return;
      }

      if (!data.data || data.data.length === 0) {
        console.log(chalk.yellow('No user properties found.'));
        return;
      }

      console.log(chalk.bold('\nUser Properties\n'));

      const tableData = data.data.map(prop => ({
        name: prop.name,
        type: prop.type || 'N/A'
      }));

      printTable(tableData, [
        { key: 'name', label: 'Property Name' },
        { key: 'type', label: 'Type' }
      ]);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

propertiesCmd
  .command('accounts')
  .description('List account properties')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();

    try {
      const data = await withSpinner('Fetching account properties...', () => getAccountProperties());

      if (options.json) {
        printJson(data);
        return;
      }

      if (!data.data || data.data.length === 0) {
        console.log(chalk.yellow('No account properties found.'));
        return;
      }

      console.log(chalk.bold('\nAccount Properties\n'));

      const tableData = data.data.map(prop => ({
        name: prop.name,
        type: prop.type || 'N/A'
      }));

      printTable(tableData, [
        { key: 'name', label: 'Property Name' },
        { key: 'type', label: 'Type' }
      ]);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// SEGMENTS
// ============================================================

const segmentsCmd = program.command('segments').description('View segments');

segmentsCmd
  .command('users')
  .description('List user segments')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();

    try {
      const data = await withSpinner('Fetching user segments...', () => getUserSegments());

      if (options.json) {
        printJson(data);
        return;
      }

      if (!data.data || data.data.length === 0) {
        console.log(chalk.yellow('No user segments found.'));
        return;
      }

      console.log(chalk.bold('\nUser Segments\n'));

      const tableData = data.data.map(segment => ({
        id: segment.id,
        name: segment.name || 'N/A'
      }));

      printTable(tableData, [
        { key: 'id', label: 'Segment ID' },
        { key: 'name', label: 'Name' }
      ]);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

segmentsCmd
  .command('accounts')
  .description('List account segments')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();

    try {
      const data = await withSpinner('Fetching account segments...', () => getAccountSegments());

      if (options.json) {
        printJson(data);
        return;
      }

      if (!data.data || data.data.length === 0) {
        console.log(chalk.yellow('No account segments found.'));
        return;
      }

      console.log(chalk.bold('\nAccount Segments\n'));

      const tableData = data.data.map(segment => ({
        id: segment.id,
        name: segment.name || 'N/A'
      }));

      printTable(tableData, [
        { key: 'id', label: 'Segment ID' },
        { key: 'name', label: 'Name' }
      ]);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// LINK
// ============================================================

program
  .command('link <userId> <accountId>')
  .description('Link a user to an account')
  .option('--json', 'Output as JSON')
  .action(async (userId, accountId, options) => {
    requireAuth();

    try {
      const data = await withSpinner(`Linking user ${userId} to account ${accountId}...`, () =>
        linkUserToAccount(userId, accountId)
      );

      if (options.json) {
        printJson(data);
        return;
      }

      printSuccess(`User ${userId} linked to account ${accountId}`);
      console.log('');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// VALIDATE
// ============================================================

program
  .command('validate')
  .description('Validate API key')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();

    try {
      const data = await withSpinner('Validating API key...', () => validateApiKey());

      if (options.json) {
        printJson(data);
        return;
      }

      printSuccess('API key is valid');
      console.log(chalk.dim(`Request ID: ${data.meta?.requestId}`));
      console.log('');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// SNIPPET
// ============================================================

program
  .command('snippet')
  .description('Get tracking snippet for website integration')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();

    try {
      const data = await withSpinner('Fetching tracking snippet...', () => getTrackingSnippet());

      if (options.json) {
        printJson(data);
        return;
      }

      console.log(chalk.bold('\nJourny.io Tracking Snippet\n'));
      console.log(data.data?.snippet || 'No snippet found');
      console.log('');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// Parse
// ============================================================

program.parse(process.argv);

if (process.argv.length <= 2) {
  program.help();
}
