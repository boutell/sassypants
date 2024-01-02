import { html } from 'common-tags';

export default function reset() {
  return html`
    <section class="sa-notice sa-signup-email-notice">
      A confirmation email has been sent to your
      email address. You will need to click the link
      in that email to confirm your account. If you
      do not see it soon, be sure to check your spam folder.
    </section>
  `;
}
