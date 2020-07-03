const cjsTransformer = require("es-dev-commonjs-transformer");

module.exports = {
  nodeResolve: true,
  responseTransformers: [cjsTransformer(["**/node_modules/@open-wc/**/*"])],
  middlewares: [
    function rewriteIndex(context, next) {
      // force index handling for stream pages, even if they have a '.'
      if (context.url.includes("@")) {
        context.url = "/index.html";
      }
      return next();
    },
  ],
};
