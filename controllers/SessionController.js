import Session from '../models/Session.js';
import Experiment from '../models/Experiment.js';

export const createSession = async (req, res) => {
  try {
    const { experimentId, results } = req.body;
    const userId = req.userId;

    // Проверяем существование эксперимента
    const experiment = await Experiment.findById(experimentId);

    if (!experiment) {
      return res.status(404).json({ message: 'Эксперимент не найден' });
    }

    // Проверяем, что все задачи существуют
    const taskIds = experiment.tasks.map(task => task._id.toString());
    const invalidTasks = results.filter(r => !taskIds.includes(r.taskId.toString()));

    if (invalidTasks.length > 0) {
      return res.status(400).json({ message: 'Некоторые задачи не найдены в эксперименте' });
    }

    const newSession = new Session({
      experiment: experimentId,
      user: userId,
      results: results.map(result => ({
        task: result.taskId,
        presentations: result.presentations
      }))
    });

    const savedSession = await newSession.save();
    experiment.sessions.push(savedSession._id);
    await experiment.save();

    res.status(201).json(savedSession);
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ message: 'Ошибка при создании сессии', error: error.message });
  }
};

export const getSessionsByExperiment = async (req, res) => {
  try {
    const { experimentId } = req.params;

    const sessions = await Session.find({ experiment: experimentId })
      .populate('user', 'username')
      .populate('results.task')
      .populate('experiment')
      .sort({ createdAt: -1 });

    res.json(sessions.map(session => ({
      ...session.toObject(),
      isMine: session.user._id.toString() === req.userId
    })));
  } catch (error) {
    console.error('Error getting sessions:', error);
    res.status(500).json({ message: 'Ошибка при получении сессий', error: error.message });
  }
};

export const getSessionById = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
    .populate('experiment')
    .populate('results.task');

    if (!session) {
      return res.status(404).json({ message: 'Сессия не найдена' });
    }

    // Проверка прав доступа
    if (session.user._id.toString() !== req.userId && 
        session.experiment.author.toString() !== req.userId) {
      return res.status(403).json({ message: 'Нет прав на просмотр этой сессии' });
    }

    const sessionData = session.toObject();
    sessionData.results = calculateDetailedStats(session.results);
    sessionData.isMine = session.user._id.toString() === req.userId;

    res.json(sessionData);
  } catch (error) {
    console.error('Error getting session:', error);
    res.status(500).json({ message: 'Ошибка при получении сессии', error: error.message });
  }
};

export const deleteSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate('experiment', 'author');

    if (!session) {
      return res.status(404).json({ message: 'Сессия не найдена' });
    }

    // Проверка прав
    const isOwner = session.user.toString() === req.userId;
    const isExperimentAuthor = session.experiment.author.toString() === req.userId;
    
    if (!isOwner && !isExperimentAuthor) {
      return res.status(403).json({ message: 'Нет прав на удаление сессии' });
    }

    // Удаляем сессию и ссылку из эксперимента
    await Promise.all([
      Session.deleteOne({ _id: session._id }),
      Experiment.updateOne(
        { _id: session.experiment._id },
        { $pull: { sessions: session._id } }
      )
    ]);

    res.json({ message: 'Сессия успешно удалена' });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ message: 'Ошибка при удалении сессии', error: error.message });
  }
};

// Вспомогательная функция для расчета статистики
function calculateDetailedStats(results) {
  return results.map(taskResult => {
    const stats = {
      _id: taskResult._id,
      task: taskResult.task,
      presentations: taskResult.presentations,
      successCount: 0,
      errorCount: 0,
      missCount: 0,
      totalResponseTime: 0
    };

    taskResult.presentations.forEach(presentation => {
      if (presentation.userAnswer.row && presentation.userAnswer.column) {
        const isCorrect = 
          presentation.userAnswer.row === presentation.correctAnswer.row &&
          presentation.userAnswer.column === presentation.correctAnswer.column;
        
        if (isCorrect) {
          stats.successCount++;
        } else {
          stats.errorCount++;
        }

        if (presentation.responseTime) {
          stats.totalResponseTime += presentation.responseTime;
        }
      } else {
        stats.missCount++;
      }
    });

    const efficiency = stats.successCount / taskResult.presentations.length;
    const avgResponseTime = stats.totalResponseTime / taskResult.presentations.length;
    const finalScore = efficiency * (1 - avgResponseTime / (taskResult.task.stimulusTime + taskResult.task.responseTime));
    const workload = taskResult.task.rows * taskResult.task.columns / (taskResult.task.stimulusTime + taskResult.task.responseTime);
    const entropy = efficiency * Math.log2(efficiency) + (1 - efficiency) * Math.log2(1 - efficiency);
    const performance = 0;
    const totalDuration = 0;

    return {
      ...stats,
      finalScore: finalScore,
      entropy: entropy,
      performance: performance,
      workload: workload,
      avgResponseTime: avgResponseTime,
      efficiency: efficiency,
      totalDuration: totalDuration,
    };
  });
}