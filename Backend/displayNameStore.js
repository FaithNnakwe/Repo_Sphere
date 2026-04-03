const fs = require('fs');
const path = require('path');

const dataDirectory = path.join(__dirname, 'data');
const displayNameFile = path.join(dataDirectory, 'display-names.json');

const ensureStorage = () => {
  if (!fs.existsSync(dataDirectory)) {
    fs.mkdirSync(dataDirectory, { recursive: true });
  }

  if (!fs.existsSync(displayNameFile)) {
    fs.writeFileSync(displayNameFile, '{}', 'utf8');
  }
};

const normalizeLogin = (login) => (login || '').trim().toLowerCase();

const loadDisplayNames = () => {
  ensureStorage();

  try {
    const content = fs.readFileSync(displayNameFile, 'utf8');
    const parsed = JSON.parse(content);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const saveDisplayNames = (names) => {
  ensureStorage();
  fs.writeFileSync(displayNameFile, JSON.stringify(names, null, 2), 'utf8');
};

const setDisplayName = (login, displayName) => {
  const normalizedLogin = normalizeLogin(login);
  if (!normalizedLogin) {
    return null;
  }

  const trimmedDisplayName = (displayName || '').trim();
  if (!trimmedDisplayName) {
    return null;
  }

  const names = loadDisplayNames();
  names[normalizedLogin] = trimmedDisplayName;
  saveDisplayNames(names);
  return trimmedDisplayName;
};

const getDisplayName = (login) => {
  const normalizedLogin = normalizeLogin(login);
  if (!normalizedLogin) {
    return null;
  }

  const names = loadDisplayNames();
  return names[normalizedLogin] || null;
};

const getDisplayNameMap = () => loadDisplayNames();

module.exports = {
  setDisplayName,
  getDisplayName,
  getDisplayNameMap,
};