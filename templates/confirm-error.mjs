import { html } from '../helpers.mjs';

export default function template({}) {
  return html`
    <section class="sa-notice sa-confirm-error-notice">
      Unfortunately that confirmation code was not
      accepted. It may have expired or have already
      been used. Also take care when copying and pasting
      links. Feel free to sign up again.
    </section>
  `;
}
