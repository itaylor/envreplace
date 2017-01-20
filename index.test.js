const exec = require('child_process').exec;
const fs = require('fs');
const expect = require('expect');

const testFixtures = `${__dirname}/testFixtures`;
const tempTestFixtures = `${__dirname}/tempTestFixtures`;

suite('envreplace basic functionality', () => {
  beforeEach((done) => {
    exec(`cp -r "${testFixtures}" "${tempTestFixtures}"`, done);
  });
  afterEach((done) => {
    exec(`rm -rf "${tempTestFixtures}"`, done);
  });
  test('single file no globs', (done) => {
    exec(`NAME='Elon' ACTION='build rockets' node "${__dirname}/index.js" "${tempTestFixtures}/1.txt"`,
    (err, stdout, stderr) => {
      expect(err).toBe(null);
      expect(stdout).toBe('');
      expect(stderr).toBe('');
      const content = fs.readFileSync(`${tempTestFixtures}/1.txt`, 'utf8');
      expect(content).toBe(`Hello, my name is Elon.
I like to build rockets.
`);
      done();
    });
  });
  test('single file no globs with verbose output', (done) => {
    exec(`NAME='Elon' ACTION='build rockets' node "${__dirname}/index.js" -v "${tempTestFixtures}/1.txt"`,
    (err, stdout, stderr) => {
      expect(err).toBe(null);
      expect(stdout).toBe(`Examining file: ${tempTestFixtures}/1.txt
Replacing '\${env.NAME}' with 'Elon'
Replacing '\${env.ACTION}' with 'build rockets'
`);
      expect(stderr).toBe('');
      const content = fs.readFileSync(`${tempTestFixtures}/1.txt`, 'utf8');
      expect(content).toBe(`Hello, my name is Elon.
I like to build rockets.
`);
      done();
    });
  });
  test('single file no globs with missing value', (done) => {
    exec(`ACTION='build rockets' node "${__dirname}/index.js" "${tempTestFixtures}/1.txt"`,
    (err, stdout, stderr) => {
      expect(err).toBe(null);
      expect(stdout).toBe('');
      expect(stderr).toBe('');
      const content = fs.readFileSync(`${tempTestFixtures}/1.txt`, 'utf8');
      expect(content).toBe(`Hello, my name is .
I like to build rockets.
`);
      done();
    });
  });
  test('single file no globs with missing value exits with error with -e flag', (done) => {
    exec(`ACTION='build rockets' node "${__dirname}/index.js" -e "${tempTestFixtures}/1.txt"`,
    (err, stdout, stderr) => {
      expect(err).toExist();
      expect(stdout).toBe('');
      expect(stderr).toBe(`Couldn't find expected env var '\${env.NAME}' in file ${tempTestFixtures}/1.txt\n`);
      const content = fs.readFileSync(`${tempTestFixtures}/1.txt`, 'utf8');
      expect(content).toBe(`Hello, my name is \${env.NAME}.
I like to \${env.ACTION}.
`);
      done();
    });
  });
  test('single folder', (done) => {
    exec(`VARIABLE=var node "${__dirname}/index.js" "${tempTestFixtures}/f1/f2/"`,
    (err, stdout, stderr) => {
      expect(err).toBe(null);
      expect(stdout).toBe('');
      expect(stderr).toBe('');
      const content3Txt = fs.readFileSync(`${tempTestFixtures}/f1/f2/3.txt`, 'utf8');
      expect(content3Txt).toBe(`Just a file with a var in it var twice on the same line.
`);
      done();
    });
  });
  test('Multiple files, no globs', (done) => {
    exec(`ACTION='build rockets' node "${__dirname}/index.js" -e "${tempTestFixtures}/1.txt" "${tempTestFixtures}/2.txt"`,
    (err, stdout, stderr) => {
      expect(err).toExist();
      expect(stdout).toBe('');
      expect(stderr).toBe(`Couldn't find expected env var '\${env.NAME}' in file ${tempTestFixtures}/1.txt\n`);
      const content = fs.readFileSync(`${tempTestFixtures}/1.txt`, 'utf8');
      expect(content).toBe(`Hello, my name is \${env.NAME}.
I like to \${env.ACTION}.
`);
      done();
    });
  });
  test('Provide alternate regex with -r flag', (done) => {
    exec(`FOO='this is foo' BAR='this is bar' node "${__dirname}/index.js" -r '&#@(.*)?@#&' "${tempTestFixtures}/altPattern.txt"`,
    (err, stdout, stderr) => {
      expect(err).toBe(null);
      expect(stdout).toBe('');
      expect(stderr).toBe('');
      const content = fs.readFileSync(`${tempTestFixtures}/altPattern.txt`, 'utf8');
      expect(content).toBe(`This is an alternate pattern match
this is foo
this is bar
this is foo
`);
      done();
    });
  });
  test('Test globbing, single glob', (done) => {
    exec(`VARIABLE=var SOMEVAR='some var' SOMEOTHERVAR='another var' node "${__dirname}/index.js" '${tempTestFixtures}/**/*.txt'`,
    (err, stdout, stderr) => {
      expect(err).toBe(null);
      expect(stdout).toBe('');
      expect(stderr).toBe('');
      const content3Txt = fs.readFileSync(`${tempTestFixtures}/f1/f2/3.txt`, 'utf8');
      const content4Txt = fs.readFileSync(`${tempTestFixtures}/f1/4.txt`, 'utf8');
      expect(content3Txt).toBe(`Just a file with a var in it var twice on the same line.
`);
      expect(content4Txt).toBe(`Var 1: some var
Var 2: another var
`);
      done();
    });
  });
  test('Test globbing, multi globs', (done) => {
    exec(`VARIABLE=var SOMEVAR='some var' SOMEOTHERVAR='another var' node "${__dirname}/index.js" '${tempTestFixtures}/f1/f2/*.txt' '${tempTestFixtures}/f1/*.txt'`,
    (err, stdout, stderr) => {
      expect(err).toBe(null);
      expect(stdout).toBe('');
      expect(stderr).toBe('');
      const content3Txt = fs.readFileSync(`${tempTestFixtures}/f1/f2/3.txt`, 'utf8');
      const content4Txt = fs.readFileSync(`${tempTestFixtures}/f1/4.txt`, 'utf8');
      expect(content3Txt).toBe(`Just a file with a var in it var twice on the same line.
`);
      expect(content4Txt).toBe(`Var 1: some var
Var 2: another var
`);
      done();
    });
  });
});
