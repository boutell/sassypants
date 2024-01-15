export default function template({ error }, { html, input }) {
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
      ${input('email', 'Email Address', { required: true, type: 'email' })}
      ${input('name', 'Full Name', { required: true })}
      ${input('password', 'Password', { required: true, type: 'password' })}
      <button type="submit">
        Sign Up
      </button>
    </form>
  `;
}
