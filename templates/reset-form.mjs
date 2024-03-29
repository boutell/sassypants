export default function template({ code }, { html, input }) {
  return html`
    <form class="sa-login-form" method="POST" action="/reset-form">
      ${input('new-password', 'New Password', { required: true, type: 'password' })}
      <input type="hidden" name="code" value="${code}" />
      <button type="submit">
        Reset Password
      </button>
    </form>
  `;
}
