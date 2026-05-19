function parseCoord(value, name) {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    throw new Error(`${name} must be a valid number`);
  }
  return n;
}

function requireLatLng(query) {
  const lat = parseCoord(query.lat, 'lat');
  const lng = parseCoord(query.lng, 'lng');
  return { lat, lng };
}

module.exports = { parseCoord, requireLatLng };
