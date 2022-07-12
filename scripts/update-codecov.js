const fs = require('fs');
const path = require('path');
// eslint-disable-next-line import/no-extraneous-dependencies
const yaml = require('js-yaml');

const { getPackages } = require('./util');

const file = path.join(__dirname, '../codecov.yml');
const obj = yaml.load(fs.readFileSync(file, 'utf8'));

const packages = getPackages({ publicOnly: true }).filter(
  (x) => ['apps', 'examples', 'tools'].includes(x.group) === false
);

const projects = { default: false };
const flags = {};
packages.forEach((x) => {
  const subfolder = path.basename(x.path);
  const folder = path.basename(path.dirname(x.path));
  const name = [folder, subfolder].join('-');

  projects[name] = { target: '80%', flags: name };
  flags[name] = { paths: [[folder, subfolder, 'lib'].join('/')] };
});

obj.coverage.status.project = projects;
obj.flags = flags;

fs.writeFileSync(
  file,
  yaml.dump(obj, {
    sortKeys: true, // sort object keys
  })
);
// eslint-disable-next-line no-console
console.log('codecov.yml updated');
