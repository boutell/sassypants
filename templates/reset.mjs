import { html } from 'common-tags';
import field from './field.mjs';

export default function reset() {
  return html`
    <form class="sa-reset-form" method="POST" action="/reset">
      ${field('email', 'Email Address', { required: true, type: 'email' })}
      <button type="submit">
        Reset Password
      </button>
    </form>
  `;
}
