module.exports = function(app) {
  app.use((req, res, next) => {
    res.removeHeader('Cross-Origin-Embedder-Policy')
    next()
  })
}