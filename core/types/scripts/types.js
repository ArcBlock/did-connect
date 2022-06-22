// eslint-disable-next-line import/no-extraneous-dependencies
const { convertFromDirectory } = require('joi-to-typescript');

async function types() {
  // eslint-disable-next-line no-console
  console.log('Running joi-to-typescript...');

  // Configure your settings here
  const result = await convertFromDirectory({
    fileHeader:
      '/* eslint-disable @typescript-eslint/indent */\n// FIXME: convert union types to literal-union with type-fest',
    schemaDirectory: './src/schemas',
    typeOutputDirectory: './src/types',
    debug: true,
  });

  if (result) {
    // eslint-disable-next-line no-console
    console.log('Completed joi-to-typescript');
  } else {
    // eslint-disable-next-line no-console
    console.log('Failed to run joi-to-typescrip');
  }
}

types();
