Web Component Tester JUint Reporter
===================================

Generate junit reports from web-component-tester so the results can be parsed by Jenkins.

## Installation

```sh
npm install wct-junit-reporter --saveDev
```

## Basic Usage

Add the following configuration to web-component-tester's config file.

## Example

```js
module.exports = {
  plugins: {
    junit-reporter: {
    }
  }
}
```

## Options

Below are the available configuration options:
`appendMode` - if set to true then test results are appended to existing file.