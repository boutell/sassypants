export default function template({ service, resetUrl }, { html }) {
  return html`
    <p>
      Someone tried to sign up for an account on ${service} with this email
      address, but an account already exists.
    </p>
    <p>
      If you did not sign up, you may ignore this email. Someone may have
      entered your email address by accident. Sorry for the hassle.
    </p>
    <p>
      If you have forgotten your password, you can
      <a href="${resetUrl}">request to reset your password</a>.
    </p>
  `;
}

