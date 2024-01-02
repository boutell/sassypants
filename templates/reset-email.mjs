import { safeHtml } from 'common-tags';

export default function({ service, resetUrl }) {
  return safeHtml`
    <p>
      A request was made to reset your password
      on ${service}. If you made the request, you
      can reset your password by following the link below:
    </p>
    <p>
      <a href="${resetUrl}">${resetUrl}</a>
    </p>
    <p>
      If you did not request this, you may ignore this email.
      Someone may have entered your email address by accident. Sorry for the hassle.
    </p>
  `;
}
