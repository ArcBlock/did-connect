/* eslint-disable max-len */
/* eslint-disable array-callback-return */
/* eslint-disable consistent-return */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const { getPackages } = require('./util');

const packageList = getPackages({ publicOnly: true }).map(
  (x) =>
    `- [${x.name} <img src="https://img.shields.io/npm/v/${x.name}.svg" alt="Version">](https://www.npmjs.com/package/${x.name})`
);

const readmeFile = path.join(__dirname, '../README.md');
const readmeContent = `![asset-chain](https://www.arcblock.io/.netlify/functions/badge/?text=OCAP%20SDK)

## Table of Contents

- [Table of Contents](#table-of-contents)
- [Introduction](#introduction)
- [Packages](#packages)
- [Install](#install)
- [Usage](#usage)
- [Contribution](#contribution)
- [Compatibility](#compatibility)
- [Report a Bug?](#report-a-bug)
- [License](#license)

## Introduction

[![codecov](https://codecov.io/gh/ArcBlock/did-connect/branch/master/graph/badge.svg?token=AJ512UHZ48)](https://codecov.io/gh/ArcBlock/did-connect)
[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lernajs.io/)
[![docs](https://img.shields.io/badge/powered%20by-arcblock-green.svg)](https://docs.arcblock.io)
[![Gitter](https://badges.gitter.im/ArcBlock/community.svg)](https://gitter.im/ArcBlock/community?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)

> Last updated at ${new Date().toLocaleString()}

Javascript SDK for OCAP, which is an awesome framework to write distributed blockchain applications.

## Packages

${packageList.join('\n')}

## Usage

Checkout examples folder

## Contribution

Checkout [CONTRIBUTION.md](https://github.com/ArcBlock/did-connect/blob/master/CONTRIBUTION.md)

## Compatibility

OCAP SDK works with node.js v10.x or above, checkout github actions for build status.

## Report a Bug?

Bugs and feature requests please create new issues [here](https://github.com/ArcBlock/did-connect/issues)

## License

Copyright 2018-2021 ArcBlock

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
`;

fs.writeFileSync(readmeFile, readmeContent);
console.log('README.md updated');
