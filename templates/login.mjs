import { html } from 'common-tags';
import field from './field.mjs';

export default function login({ error, reset }) {
  let errorMessage, message;
  if (error === 'invalid') {
    errorMessage = 'That login is not correct, or the account has not been confirmed. Please try again or reset your password.';
  } else if (error === 'reset-not-found') {
    errorMessage = 'That password reset code is not currently valid.';
  } else {
    // No need to be overly specific, we already have
    // required attributes
    errorMessage = 'Please complete all fields.';
  }
  if (reset) {
    message = 'Your password was reset.';
  }
  const errorMarkup = error ? html`
    <section class="sa-error sa-login-error">
      ${errorMessage}
    </section>
  ` : '';
  const messageMarkup = message ? html`
    <section class="sa-message sa-login-message">
    ${message}
  </section>
  ` : '';
  return html`
    ${errorMarkup}
    ${messageMarkup}
    <form class="sa-login-form" method="POST" action="/login">
      ${field('email', 'Email Address', { required: true })}
      ${field('password', 'Password', { required: true, type: 'password' })}
      <button type="submit">
        Log In
      </button>
    </form>
    <a class="sa-login-reset-link" href="/reset">Reset your password</a>
    <a class="sa-login-signup-link" href="/signup">Sign up</a>
  `;
}
