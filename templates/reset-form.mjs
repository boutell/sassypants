import { html } from 'common-tags';
import field from './field.mjs';

export default function resetForm({ error }) {
  return html`
    <form class="sa-login-form" method="POST" action="/reset-form">
      ${field('new-password', 'New Password', { required: true, type: 'password' })}
      <button type="submit">
        Reset Password
      </button>
    </form>
  `;
}
