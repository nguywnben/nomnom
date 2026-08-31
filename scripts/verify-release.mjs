import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bundledNpmCli = path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js');
const npmCommand = fs.existsSync(bundledNpmCli) ? process.execPath : 'npm';
const npmPrefix = fs.existsSync(bundledNpmCli) ? [bundledNpmCli] : [];
const roundIndex = process.argv.indexOf('--rounds');
const rounds = roundIndex === -1 ? 1 : Number(process.argv[roundIndex + 1]);
const includeSmoke = process.argv.includes('--smoke');

if (!Number.isInteger(rounds) || rounds < 1 || rounds > 3) {
  throw new Error('--rounds must be an integer between 1 and 3.');
}

function run(label, command, args, cwd) {
  console.log(`\n[release] ${label}`);
  const result = spawnSync(command, args, {
    cwd,
    env: process.env,
    encoding: 'utf8',
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${label} failed with exit code ${result.status}.`);
  }
}

function collectJavaScriptFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectJavaScriptFiles(target);
    return entry.isFile() && target.endsWith('.js') ? [target] : [];
  });
}

function checkServerSyntax() {
  const files = collectJavaScriptFiles(path.join(repositoryRoot, 'server', 'src'));
  for (const file of files) {
    const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
    if (result.status !== 0) {
      process.stderr.write(result.stderr || result.stdout || 'Unknown syntax error.');
      throw new Error(`Server syntax check failed: ${path.relative(repositoryRoot, file)}`);
    }
  }
  console.log(`[release] Server syntax: ${files.length} files passed.`);
}

for (let round = 1; round <= rounds; round += 1) {
  console.log(`\n========== RELEASE GATE ${round}/${rounds} ==========`);
  run('Client lint', npmCommand, [...npmPrefix, 'run', 'lint'], path.join(repositoryRoot, 'client'));
  run('Client tests', npmCommand, [...npmPrefix, 'test'], path.join(repositoryRoot, 'client'));
  run('Client production build', npmCommand, [...npmPrefix, 'run', 'build'], path.join(repositoryRoot, 'client'));
  run('Server tests', npmCommand, [...npmPrefix, 'test'], path.join(repositoryRoot, 'server'));
  checkServerSyntax();
  run('Client dependency audit', npmCommand, [...npmPrefix, 'audit', '--audit-level=high'], path.join(repositoryRoot, 'client'));
  run('Server dependency audit', npmCommand, [...npmPrefix, 'audit', '--audit-level=high'], path.join(repositoryRoot, 'server'));
  if (includeSmoke) {
    run('Three-role API smoke', npmCommand, [...npmPrefix, 'run', 'smoke:roles'], path.join(repositoryRoot, 'server'));
  }
}

console.log(`\n[release] ${rounds} consecutive release gate round(s) passed.`);
