import 'dotenv/config';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: true, // true для порта 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false // Только для тестов!
  }
});

export const sendResetEmail = async (email, token) => {
  const resetLink = `${process.env.FRONTEND_URL}/auth/reset-password/?token=${token}`;
  
  const mailOptions = {
    from: `"Activity Simulator" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'Сброс пароля',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Сброс пароля</h2>
        <p>Для завершения сброса пароля нажмите кнопку:</p>
        <a href="${resetLink}" 
           style="display: inline-block; 
                  padding: 12px 24px; 
                  background-color: #FFDB4D; 
                  color: #000; 
                  text-decoration: none; 
                  border-radius: 4px;
                  font-weight: bold;">
          Сбросить пароль
        </a>
        <p style="margin-top: 20px; color: #666;">
          Ссылка действительна 1 час.<br>
          Если вы не запрашивали сброс, проигнорируйте это письмо.
        </p>
      </div>
    `,
    text: `Для сброса пароля перейдите по ссылке: ${resetLink}`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Письмо отправлено на ${email}`);
  } catch (error) {
    console.error('Ошибка отправки:', error);
    throw new Error('Не удалось отправить письмо');
  }
};