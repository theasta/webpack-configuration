var webpack = require("webpack");
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var VersionRetrievalPlugin = require("version-retrieval-webpack-plugin");
var _ = require("lodash");
var LOADERS = require("./lib/constants/loaders");
var loadersUtils = require("./lib/loaders");

/**
 * @param {object} options
 * @param {object|string} [options.autoprefixer=false] - Use autoprefixer
 * @param {boolean} [options.commonsChunk=false] - Create a common chunk
 * @param {boolean} [options.extractCSS=false] - Extract CSS from JS
 * @param {string} [options.extractCSSPublicPath=""] - Public Path used when creating external CSS files
 * @param {boolean} [options.debug=false] - Enable or disable debug mode
 * @param {string} [options.devtool="eval"] (eval, source-map)
 * @param {boolean} [options.longTermCaching=false]
 * @param {string} [options.style="css"] (css, less)
 * @param {boolean} [options.versionMap] - Path to the version map file
 * @param {boolean} [options.verbose=false] - Will output the list of loaders to install through npm
 */
module.exports = function (baseConfig, options) {

  var defaultConfig = {
    module: { loaders: [] },
    resolve: { extensions: ["", ".webpack.js", ".web.js", ".js"] },
    output: {}
  };

  var config = _.merge({}, defaultConfig, baseConfig || {});

  var defaultOptions = {
    autoprefixer: false,
    commonsChunk: false,
    extractCSS: false,
    extractCSSPublicPath: "",
    debug: false,
    devtool: "eval",
    longTermCaching: false,
    style: "css",
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

  var styleRegExp;
  var styleLoader = loadersUtils.add(LOADERS.STYLE);
  var stylesLoader = [loadersUtils.add(LOADERS.CSS)];
  if (options.style === "css") {
    styleRegExp = /\.css$/;

    if (options.autoprefixer) {
      var autoprefixerLoader = loadersUtils.add(LOADERS.AUTOPREFIXER);
      if (_.isString(options.autoprefixer)) {
        autoprefixerLoader += "?browsers=" + options.autoprefixer;
      } else if (_.isArray(options.autoprefixer)) {
        autoprefixerLoader += "?" + JSON.stringify({
          browsers: options.autoprefixer
        });
      }
      stylesLoader.push(autoprefixerLoader);
    }
  } else if (options.style === "less") {
    styleRegExp = /\.less$/;
    stylesLoader.push(loadersUtils.add(LOADERS.LESS));
  }

  if (options.extractCSS) {
    plugins.push(new ExtractTextPlugin(getNameWithChunk("[name]", "css")));
    extraLoaders.push(
      {
        test: styleRegExp,
        loader: ExtractTextPlugin.extract(styleLoader, stylesLoader.join("!"), {publicPath: ""})
      }
    );
  } else {
    stylesLoader.unshift(styleLoader);
    extraLoaders.push({ test: styleRegExp, loader: stylesLoader.join("!") });
  }

  // do more than config.debug
  if (options.debug) {
    config.output.pathinfo = true;
    config.debug = true;
    config.devtool = options.devtool;
  } else {
    config.output.pathinfo = false;
    config.debug = false;
    config.devtool = false;
  }

  if (options.watch) {
    config.watch = true;
  }

  if (options.react) {
    var reactLoaders = [loadersUtils.add(LOADERS.JSX) + "?harmony"];
    if (options.hot) {
      reactLoaders.unshift(loadersUtils.add(LOADERS.REACT_HOT));
    }
    config.resolve.extensions.push(".jsx");
    extraLoaders.push(
      {
        test: /\.jsx$/,
        loader: reactLoaders.join("!")
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
        var fs = require("fs");
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

  if (options.verbose) {
    console.log("Following loaders need to be installed:", loadersUtils.list())
  }

  return config;
};
