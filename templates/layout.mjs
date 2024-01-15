export default function template({
  title,
  body,
  ...rest
}, {
  html,
  render
}) {
  return html`
    <header>
      <h1>${title}</h1>
      ${render('userNav')}
    </header>
    <main>
      ${body}
    </main>
    ${endBody}
  `;
}
