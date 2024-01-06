import { template, html, safe, input } from '../helpers.mjs';

export default template(({ error, reset }) => {
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
    ${safe(errorMarkup)}
    ${safe(messageMarkup)}
    <form class="sa-login-form" method="POST" action="/login">
      ${input('email', 'Email Address', { required: true })}
      ${input('password', 'Password', { required: true, type: 'password' })}
      <button type="submit">
        Log In
      </button>
    </form>
    <a class="sa-login-reset-link" href="/reset">Reset your password</a>
    <a class="sa-login-signup-link" href="/signup">Sign up</a>
  `;
});
