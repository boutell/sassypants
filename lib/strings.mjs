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
  const safeParams = params.map(s => {
    if (s instanceof SafeString) {
      return s.value;
    } else {
      return safeHtml`${s}`;
    }
  });
  const result = rawHtml(templateStrings, ...safeParams);
  console.log('result is:', result);
  return result;
};

export function safe(s) {
  return new SafeString(s);
}

export function template(fn) {
  return params => safe(fn(params));
}
