// Express 4 no captura los errores de funciones async. Este envoltorio los
// manda al errorHandler central, asi las rutas no necesitan su propio try/catch.
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
