import { html, safeHtml } from 'common-tags';
import field from './field.mjs';

export default function resetForm({ code }) {
  return html`
    <form class="sa-login-form" method="POST" action="/reset-form">
      ${field('new-password', 'New Password', { required: true, type: 'password' })}
      <input type="hidden" name="code" value="${safeHtml`${code}`}" />
      <button type="submit">
        Reset Password
      </button>
    </form>
  `;
}
