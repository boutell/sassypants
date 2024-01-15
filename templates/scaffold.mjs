export default function template({
  title,
  body,
  headStart = '',
  headEnd = '',
  bodyStart = '',
  bodyEnd = '',
  dir,
  lang,
  t
}, {
  html,
  tag
}) {
  if (title == null) {
    throw new Error('title is required');
  }
  if (body == null) {
    throw new Error('body is required');
  }
  return html`
    <!DOCTYPE html>
    ${tag('html', { dir, lang }, html`
      <head>
        ${headStart}
        <title>${title}</title>
        ${headEnd}
      </head>
      <body>
        ${bodyStart}
        ${body}
        ${bodyEnd}
      </body>
    `)}
  `;
}
