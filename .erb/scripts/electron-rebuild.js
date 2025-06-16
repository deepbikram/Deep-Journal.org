import { execSync } from 'child_process';
import fs from 'fs';
import webpackPaths from '../configs/webpack.paths.ts';

const packageJson = JSON.parse(fs.readFileSync('../../release/app/package.json', 'utf8'));
const { dependencies } = packageJson;

if (
  Object.keys(dependencies || {}).length > 0 &&
  fs.existsSync(webpackPaths.appNodeModulesPath)
) {
  const electronRebuildCmd =
    '../../node_modules/.bin/electron-rebuild --force --types prod,dev,optional --module-dir .';
  const cmd =
    process.platform === 'win32'
      ? electronRebuildCmd.replace(/\//g, '\\')
      : electronRebuildCmd;
  execSync(cmd, {
    cwd: webpackPaths.appPath,
    stdio: 'inherit',
  });
}
