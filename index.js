var webpack = require('webpack');
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var VersionRetrievalPlugin = require("version-retrieval-webpack-plugin");
var _ = require('lodash');

/*
 options.extractCSS
 options.longTermCaching
 options.debug
 options.devtool
 options.commonsChunk
 options.versionMap
 */
module.exports = function (baseConfig, options) {

  var defaultConfig = {
    module: { loaders: {} },
    resolve: { extensions: ["", ".webpack.js", ".web.js", ".js"] },
    output: {}
  };

  var config = _.merge({}, defaultConfig, baseConfig || {});

  var defaultOptions = {
    longTermCaching: false,
    extractCSS: false,
    react: true
  };

  options = _.merge({}, defaultOptions, options || {});

  var getNameWithChunk = function (filename, extension) {
    var fingerprint = options.longTermCaching ? ".[chunkhash]" : "";
    return filename + fingerprint + "." + extension
  };

  /* output */
  config.output.filename = getNameWithChunk("[name]", "js");
  config.output.chunkFilename = getNameWithChunk("section_[id]", "js");

  if (options.path) { config.output.path = options.path;}
  if (options.publicPath) { config.output.publicPath = options.publicPath;}

  /* module.loaders */
  var extraLoaders = [];

  /* plugins */
  var plugins = [
    new webpack.optimize.OccurrenceOrderPlugin(true)
  ];

  if (options.extractCSS) {
    plugins.push(new ExtractTextPlugin(getNameWithChunk("[name]", "css")));
    extraLoaders.push(
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract("style-loader", "css-loader", {publicPath: ""})
      }
    );
  } else {
    extraLoaders.push({ test: /\.css$/, loader: "style-loader!css-loader" });
  }

  // do more than config.debug
  if (options.debug) {
    config.output.pathinfo = true;
    config.debug = true;
    config.devtool = options.devtool || 'eval';
  } else {
    config.output.pathinfo = false;
    config.debug = false;
    config.devtool = false;
  }

  if (options.watch) {
    config.watch = true;
  }

  if (options.react) {
    config.resolve.extensions.push(".jsx");
    extraLoaders.push(
      {
        test: /\.jsx$/,
        loader: options.hot ? "react-hot-loader!jsx-loader?harmony" : "jsx-loader?harmony"
      }
    );
  }

  if (options.commonsChunk) {
    var commonsChunkConfig = {
      name: "commons",
      filename: getNameWithChunk("commons", "js")
    };
    if (options.commonsChunkMin) {
      commonsChunkConfig.minChunks = options.commonsChunkMin;
    }
    plugins.push(new webpack.optimize.CommonsChunkPlugin(commonsChunkConfig));
  }

  if (_.isString(options.stats)) {
    plugins.push(function () {
      this.plugin("done", function (stats) {
        var fs = require('fs');
        var jsonStats = stats.toJson({
          chunkModules: true,
          exclude: [/node-libs-browser/]
        });
        fs.writeFileSync(options.stats, JSON.stringify(jsonStats));
      });
    });
  }

  if (_.isObject(options.featureFlags)) {
    plugins.push(new webpack.DefinePlugin(options.featureFlags));
  }

  if (_.isString(options.versionMap)) {
    plugins.push(new VersionRetrievalPlugin({ outputFile: options.versionMap }));
  }

  config.plugins = plugins;
  config.module.loaders = config.module.loaders.concat(extraLoaders);

  return config;
};
