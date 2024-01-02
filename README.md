# sassypants

sassypants is a bare-bones SAAS (Software As
A Service) app framework for Node.js. The main
feature is account signup and login with secure
password hashing, so you can "just get on with it" and focus on your application. A number of other useful
utility features are also provided, but you don't have to use them.

sassypants is based on Express. Familiarity with Express helps a lot, especially concepts like `req.user` and `req.session`.

## Requirements

* Node.js 18 or better.
* A MongoDB database. MongoDB Atlas free tier is the easiest way to get started.

A minimal configuration looks like:

```javascript
// Path to the app itself
const root = fileURLToPath(new URL('.', import.meta.url));

import sassypants from 'sassypants';
import layoutTemplate from './templates/layout.mjs';

const {
  app,
  db,
  layout,
  page,
  get,
  post
} = await sassypants({
  baseUrl: 'http://localhost:3000',
  service: 'Cosmic Clipboard',
  shortName: 'cc',
  root,
  session: {
    secret: 'Z0sH6nU3vT1x.cLt'
  },
  email: {
    from: {
      name: 'Cosmic Clipboard',
      email: 'cc@boutell.dev'
    },
    transport: {
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
          user: 'something@ethereal.email',
          pass: 'somepassword'
      }
    }
  }
});
```

## Connnecting to the database

A MongoDB database is required. If not otherwise specified, sassypants looks for MongoDB running on your own computer, and uses `shortName` as the database name within that. To use MongoDB Atlas instead, set the `MONGODB_URI` environment variable to the URI provided by Atlas. Be sure to include the database name in the URI (`/my-db-name-here` at the end, but before any `?`).

## Overriding the layout

The first thing you'll want to customize is the default
page layout, which is very bare-bones. No doubt your app
has its own and you'll want pages rendered by sassypants
to use it too:

```javascript
// in app.js

import layout from './templates/layout.mjs';

await sassypants({
  templates: {
    layout
  },
  // etc.
});
```

```javascript
// templates/layout.mjs

// I suggest using common-tags for simple templating
import { html, safeHtml } from 'common-tags';

export default function layout({
  title,
  body,
  user,
  userNav
}) {
  return html`
<!DOCTYPE html>
<html>
  <head>
    <!-- Use safeHtml when the data is not trusted or escaped -->
    <title>${safeHtml`${title}`}</title>
  </head>
  <body>
    <header>
      <!-- Trusted markup from another template -->
      ${userNav({ user })}
    </header>
    <main>
      <!-- Trusted markup from another template -->
      ${body}
    </main>
  </body>
</html>
  `;
}
```

### Overriding the user navigation menu

The `userNav` template provides buttons to log in, log out, and sign up. You can provide your own like this:

```javascript
// in app.js

import userNav from './templates/user-nav.mjs';

await sassypants({
  templates: {
    userNav
  },
  // etc.
});
```

```javascript
// templates/user-nav.mjs
import { html, safeHtml } from 'common-tags';

export default function userNav({ user }) {
  return user ? safeHtml`
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
}
```

### Overriding other templates

Following the same pattern shown above, you can also override all of the other templates:

| Name  | Purpose |
| ------------- | ------------- |
| `templates.signup`  | Signup Form |
| `templates.signupSent` | Page shown after signup form |
| `templates.confirmEmail` | Confirmation Email (HTML email) |
| `templates.login` | Login Form |
| `templates.reset`  | Reset Password Request |
| `templates.resetSent`  | Page shown after reset request |
| `templates.resetForm`  | Reset Password Form |
| `templates.error`      | Displayed for errors |

As a starting point, see the source for each.

When overriding the error template, try to avoid operations that might themselves result in errors. If an error occurs in the error template a very generic fallback error message appears.

> **"What's the difference between `reset` and `reset-form`?"** The `reset` page just asks for the user's email address. An email is then sent with a confirmation link. Once the user clicks the link, `reset-form` is displayed to actually enter a new password.

All of these templates are automatically inserted
as the body within the layout template, except for
`confirmEmail` and `resetEmail` which are HTML
emails (very simple markup recommended).

## Custom pages and routes

You don't have to use them, but sassypants returns a few conveniences for writing safer code faster.

### `page`: simple page rendering

```javascript
page('/my-url', myTemplate, async req => {
  return {
    title: 'My Title',
    data: await getSomeData()
  };
});
```

When `/my-url` is accessed, `myTemplate` is
rendered and works just like any of the standard
templates. The function you provide is passed
the parameters you give to it, in addition to:

| Name  | Purpose |
| ------------- | ------------- |
| `query`  | req.query |
| `session` | req.session |
| `user` | req.user |
| `service` | options.service |

The result is output as the body within
the standard layout, or the custom layout you
have configured for the project.

> **Do not call req.send, req.redirect, etc.** in
your function. If this route doesn't just render a
page, see `get` and `post` below, or use the
Express `app` object returned by sassypants directly.

### `get`: safer `get` routes

```javascript
get('/my-url', async (req, res) => {
  const data = await getSomeData();
  if (data.shouldRedirect) {
    return res.redirect('/somewhere');
  } else {
    return res.send(data);
  }
});
```

There are two main advantages over using `app.get` directly:

1. Your function is awaited. If it throws an exception, the error template is automatically rendered, the error is logged on the server and the request is correctly ended.

2. If you forget to end the request with `res.send`, `res.end` or `res.redirect`, the request doesn't just hang forever. An error page is displayed and a message is logged on the server.

> For special cases like streaming from a pipe as the response, use `app.get` directly.

### `post`: safer `post` routes

```javascript
post('/my-url', async (req, res) => {
  const data = sanitizeSomeData(req.body);
  await saveSomeData(data);
  // If implementing an API
  return res.send({});
  // If implementing a traditional HTML form
  return res.redirect('/somewhere');
});
```

Just like `get`, this function handles errors automatically, and also the case where the developer forgets to end the request.

### Cleaning up after yourself: use `try/finally`

One note of warning about `page`, `get` and `post`: in most cases, the automatic error handling is great. However, if your code creates file streams or other resources that need to be cleaned up, that is your responsibility. `try/finally` is the easiest way to get this right. Use a `finally` block to close any resources you opened. You don't need a `catch` block, you can still use our built-in error handling.

## Email

For testing, use Ethereal Email, as shown in the
configuration example above. **If Ethereal Email works, then `sassypants` is not the reason your users are not
getting your emails.** My advice is to set `transport`
to a valid `nodemailer` configuration for postmark
or mailgun. Email from independent
senders is often not delivered these days, even if
you set up DMARC, SPF and all the rest of it. Yes,
that stinks.

### Customizing the signup confirmation email

Pass your own `templates.confirmEmail` option, like this:

```javascript
sassypants({
  templates: {
    confirmEmail({ service, confirmUrl } => {
      // Return your own markup here      
    })
  }
})
```

### Sending custom emails

In addition to the built-in emails for signup
confirmation and password reset, you can send emails
of your own:

```javascript
sendEmail(template, { name, email, subject, ...etc });
```

Your `template` function is invoked like any other
template shown above and receives an object with the
properties you pass in, in addition to `service`,
which is the user-friendly name of your application.
The properties `name`, `email` and `subject` are
required and function as the recipient's full name,
the recipient's email address and the subject line.

A plaintext version of your HTML is automatically
generated for simple devices and to please spam filters.

### A warning about email delivery

If you don't configure `email.transport`, the sendmail
transport is used, which probably won't work unless your
server is very well-configured with `postfix` and/or
`sendmail`, etc., including SPF and DMARC configuration.
Even then, email gets blocked a lot unless it is sent
by a well-known provider.

For testing, use Ethereal Email as shown above. If Ethereal Email works, then sassypants is not the problem.Be sure to read the instructions, Ethereal Email does not deliver to your real inbox. 

For production, set `transport` to a good nodemailer configuration leveraging a delivery service like postmark or mailgun. 

## Accessing the database

* The returned `db` object is a reference to the
MongoDB database.
* The returned `dbClient` object is a reference
to the MongoDB client connection, which can be used
to connect to other logical database names.
* The returned `accounts` object is a reference
to the MongoDB collection containing the accounts.

## Serving static files

The contents of the `/public` folder of your project are automatically served with the `express.static` middleware.

## Guide to all options

> Dotted option names like `session.secret` refer to the `secret` sub-property of the `session` property of the configuration object passed to sassypants.

### Required options

You must specify:

* `service` is the user-friendly name of your service, like `'Cosmic Clipboard'`.
* `shortName` is a short, unique, filename-friendly name suitable for databases, cookies, etc., like `'cc'`.
* `session.secret` must be a unique, random string not used in any other app, to keep your user sessions secure.
* `email.from.name` must be the full name **from which** emails like the account confirmation email will be sent.
* `email.from.email` must be the email address **from which** emails like the account confirmation email will be sent.

### Other options

* If set, `transport` must either (a) a nodemailer transport object, or (b) a simple object suitable to configure nodemailer's SMTP transport, as shown above. If not set, the `sendmailer` nodemailer transport is used, which probably won't work (see above).
* If set, `dbUri` hard-codes a MongoDB database URI. It is usually better to use the `MONGODB_URI` environment variable.
* If set, `dbClient` passes an existing MongoDB client object, and a new connection is not made.
* If set, `app` passes in an existing Express app object, and sassypants does not listen on a port by itself.
* If set, `login.after` specifies the URL to redirect a user to immediately after they log in. If not set this defaults to `/`.
* If set, `logout.after` specifies the URL to redirect a user to immediately after they log out. If not set this defaults to `/`.
* If set, `session` is merged with the object passed to the Express session middleware.
* If set, `bodyParser.urlencoded` overrides the default configuration of the body parser middleware, which includes `extended: true`. `extended: true` is not mandatory for the standard features of sassypants to function.

Also see "overriding other templates," above.

## Customing the port number

By default, `sassypants` listens on port 3000. You can
customize this to another port by setting the `PORT`
environment variable. If the `app` option is passed in
then you are responsible for listening for connections
yourself.
