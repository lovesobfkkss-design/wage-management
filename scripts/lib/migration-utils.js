'use strict';

function parseArgs(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (!token.startsWith('--')) {
      continue;
    }

    const [key, inlineValue] = token.slice(2).split('=');
    const next = argv[index + 1];

    if (inlineValue !== undefined) {
      args[key] = inlineValue;
      continue;
    }

    if (!next || next.startsWith('--')) {
      args[key] = true;
      continue;
    }

    args[key] = next;
    index += 1;
  }

  return args;
}

function timestampIso() {
  return new Date().toISOString();
}

function compactTimestamp() {
  return timestampIso().replace(/[-:.TZ]/g, '');
}

function buildMigrationId() {
  return `mig_${compactTimestamp()}`;
}

function countCollection(value) {
  if (!value) {
    return 0;
  }

  if (Array.isArray(value)) {
    return value.length;
  }

  if (typeof value === 'object') {
    return Object.keys(value).length;
  }

  return 0;
}

function assertRequiredArgs(args, keys) {
  const missing = keys.filter((key) => !args[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required arguments: ${missing.map((key) => `--${key}`).join(', ')}`);
  }
}

module.exports = {
  assertRequiredArgs,
  buildMigrationId,
  countCollection,
  parseArgs,
  timestampIso
};
