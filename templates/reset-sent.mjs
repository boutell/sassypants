import { template, html } from '../helpers.mjs';

export default template(() => {
  return html`
    <section class="sa-notice sa-reset-email-notice">
      If an account exists with that email address,
      then an email message has been sent containing a link
      to reset your password. If you do not see it soon,
      be sure to check your spam folder.
    </section>
  `;
});
