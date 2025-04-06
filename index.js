import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { registerValidation } from './validations/registerValidation.js';
import checkAuth from './utils/checkAuth.js';
import * as ExperimentController from './controllers/ExperimentController.js';
import * as AuthController from './controllers/AuthController.js';
import * as SessionController from './controllers/SessionController.js';
import * as FolderController from './controllers/FolderController.js';

const port = 4334;

mongoose
    .connect('mongodb+srv://admin:admin@cluster0.2hgd2.mongodb.net/diploma?retryWrites=true&w=majority&appName=Cluster0')
    .then(() => console.log('MongoDB connected'))
    .catch((error) => console.log('MongoDB error ', error));

const app = express();

// Обновлённая конфигурация CORS
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Auth routes
app.post('/auth/login', AuthController.login);
app.post('/auth/register', registerValidation, AuthController.register);
app.get('/auth/me', checkAuth, AuthController.getMe);
app.post('/auth/logout', checkAuth, AuthController.logout);
app.post('/auth/request-password-reset', AuthController.requestPasswordReset);
app.post('/auth/reset-password', AuthController.resetPassword);

// Эксперименты
app.get('/experiments', ExperimentController.getAllExperiments);
app.get('/experiments/:id', ExperimentController.getExperimentById);
app.put('/experiments/:id', checkAuth, ExperimentController.updateExperiment);
app.delete('/experiments/:id', checkAuth, ExperimentController.deleteExperiment);
app.post('/experiments', checkAuth, ExperimentController.createExperiment);

// Сессии
app.post('/sessions', checkAuth, SessionController.createSession);
app.get('/experiments/:experimentId/sessions', checkAuth, SessionController.getSessionsByExperiment);
app.delete('/sessions/:id', checkAuth, SessionController.deleteSession);
app.get('/sessions/:id', checkAuth, SessionController.getSessionById);

// Папки
app.get('/folders', FolderController.getAllFolders);
app.get('/folders/:id', FolderController.getFolderById);
app.post('/folders', checkAuth, FolderController.createFolder);
app.put('/folders/:id', checkAuth, FolderController.updateFolder);
app.delete('/folders/:id', checkAuth, FolderController.deleteFolder);
app.put('/folders/:id/experiments', checkAuth, FolderController.updateFolderExperiments);

app.listen(port, (error) => {
    if (error) {
        return console.log(error);
    }
    console.log(`Server started. Port ${port}`);
});