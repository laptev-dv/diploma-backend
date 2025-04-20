import 'dotenv/config';
import { validationResult } from 'express-validator';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import ResetToken from '../models/ResetToken.js';
import UserModel from '../models/User.js';
import { sendResetEmail } from '../utils/mailer.js';

export const login = async (req, res) => {
    try {
        const user = await UserModel.findOne({ email: req.body.email });

        if (!user) {
            return res.status(401).json({
                message: 'Неверный email или пароль',
            });
        }

        const isValidPassword = await bcrypt.compare(req.body.password, user._doc.passwordHash);

        if (!isValidPassword) {
            return res.status(401).json({
                message: 'Неверный email или пароль',
            });
        }

        const token = jwt.sign(
            {
                userId: user._id,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '30d',
            }
        );
    
        const { passwordHash, ...userData } = user._doc;

        res.json({
            ...userData,
            token
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: 'Не удалось авторизоваться',
        });
    }
};

export const register = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array(),
                message: 'Некорректные данные при регистрации'
            });
        }

        const { email, password } = req.body;
        
        const candidate = await UserModel.findOne({ email });
        if (candidate) {
            return res.status(400).json({
                message: 'Пользователь с таким email уже существует'
            });
        }

        const salt = await bcrypt.genSalt(10);
        const encryptedPassword = await bcrypt.hash(password, salt);

        const doc = new UserModel({
            email,
            passwordHash: encryptedPassword,
        });

        const user = await doc.save();

        const token = jwt.sign(
            {
                userId: user._id,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '30d',
            }
        );
    
        const { passwordHash, ...userData } = user._doc;

        res.status(201).json({
            ...userData,
            token
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: 'Не удалось зарегистрироваться',
        });
    }
};

export const logout = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await UserModel.findByIdAndUpdate(
            userId,
            { $push: { invalidatedTokens: new Date() } },
            { new: true }
        );
        
        res.json({ success: true });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: 'Не удалось выйти из системы',
        });
    }
};

// Запрос на сброс пароля
export const requestPasswordReset = async (req, res) => {
    try {
      const { email } = req.body;
      const user = await UserModel.findOne({ email });
      
      if (!user) {
        return res.status(404).json({ message: 'Пользователь с таким email не найден' });
      }
  
      // Удаляем старые токены
      await ResetToken.deleteMany({ userId: user._id });
  
      // Создаем новый токен
      const resetToken = crypto.randomBytes(32).toString('hex');
      await new ResetToken({
        userId: user._id,
        token: resetToken,
      }).save();
  
      // Отправляем email
      await sendResetEmail(user.email, resetToken);
  
      res.json({ message: 'Ссылка для сброса пароля отправлена на email' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Ошибка при запросе сброса пароля' });
    }
  };
  
  // Сброс пароля
  export const resetPassword = async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      // Находим токен
      const resetToken = await ResetToken.findOne({ token });
      if (!resetToken) {
        return res.status(400).json({ message: 'Неверный или истекший токен' });
      }
  
      // Находим пользователя
      const user = await UserModel.findById(resetToken.userId);
      if (!user) {
        return res.status(404).json({ message: 'Пользователь не найден' });
      }
  
      // Хешируем новый пароль
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
  
      // Обновляем пароль
      user.passwordHash = hashedPassword;
      await user.save();
  
      // Удаляем использованный токен
      await ResetToken.deleteOne({ _id: resetToken._id });
  
      res.json({ message: 'Пароль успешно изменен' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Ошибка при сбросе пароля' });
    }
  };