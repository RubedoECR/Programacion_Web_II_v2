// Error con código HTTP. Los controladores lo lanzan y el errorHandler lo responde.
class ErrorApi extends Error {
  constructor(status, mensaje, extra = {}) {
    super(mensaje);
    this.status = status;
    this.extra = extra;
  }
}

module.exports = ErrorApi;
