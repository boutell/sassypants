import { safeHtml } from 'common-tags';

export default function({ service, confirmUrl }) {
  return safeHtml`
    <p>
      Please confirm your account on ${service}
      by following the link below:
    </p>
    <p>
      <a href="${confirmUrl}">${confirmUrl}</a>
    </p>
    <p>
      If you did not request this, you may ignore this email. Someone may have
      entered your email address by accident. Sorry for the hassle.
    </p>
  `;
}
