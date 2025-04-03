import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'Gmail', // Или другой SMTP-сервис
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendResetEmail = async (email, token) => {
  const resetUrl = `http://yourfrontend.com/reset-password?token=${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Сброс пароля',
    html: `
      <p>Вы запросили сброс пароля. Нажмите на ссылку ниже, чтобы установить новый пароль:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>Ссылка действительна в течение 1 часа.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};