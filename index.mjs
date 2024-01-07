import express from 'express';
import bodyParser from 'body-parser';
import validator from 'validator';
import { promisify } from 'util';
import { MongoClient } from 'mongodb';
import nodemailer from 'nodemailer';
import { randomBytes, randomUUID, scryptSync } from 'crypto';
import { convert } from 'html-to-text';
import passport from 'passport';
import session from 'express-session';
import MongoStore from 'connect-mongo';

import layoutTemplate from './templates/layout.mjs';
import signupTemplate from './templates/signup.mjs';
import signupSentTemplate from './templates/signup-sent.mjs';
import confirmErrorTemplate from './templates/confirm-error.mjs';
import loginTemplate from './templates/login.mjs';
import resetTemplate from './templates/reset.mjs';
import resetSentTemplate from './templates/reset-sent.mjs';
import resetFormTemplate from './templates/reset-form.mjs';
import confirmEmailTemplate from './templates/confirm-email.mjs';
import existingEmailTemplate from './templates/existing-email.mjs';
import resetEmailTemplate from './templates/reset-email.mjs';
import userNavTemplate from './templates/user-nav.mjs';
import errorTemplate from './templates/error.mjs';

const { isEmail, normalizeEmail: strictlyNormalizeEmail } = validator;

// Required options: root (path to root folder of application)

export default async function sassypants(options = {}) {
  if (!options.service) {
    throw new Error('service option is required');
  }
  if (!options.shortName) {
    throw new Error('shortName option is required');
  }
  if (!options.shortName.match(/^[a-z][a-z\-0-9]+$/)) {
    throw new Error('shortName must consist of lowercase letters, digits, and hyphens with a leading letter')
  }
  if (!options.root) {
    throw new Error('root option is required (path to root folder of application)');
  }
  if (!options.baseUrl) {
    throw new Error('baseUrl option is required');
  }
  const signup = options.templates?.signup || signupTemplate;
  const signupSent = options.templates?.signupSent || signupSentTemplate;
  const confirmError = options.templates?.confirmError || confirmErrorTemplate;
  const login = options.templates?.login || loginTemplate;
  const confirmEmail = options.templates?.confirmEmail || confirmEmailTemplate;
  const existingEmail = options.templates?.existingEmail || existingEmailTemplate;
  const resetEmail = options.templates?.resetEmail || resetEmailTemplate;
  const reset = options.templates?.reset || resetTemplate;
  const resetSent = options.templates?.resetSent || resetSentTemplate;
  const resetForm = options.templates?.resetForm || resetFormTemplate;
  const error = options.templates?.error || errorTemplate;
  const userNav = options.templates?.userNav || userNavTemplate;

  const layoutFn = options.templates?.layout || layoutTemplate;
  const layout = options => {
    return layoutFn({
      userNav,
      ...options
    });
  };

  // transport option can be a simple object with
  // SMTP parameters, or an existing transport object.
  // Fallback is sendmail transport
  const transport = options.email?.transport?.host ? nodemailer.createTransport(options.email.transport) : (options.email?.transport || nodemailer.createTransport({
    sendmail: true
  }));

  const dbClient = options.dbClient || new MongoClient(options.dbUri || process.env.MONGODB_URI || `mongodb://localhost:27017/${options.shortName}`);
  await dbClient.connect();
  const db = options.db || dbClient.db();
  const accounts = db.collection('accounts');
  await accounts.createIndex({
    email: 1
  }, {
    unique: 1
  });
  await accounts.createIndex({
    confirmationCode: 1
  });

  const app = options.app || express();
  app.use(express.static(`${options.root}/public`));
  app.use(bodyParser.urlencoded(
    options.bodyParser?.urlencoded || {
    extended: true
  }));
  app.use(session({
    store: MongoStore.create({ client: dbClient }),
    resave: false,
    saveUninitialized: false,
    ...options.session
  }));

  app.use((req, res, next) => {
    return next();
  });

  passport.serializeUser((user, callback) => {
    return callback(null, user._id);
  });

  passport.deserializeUser(async (_id, callback) => {
    try {
      const user = await accounts.findOne({ _id });
      return callback(null, user);
    } catch (e) {
      return callback(e);
    }
  });

  app.use(passport.initialize());
  app.use(passport.session());

  page('/login', login, req => ({
    title: 'Log In',
    error: req.query.error,
    reset: !!req.query.reset,
    confirmed: !!req.query.confirmed
  }));

  get('/logout', async (req, res) => {
    await new Promise((resolve, reject) => {
      req.logout(err => {
        if (err) {
          return reject(err);
        } else {
          return resolve();
        }
      });
    });
    return res.redirect(options.logout?.after || '/');
  });

  page('/signup', signup, req => ({
    title: 'Sign Up',
    error: req.query.error
  }));

  page('/signup-sent', signupSent, req => ({
    title: 'Please check your email'
  }));

  page('/confirm-error', confirmError, req => ({
    title: 'Confirmation code not accepted'
  }));

  page('/reset', reset, req => ({
    title: 'Reset Password'
  }));

  page('/reset-sent', resetSent, req => ({
    title: 'Please Check Your Inbox'
  }));

  get('/reset/:code', async (req, res) => {
    req.session.resetPasswordCode = req.params.code;
    const account = await validateResetPassword(req);
    if (!account) {
      return res.redirect('/login?error=reset-not-found');
    }
    return res.redirect('/reset-form');
  });

  page('/reset-form', resetForm, async req => {
    if (!await validateResetPassword(req)) {
      res.redirect('/login?error=reset-not-found');
    }
    return {
      title: 'Reset Password'
    };
  });

  post('/signup', async (req, res) => {
    let email = isEmail(req.body.email) && normalizeEmail(req.body.email);
    const name = ((((typeof req.body.name) === 'string') && req.body.name) || '').replace(/"/g, '').replace(/,/g, '').substring(0, 100);
    const password = (typeof req.body.password === 'string') && (req.body.password.length > 0) && req.body.password;
    if (!(email && name && password)) {
      // Front end already has the polite hints,
      // so it shouldn't happen
      return res.redirect('/signup?error=invalid');
    }
    const confirmationCode = randomUUID();
    try {
      // Don't be difficult. People lose their
      // confirmation emails constantly and
      // spamming this form isn't going to
      // get you a guessable confirmation code, ever
      await accounts.deleteOne({
        email,
        confirmed: false
      });
      await accounts.insertOne({
        _id: randomUUID(),
        email,
        name,
        confirmationCode,
        confirmationRequestedAt: Date.now(),
        createdAt: new Date(),
        confirmed: false,
        passwordHash: passwordHash(password)
      });
    } catch (e) {
      console.error(e);
      if (e.toString().match(/duplicate/i)) {
        await sendEmail(existingEmail, {
          name,
          email,
          resetUrl: `${options.baseUrl}/reset`,
          subject: options.email?.existing?.subject || `You already have an account on ${options.service}`,
        });
        return res.redirect('/signup-sent');
      }
      throw e;
    }
      
    const confirmUrl = `${options.baseUrl}/confirm/${confirmationCode}`;
    await sendEmail(confirmEmail, {
      name,
      email,
      subject: options.email?.confirm?.subject || `Confirm your account on ${options.service}`,
      confirmUrl
    });
    return res.redirect('/signup-sent');
  });

  get('/confirm/:confirmationCode', async (req, res) => {
    const found = await accounts.findOne({
      confirmationCode: req.params.confirmationCode
    });
    if (!found) {
      return res.redirect('/confirm-error');
    }
    const validAt = Date.now() - 60 * 1000 * (options?.confirm?.minutes || 60 * 24);
    if (found.confirmationRequestedAt < validAt) {
      return res.redirect('/confirm-error');
    }

    const result = await accounts.updateOne({
      _id: found._id,
      // Race condition guard
      confirmationCode: req.params.confirmationCode
    }, {
      $unset: {
        confirmationCode: 1
      },
      $set: {
        confirmedAt: new Date(),
        confirmed: true
      }
    });
    if (result.modifiedCount === 1) {
      return res.redirect('/login?confirmed=1');
    } else {
      return res.redirect('/confirm-error');
    }
  });

  post('/reset', async (req, res) => {
    const email = isEmail(req.body.email) && normalizeEmail(req.body.email);
    if (!email) {
      // required attribute was bypassed, we don't
      // have to be polite about this
      return res.redirect('/reset');
    }
    const resetPasswordCode = randomUUID();
    const result = await accounts.updateOne({
      email
    }, {
      $set: {
        resetRequestedAt: Date.now(),
        resetPasswordCode
      }
    });
    if (result.modifiedCount === 1) {
      const account = await accounts.findOne({
        email
      });
      const resetUrl = `${options.baseUrl}/reset/${resetPasswordCode}`;
      await sendEmail(resetEmail, {
        name: account.name,
        email: account.email,
        subject: options.email?.reset?.subject || `Resetting your password on ${options.service}`,
        resetUrl
      });
    }
    // We don't want to disclose whether there was really
    // a matching account or not
    return res.redirect('/reset-sent');
  });

  post('/reset-form', async (req, res) => {
    const account = await validateResetPassword(req);
    if (!account) {
      return res.redirect('/login?error=reset-not-found');
    }
    const password = (typeof req.body['new-password'] === 'string') && (req.body['new-password'].length > 0) && req.body['new-password'];
    if (!password) {
      // No ceremony required since they bypassed the required attribute
      return res.redirect('/login');
    }
    await accounts.updateOne({
      resetPasswordCode: req.session.resetPasswordCode
    }, {
      $set: {
        passwordHash: passwordHash(password)
      },
      $unset: {
        code: 1
      }
    });
    return res.redirect('/login?reset=1');
  });

  post('/login', async (req, res) => {
    const email = isEmail(req.body.email) && normalizeEmail(req.body.email);
    const password = (typeof req.body.password === 'string') && (req.body.password.length > 0) && req.body.password;
    if (!(email && password)) {
      // Front end already has the polite hints,
      // so it shouldn't happen
      return res.redirect('/login?error=invalid');
    }
    const account = await accounts.findOne({
      email,
      confirmed: true
    });
    if (!account) {
      return res.redirect('/login?error=invalid');
    }
    if (!verifyPasswordHash(account, password)) {
      return res.redirect('/login?error=invalid');
    }
    await new Promise((resolve, reject) => {
      return req.login(account, function(err) {
        if (err) {
          return reject(err);
        } else {
          return resolve(undefined);
        }
      });
    });
    res.redirect(options.login?.after || '/');
  });

  if (!options.app) {
    await listen();
  }

  return {
    app,
    dbClient,
    db,
    accounts,
    passport,
    layout,
    userNav,
    get,
    post,
    page,
    renderFragment,
    renderPage,
    sendPage,
    sendEmail
  };

  async function sendEmail(template, {
    name,
    email,
    subject,
    ...data
  } = {}) {
    const html = template({
      name,
      email,
      subject,
      service: options.service,
      ...data
    }).toString();
    return transport.sendMail({
      from: `"${options.email.from.name}" <${options.email.from.email}>`, // sender address
      to: `"${name}" <${email}>`,
      subject,
      text: convert(html, {
        wordwrap: 80
      }),
      html
    });
  }

  async function listen() {
    const port = process.env.PORT || 3000;
    const listen = promisify((callback) => {
      return app.listen(port, callback);
    });
    await listen();
    console.log(`Listening on port ${port}`);
  }

  function passwordHash(password) {
    const salt = randomBytes(64);
    const cost = 16384;
    const hash = scryptSync(password, salt, 64, { cost });
    return `scrypt:${cost}:${salt.toString('base64')}:${hash.toString('base64')}`;
  }

  function verifyPasswordHash(account, password) {
    let [ algorithm, cost, salt, hash] = account.passwordHash.split(':');
    if (!(algorithm && cost && salt && hash)) {
      return false;
    }
    cost = +cost;
    if (algorithm !== 'scrypt') {
      throw new Error('Unsupported hash algorithm');
    }
    hash = Buffer.from(hash, 'base64');
    return Buffer.from(hash).equals(scryptSync(password, Buffer.from(salt, 'base64'), hash.length, { cost }));
  }

  // make app.get and app.post safer by confirming that
  // a response or redirect was sent. These aren't suitable
  // for rare cases like streaming output, in which case
  // you should just use app.get or app.post directly

  function get(url, fn) {
    return wrapMethod('get', url, fn);
  }

  function post(url, fn) {
    return wrapMethod('post', url, fn);
  }

  function page(url, template, fn) {
    return app.get(url, async req => {
      return sendPage(req, template, await fn(req));
    });
  }

  function wrapMethod(method, url, fn) {
    return app[method](url, async (req, res) => {
      try {
        let finished = false;
        const superEnd = res.end;
        res.end = (...args) => {
          finished = true;
          return superEnd(...args);
        };
        await fn(req, res);
        if (!finished) {
          throw new Error('The function passed to get() must eventually end the request by sending data or redirecting');
        }
      } catch (e) {
        return fail(req, e);
      }
    });
  }
  
  function renderTemplate(req, template, data = {}) {
    const data2 = {
      query: req.query,
      user: req.user,
      session: req.session,
      service: options.service,
      ...data
    };
    return template(data2);
  }

  function renderFragment(req, template, data = {}) {
    return renderTemplate(req, template, data).toString();
  }

  function renderPage(req, template, data = {}) {
    return renderTemplate(req, layout, {
      userNav,
      ...data,
      body: renderTemplate(req, template, data)
    }).toString();
  }

  function sendPage(req, template, data = {}) {
    try {
      return req.res.send(renderPage(req, template, data));
    } catch (e) {
      console.error(e);
      try {
        return req.res.status(500).send(renderPage(req, error, {
          title: 'An error occurred'
        }));
      } catch (e) {
        // Error template also failed
        console.error('Error in error template:', e);
        return req.res.status(500).send('An error occurred.');
      }
    }
  }

  async function validateResetPassword(req) {
    if (!req.session.resetPasswordCode) {
      return false;
    }
    const account = await accounts.findOne({
      resetPasswordCode: req.session.resetPasswordCode
    });
    if (!account) {
      return false;
    }
    const validAt = Date.now() - 60 * 1000 * (options?.reset?.minutes || 60);
    if (account.resetRequestedAt < validAt) {
      return false;
    }
    return account;
  }

  function fail(req, e) {
    console.error(e);
    return sendPage(req, error, {
      title: 'Error'
    });
  }

  function normalizeEmail(email) {
    if (options.normalizeEmail) {
      email = strictlyNormalizeEmail(email);
    }
    email = email.toLowerCase();
    return email;
  };

}
