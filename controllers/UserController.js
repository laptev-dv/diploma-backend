import bcrypt from 'bcrypt';
import UserModel from '../models/User.js';

export const changePassword = async (req, res) => {
    try {
        const userId = req.userId;
        const { currentPassword, newPassword } = req.body;

        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        // Проверяем текущий пароль
        const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isValidPassword) {
            return res.status(400).json({ message: 'Неверный текущий пароль' });
        }

        // Хешируем новый пароль
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Обновляем пароль
        user.passwordHash = hashedPassword;
        await user.save();

        res.json({ message: 'Пароль успешно изменен' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка при изменении пароля' });
    }
};

export const deleteAccount = async (req, res) => {
    try {
        const userId = req.userId;
        
        // Удаляем пользователя
        const result = await UserModel.findByIdAndDelete(userId);
        
        if (!result) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        res.json({ message: 'Аккаунт успешно удален' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка при удалении аккаунта' });
    }
};

export const getMe = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await UserModel.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: 'Пользователь не найден',
            });    
        }

        const { passwordHash, ...userData } = user._doc;

        res.json(userData);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: 'Нет доступа',
        });
    }
};