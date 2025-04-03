import jwt from 'jsonwebtoken';
import UserModel from '../models/User.js';

export default async (req, res, next) => {
    const token = (req.headers.authorization || '').replace(/Bearer\s?/, '');

    if (!token) {
        return res.status(403).json({
            message: 'Нет доступа'
        });
    }

    try {
        const decodedToken = jwt.verify(token, 'secret');
        
        // Проверяем, не был ли токен инвалидирован
        const user = await UserModel.findById(decodedToken.userId);
        
        if (!user) {
            return res.status(403).json({
                message: 'Пользователь не найден'
            });
        }

        // Проверяем наличие и валидность invalidatedTokens
        const invalidatedTokens = user.invalidatedTokens || [];
        const tokenIssuedAt = new Date(decodedToken.iat * 1000);
        
        if (invalidatedTokens.some(invDate => {
            const invDateObj = new Date(invDate);
            return invDateObj > tokenIssuedAt;
        })) {
            return res.status(403).json({
                message: 'Токен больше не действителен'
            });
        }
        
        req.userId = decodedToken.userId;
        next();
    } catch (error) {
        console.error('Auth error:', error);
        
        let message = 'Нет доступа';
        if (error.name === 'TokenExpiredError') {
            message = 'Срок действия токена истек';
        } else if (error.name === 'JsonWebTokenError') {
            message = 'Неверный токен';
        }
        
        return res.status(403).json({
            message,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};