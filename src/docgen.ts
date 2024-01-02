import { createDocumentation } from 'micro-docgen';

async function main() {
  // test
  const docs = await createDocumentation({
    // source files
    input: ['src'],
    // output directory
    output: 'pages/tsdoc',
    // tsconfig path
    tsconfigPath: './tsconfig.json',
    // to generate markdown files
    markdown: true,
    // to generate json file
    jsonName: 'docs.json',
    // include custom files such as readme
  });

  console.log(
    `Took ${docs.metadata.generationMs.toFixed(
      0
    )}ms to generate the documentation!`
  );
}

main();
