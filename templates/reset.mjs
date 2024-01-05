import { template, html, input } from '../helpers.mjs';

export default template(() => {
  return html`
    <form class="sa-reset-form" method="POST" action="/reset">
      ${input('email', 'Email Address', { required: true, type: 'email' })}
      <button type="submit">
        Reset Password
      </button>
    </form>
  `;
});
