const crypto = require('crypto');

const PREFIJO = 'scrypt$';

function esHash(valor) {
  return typeof valor === 'string' && valor.startsWith(PREFIJO);
}

function hashPassword(password) {
  const sal = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, sal, 64).toString('hex');
  return `${PREFIJO}${sal}$${hash}`;
}

function verificarPassword(password, guardado) {
  if (!guardado || typeof password !== 'string') return false;

  if (!esHash(guardado)) {
    return guardado === password;
  }

  const [, sal, hashOriginal] = guardado.split('$');
  if (!sal || !hashOriginal) return false;

  const hashCalculado = crypto.scryptSync(password, sal, 64);
  const hashEsperado = Buffer.from(hashOriginal, 'hex');
  if (hashCalculado.length !== hashEsperado.length) return false;

  return crypto.timingSafeEqual(hashCalculado, hashEsperado);
}

module.exports = { hashPassword, verificarPassword, esHash };
