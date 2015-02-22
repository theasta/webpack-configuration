# A configuration helper for Webpack

## Example

```javascript
var baseConfig = {
  module: {
    loaders: [
      { test: /\.(png|jpg)$/, loader: "url?limit=1000"},
      { test: /\.html$/, loader: "html"}
    ]
  },
};
var configurationCreator = require('webpack-configuration');
module.exports = configurationCreator(baseConfig, {
  commonsChunk: true,
  extractCSS: true,
  path: 'dist/',
  publicPath: "http://static.example.com/assets",
  featureFlags: {
    DEBUG: false
  }
});
```
