import Session from '../models/Session.js';
import Experiment from '../models/Experiment.js';
import checkAuth from '../utils/checkAuth.js';

export const createSession = async (req, res) => {
  try {
    const { experimentId, results } = req.body;
    const userId = req.userId;

    // Проверяем существование эксперимента
    const experiment = await Experiment.findById(experimentId);
    if (!experiment) {
      return res.status(404).json({ message: 'Эксперимент не найден' });
    }

    // Создаем новую сессию
    const newSession = new Session({
      experimentId,
      userId,
      userName: req.userName, // Предполагаем, что middleware добавило имя пользователя
      results,
      duration: calculateDuration(results)
    });

    const savedSession = await newSession.save();

    // Добавляем сессию в эксперимент
    experiment.sessions.push(savedSession._id);
    await experiment.save();

    res.status(201).json(savedSession);
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ 
      message: 'Ошибка при создании сессии',
      error: error.message 
    });
  }
};

export const getSessionsByExperiment = async (req, res) => {
  try {
    const { experimentId } = req.params;

    const sessions = await Session.find({ experimentId })
      .populate('userId', 'username')
      .sort({ date: -1 });

    res.json(sessions.map(session => ({
      ...session.toObject(),
      isMine: session.userId._id.toString() === req.userId
    })));
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ 
      message: 'Ошибка при получении сессий',
      error: error.message 
    });
  }
};

export const deleteSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate('experimentId', 'author');

    if (!session) {
      return res.status(404).json({ message: 'Сессия не найдена' });
    }

    // Проверяем права: автор эксперимента или создатель сессии
    const isExperimentAuthor = session.experimentId.author.toString() === req.userId;
    const isSessionOwner = session.userId.toString() === req.userId;

    if (!isExperimentAuthor && !isSessionOwner) {
      return res.status(403).json({ message: 'Нет прав на удаление сессии' });
    }

    // Удаляем сессию
    await Session.deleteOne({ _id: req.params.id });

    // Удаляем ссылку на сессию из эксперимента
    await Experiment.updateOne(
      { _id: session.experimentId._id },
      { $pull: { sessions: req.params.id } }
    );

    res.json({ message: 'Сессия успешно удалена' });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ 
      message: 'Ошибка при удалении сессии',
      error: error.message 
    });
  }
};

// Вспомогательная функция для расчета длительности
function calculateDuration(results) {
  if (!results || !results.length) return 0;
  
  let totalDuration = 0;
  results.forEach(task => {
    task.presentations.forEach(presentation => {
      totalDuration += (presentation.responseTime || 0) + (presentation.pauseTime || 0);
    });
  });
  
  return totalDuration;
}