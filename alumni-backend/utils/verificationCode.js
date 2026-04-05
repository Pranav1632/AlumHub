const crypto = require("crypto");

const DEFAULT_TTL_MINUTES = 10;

const generateNumericCode = (digits = 6) => {
  const max = 10 ** digits;
  const min = 10 ** (digits - 1);
  const random = crypto.randomInt(min, max);
  return String(random);
};

const hashCode = (code) => crypto.createHash("sha256").update(String(code)).digest("hex");

const createVerificationPayload = ({
  digits = 6,
  ttlMinutes = DEFAULT_TTL_MINUTES,
} = {}) => {
  const code = generateNumericCode(digits);
  const codeHash = hashCode(code);
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
  return { code, codeHash, expiresAt };
};

const isCodeValid = ({ providedCode, storedHash, expiresAt }) => {
  if (!providedCode || !storedHash || !expiresAt) return false;
  if (new Date(expiresAt).getTime() < Date.now()) return false;
  return hashCode(providedCode) === storedHash;
};

module.exports = {
  createVerificationPayload,
  isCodeValid,
};
