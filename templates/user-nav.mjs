import { template, html } from '../helpers.mjs';

export default template(({ user }) => {
  return user ? html`
    <nav class="sa-user-nav sa-logged-in">
      <span class="sa-user-name">Welcome, ${user.name}</span>
      <a class="sa-user-logout" href="/logout">Log Out</a>
    </nav>
  ` : html`
    <nav class="sa-user-nav sa-logged-out">
      <a class="sa-user-login" href="/login">Log In</a>
      <a class="sa-user-signup" href="/signup">Sign Up</a>
    </nav>
  `;
});
