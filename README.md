# OpenNautilus | contracts

OpenNautilus Contracts is an open-source library designed to empower developers building smart contracts for zero-knowledge applications (zkApps). 

It provides a set of tools and abstractions that simplify the development process, enabling you to focus on the core logic of your zkApp without getting bogged down in low-level complexities.

## Overview

### Installation

TBD

### Usage

### How to build

```sh
pnpm run build
```

### How to run tests

```sh
pnpm run test
pnpm run testw # watch mode
```

### How to run coverage

```sh
pnpm run coverage
```

### Local
```
pnpm link --global

cd <project>
pnpm link --global opennautilus-contracts

```

### Documentation
```
npm install -g @microsoft/api-extractor @microsoft/api-documenter
api-extractor run --local --verbose 
api-documenter yaml -i tmp/api -o tmp/api-yaml

npm install -g api-documenter-yaml-to-antora-asciidoc
api-documenter-yaml-to-antora-asciidoc asciidoc -i tmp/api-yaml

```

## Learn More

TBD

## Security

TBD

## Contribute

OpenNautilus Contracts exists thanks to its contributors. There are many ways you can participate and help build high quality software. Check out the [contribution guide](CONTRIBUTING.md)!

## License

OpenNautilus Contracts is released under the [Apache-2.0](LICENSE)

## Legal

TBD