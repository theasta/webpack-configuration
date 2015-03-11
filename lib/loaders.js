var requestedLoaders = [];
module.exports = {
  add: function (loader) {
    requestedLoaders.push(loader);
    return loader;
  },
  list: function () {
    return requestedLoaders;
  }
};
