import { html } from '../helpers.mjs';

export default function template() {
  return html`
    <section class="sa-notice sa-signup-email-notice">
      If you don't have an account yet, then 
      a confirmation email has been sent to your
      email address. You will need to click the link
      in that email to confirm your account. If you
      do not see it soon, be sure to check your spam folder.
      If you already have an account and have forgotten your
      password, you can <a href="/reset">reset your password</a>.
    </section>
  `;
}
