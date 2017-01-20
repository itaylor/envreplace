/* eslint-disable no-template-curly-in-string, no-console */
const globby = require('globby');
const packageJson = require('./package.json');
require('colors');
const program = require('commander');
const fs = require('fs');

program
  .version(packageJson.version)
  .usage('[options] <pathOrGlob...>')
  .action((...pathOrGlob) => {
    // commander puts a ref to this as the last prop, we don't want it.
    pathOrGlob.pop();
    program.pathOrGlob = pathOrGlob;
    if (program.regexEnv) {
      program.regexEnv = new RegExp(program.regexEnv, 'gi');
    }
    Promise.all(program.pathOrGlob.map(
      glob => globby(glob))).then(
      (fileLists) => {
        const fileList = flatten(fileLists);
        replaceInFiles(fileList, program.regexEnv).then(
          () => process.exit(0)).catch(
          (err) => {
            console.error(err);
            process.exit(1);
          });
      }).catch((e) => {
        console.error(e);
        process.exit(1);
      });
  })
  .option('-r, --regexEnv <regex>', 'JS format regex to use for searching/replacing env vars in files. Must have the name of the env var as first match group. default: \'\\${env\\.(.*?)}\'')
  .option('-v, --verbose', 'Log data about each variable substituted')
  .option('-e, --errorOnMissing', 'Throws an error in an environment variable declared in a file is not found in the environment')
  .on('--help', () => {
    console.log('  Command Reference: ');
    console.log('');
    console.log('  <pathOrGlob ...> one or more paths or globs to perform replace operations in');
    console.log('  Examples: ');
    console.log('');
    console.log('    Replace all occurences of the string ${env.ENV_VAR} in all .txt files inside of the test folder with the word "My var"');
    console.log('      export ENV_VAR=\'My var\'');
    console.log('      envreplace \'test/**.txt\'');
    console.log('');
  })
  .parse(process.argv);

function flatten(arr) {
  return arr.reduce((a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), []);
}

function filesFromFilesOrDirs(filesOrDirs) {
  return flatten(filesOrDirs.map((file) => {
    if (fs.statSync(file).isDirectory()) {
      const results = [];
      fs.readdirSync(file).forEach((f) => {
        const p = `${file}/${f}`;
        if (fs.statSync(p).isFile()) {
          results.push(p);
        }
      });
      return results;
    }
    return file;
  }));
}

function replaceInFiles(files, regex = /\${env\.(.*?)}/gi) {
  const allFiles = filesFromFilesOrDirs(files);
  const dedupedFiles = [...(new Set(allFiles))];
  return Promise.all(dedupedFiles.map(file => new Promise((resolve, reject) => {
    fs.readFile(file, 'utf8', (error, contents) => {
      if (error) {
        reject(error);
        return;
      }
      if (program.verbose) {
        console.log(`Examining file: ${file}`);
      }
      const newContent = contents.replace(regex, (match, envVarName) => {
        const val = process.env[envVarName];
        if (val) {
          if (program.verbose) {
            console.log(`Replacing '${match}' with '${val}'`);
          }
          return val;
        }
        if (program.errorOnMissing) {
          console.error(`Couldn't find expected env var '${match}' in file ${file}`);
          process.exit(2);
        }
        return '';
      });
      if (newContent !== contents) {
        fs.writeFile(file, newContent, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  })));
}
