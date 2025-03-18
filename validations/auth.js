import { body } from 'express-validator'

export const registerValidation = [
    body('login').isLength({ min: 6 }),
    body('password').isLength({ min: 6 }),
];