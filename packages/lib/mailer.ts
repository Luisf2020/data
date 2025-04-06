import nodemailer from 'nodemailer';

const mailer = nodemailer.createTransport({
  host: 'smtp.resend.com',
  port: 587,
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

export { nodemailer };

export default mailer;
