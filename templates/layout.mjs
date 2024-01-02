import { html, safeHtml } from 'common-tags';

export default function layout({
  title,
  body,
  user,
  userNav
}) {
  if (title == null) {
    throw new Error('title is required');
  }
  if (body == null) {
    throw new Error('body is required');
  }
  return html`
<!DOCTYPE html>
<html>
  <head>
    <title>${safeHtml`${title}`}</title>
  </head>
  <body>
    <header>
      ${userNav({ user })}
    </header>
    <main>
      ${body}
    </main>
  </body>
</html>
  `;
}
