/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
const fs = require('fs');
const path = require('path');

const sleep = (timeout) => new Promise((resolve) => setTimeout(resolve, timeout));
const { workspaces } = require(path.join(__dirname, '../package.json'));

const getPackages = ({ grouped = false, publicOnly = false } = {}) => {
  let packages = [];
  workspaces.forEach(async (w) => {
    const group = w.split('/').shift();
    const dir = path.join(__dirname, '..', group);
    if (fs.existsSync(dir) === false) {
      return;
    }

    const items = fs
      .readdirSync(dir)
      .filter((x) => x.startsWith('.') === false)
      .filter((x) => fs.statSync(path.join(dir, x)).isDirectory())
      .filter((x) => fs.existsSync(path.join(dir, x, 'package.json')))
      .map((x) => ({ folder: x, json: require(path.join(dir, x, 'package.json')) }));

    packages = packages.concat(
      items.map((x) => ({
        group,
        folder: x,
        version: x.json.version,
        description: x.json.description,
        name: x.json.name,
        public: x.json.publishConfig ? x.json.publishConfig.access === 'public' : false,
        path: path.join(dir, x.folder),
      }))
    );
  });

  const filtered = publicOnly ? packages.filter((x) => x.public || !x.private) : packages;
  if (grouped === false) {
    return filtered;
  }

  const groupedPackages = {};
  filtered.forEach((x) => {
    if (!groupedPackages[x.group]) {
      groupedPackages[x.group] = [];
    }

    groupedPackages[x.group].push(x);
  });

  return groupedPackages;
};

module.exports = {
  sleep,
  getPackages,
};
