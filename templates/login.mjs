import { html } from 'common-tags';
import field from './field.mjs';

export default function login({ error }) {
  let errorMessage;
  if (error === 'invalid') {
    errorMessage = 'That login is not correct, or the account has not been confirmed. Please try again or reset your password.';
  } else {
    // No need to be overly specific, we already have
    // required attributes
    errorMessage = 'Please complete all fields.';
  }
  const errorMarkup = error ? html`
    <section class="sa-error sa-login-error">
      ${errorMessage}
    </section>
  ` : '';
  return html`
    ${errorMarkup}
    <form class="sa-login-form" method="POST" action="/login">
      ${field('email', 'Email Address', { required: true })}
      ${field('password', 'Password', { required: true, type: 'password' })}
      <button type="submit">
        Log In
      </button>
    </form>
    <a class="sa-login-reset-link" href="/reset">Forgot your password?</a>
  `;
}
