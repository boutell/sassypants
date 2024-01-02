import { html } from 'common-tags';
import field from './field.mjs';

export default function login({ error }) {
  let errorMessage;
  if (error === 'unconfirmed') {
    errorMessage = 'That email address is already associated with an account that has not been confirmed. Please check your inbox as well as your spam folder.';
  } else {
    errorMessage = 'Please complete all required fields.';
  }
  const errorMarkup = error ? html`
    <section class="sa-error sa-login-error">
      ${errorMessage}
    </section>
  ` : '';
  return html`
    ${errorMarkup}
    <form method="POST" action="/signup">
      ${field('email', 'Email Address', { required: true, type: 'email' })}
      ${field('name', 'Full Name', { required: true })}
      ${field('password', 'Password', { required: true, type: 'password' })}
      <button type="submit">
        Sign Up
      </button>
    </form>
  `;
}
