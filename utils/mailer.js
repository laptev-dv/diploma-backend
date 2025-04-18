import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'Gmail', // или другой сервис
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendResetEmail = async (email, token) => {
  const resetLink = `http://your-frontend-url/reset-password?token=${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Сброс пароля',
    html: `
      <p>Вы запросили сброс пароля. Нажмите на ссылку ниже, чтобы установить новый пароль:</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>Ссылка действительна в течение 1 часа.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};