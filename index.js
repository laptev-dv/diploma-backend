import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors'

import * as UserController from './controllers/UserController.js'
import { registerValidation } from './validations/auth.js'
import checkAuth from './utils/checkAuth.js';

mongoose
    .connect('mongodb+srv://admin:admin@cluster0.2hgd2.mongodb.net/diploma?retryWrites=true&w=majority&appName=Cluster0')
    .then(() => console.log('MongoDB connected'))
    .catch((error) => console.log('MongoDB error ', error))

const app = express();
app.use(cors());
app.use(express.json());


app.post('/auth/login', UserController.login);
app.post('/auth/register', registerValidation, UserController.register);
app.get('/auth/me', checkAuth, UserController.getMe);

app.listen(4334, (error) => {
    if (error) {
        return console.log(error);
    }

    console.log('Server started')
})