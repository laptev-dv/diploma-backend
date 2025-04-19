import 'dotenv/config';
import { validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt'

import UserModel from '../models/User.js'


export const login = async (req, res) => {
    try {
        const user = await UserModel.findOne({ login: req.body.login });

        if (!user) {
            return res.status(401).json({
                message: 'Авторизация не удалась',
            })
        }

        const isValidPassword = await bcrypt.compare(req.body.password, user._doc.passwordHash);

        if (!isValidPassword) {
            return res.status(401).json({
                message: 'Авторизация не удалась',
            })
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
    
        const { passwordHash, ...userData } = user._doc

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
            return res.status(400).json(errors.array());
        }

        const password = req.body.password;
        const salt = await bcrypt.genSalt(10);
        const encryptedPassword = await bcrypt.hash(password, salt);

        const doc = new UserModel({
            login: req.body.login,
            passwordHash: encryptedPassword,
        })

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
    
        const { passwordHash, ...userData } = user._doc

        res.json({
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

export const getMe = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await UserModel.findById(userId)

        if (!user) {
            res.status(404).json({
                message: 'Не удалось получить данные пользователя',
            });    
        }

        const { passwordHash, ...userData } = user._doc

        res.json(userData);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: 'Не удалось получить данные пользователя',
        });
    }
};