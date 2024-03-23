export function asset(path) {
  if (process.env.RELEASE_ID) {
    return `${path}?cb=${process.env.RELEASE_ID}`;
  } else {
    return path;
  }
}
