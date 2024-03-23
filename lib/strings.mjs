// The html template tag is based on common-tags,
// but escapes values by default unless they
// are wrapped in a safe() call, or are the output
// of another template

import { html as rawHtml, safeHtml } from 'common-tags';

class SafeString {
  constructor(s) {
    this.value = s;
  }
  toString() {
    return this.value;
  }
};

export function html(templateStrings, ...params) {
  const safeParams = params.map(makeSafe);
  return safe(rawHtml(templateStrings, ...safeParams));
};

function escapeAttr(s) {
  return s.replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('&', '&amp;').replaceAll('"', '&quot;');
}

// Nullish attributes are skipped. Attributes set to `true`
// are emitted without a value. If the body argument is
// not provided the tag is considered self-closing (pass an
// empty string for a tag like "script src" that must have a
// closing tag). The body is typically
// the output of a template, and will be escaped if it is not
// template output or otherwise marked as safe.

export function tag(name, attrs, body = false) {
  let open = `<${name}`;
  for (const [ key, val ] of Object.entries(attrs)) {
    if (val === true) {
      open += ` ${escapeAttr(key)}`;
    } else if (val == null) {
      continue;
    } else {
      open += ` ${escapeAttr(key)}=${escapeAttr(val)}`;
    }
  }
  if (body === false) {
    open += '/>';
    return safe(open);
  } else {
    open += '>';
    return safe(`${open}${makeSafe(body)}</${name}>`);
  }
}

export function safe(s) {
  return new SafeString(s);
}

function makeSafe(s) {
  if (s instanceof SafeString) {
    return s.value;
  } else {
    return safeHtml`${s}`;
  }
}
