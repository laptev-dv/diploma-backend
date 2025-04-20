import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { registerValidation } from './validations/registerValidation.js';
import checkAuth from './utils/checkAuth.js';
import * as ExperimentController from './controllers/ExperimentController.js';
import * as AuthController from './controllers/AuthController.js';
import * as SessionController from './controllers/SessionController.js';
import * as FolderController from './controllers/FolderController.js';
import * as UserController from './controllers/UserController.js';

const port = process.env.PORT;
const mongoUri = process.env.MONGO_URI;

mongoose
    .connect(mongoUri)
    .then(() => console.log('MongoDB connected'))
    .catch((error) => console.log('MongoDB error ', error));

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "http://192.168.1.245:3000",
  "http://192.168.1.245:*",
  "http://192.168.1.245",
  "http://151.0.48.140",
  "http://151.0.48.140:3000",
];

app.use(
  cors({
    origin: function (origin, callback) {
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json());

// Auth routes
app.post('/auth/login', AuthController.login);
app.post('/auth/register', registerValidation, AuthController.register);
app.post('/auth/logout', checkAuth, AuthController.logout);
app.post('/auth/request-password-reset', AuthController.requestPasswordReset);
app.post('/auth/reset-password', AuthController.resetPassword);

// Эксперименты
app.get('/experiments', checkAuth, ExperimentController.getAllExperiments);
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
app.get('/folders', checkAuth, FolderController.getAllFolders);
app.get('/folders/:id', FolderController.getFolderById);
app.post('/folders', checkAuth, FolderController.createFolder);
app.put('/folders/:id', checkAuth, FolderController.updateFolder);
app.delete('/folders/:id', checkAuth, FolderController.deleteFolder);
app.put('/folders/:id/experiments', checkAuth, FolderController.updateFolderExperiments);

// User routes
app.put('/user/change-password', checkAuth, UserController.changePassword);
app.delete('/user', checkAuth, UserController.deleteAccount);
app.get('/user/me', checkAuth, UserController.getMe);

app.listen(port, (error) => {
    if (error) {
        return console.log(error);
    }
    console.log(`Server started. Port ${port}`);
});