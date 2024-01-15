export default function template({}, { html, input }) {
  return html`
    <form class="sa-reset-form" method="POST" action="/reset">
      ${input('email', 'Email Address', { required: true, type: 'email' })}
      <button type="submit">
        Reset Password
      </button>
    </form>
  `;
}
