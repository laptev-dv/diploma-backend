import Experiment from '../models/Experiment.js';
import Task from '../models/Task.js';
import Session from '../models/Session.js';

export const createExperiment = async (req, res) => {
  try {
    const { name, mode, efficiencyMin, efficiencyMax, initialTaskNumber, seriesTime, presentationsPerTask, tasks } = req.body;
    const author = req.userId;

    // Валидация режима
    if (mode === 'adaptive' && (!efficiencyMin || !efficiencyMax || !initialTaskNumber || !seriesTime)) {
      return res.status(400).json({ message: 'Для adaptive режима все параметры обязательны' });
    }

    const experimentTasks = tasks.map((task) => new Task(task))
    experimentTasks.forEach(async (task) => {
      await task.save()
    });

    const newExperiment = new Experiment({
      name,
      author,
      mode,
      ...(mode === 'adaptive' && {
        efficiencyMin,
        efficiencyMax,
        initialTaskNumber,
        seriesTime
      }),
      presentationsPerTask,
      tasks: experimentTasks,
      sessions: []
    });

    const savedExperiment = await newExperiment.save();
    res.status(201).json(savedExperiment);
  } catch (error) {
    console.error('Error creating experiment:', error);
    res.status(500).json({ message: 'Ошибка при создании эксперимента', error: error.message });
  }
};

export const getAllExperiments = async (req, res) => {
  try {
    const { sort = '-createdAt', search } = req.query;
    const filter = { author: req.userId };
    
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }
    console.log(filter)
    const experiments = await Experiment.find(filter)
      .sort(sort)
      .populate('author')
      .lean();

    // Получаем количество задач и сессий для каждого эксперимента
    const experimentsWithCounts = await Promise.all(experiments.map(async exp => {
      const [tasksCount, sessionsCount] = await Promise.all([
        Task.countDocuments({ experiment: exp._id }),
        Session.countDocuments({ experiment: exp._id })
      ]);
      
      return {
        ...exp,
        tasksCount,
        sessionsCount,
      };
    }));

    res.json(experimentsWithCounts);
  } catch (error) {
    console.error('Error getting experiments:', error);
    res.status(500).json({ message: 'Ошибка при получении экспериментов', error: error.message });
  }
};

export const getExperimentById = async (req, res) => {
  try {
    const experiment = await Experiment.findById(req.params.id)
      .populate('tasks');

    if (!experiment) {
      return res.status(404).json({ message: 'Эксперимент не найден' });
    }

    const sessionsCount = await Session.countDocuments({ experiment: experiment._id });
    const experimentData = experiment.toObject();
    
    res.json({
      ...experimentData,
      sessionsCount,
      isMine: experiment.author._id.toString() === req.userId
    });
  } catch (error) {
    console.error('Error getting experiment:', error);
    res.status(500).json({ message: 'Ошибка при получении эксперимента', error: error.message });
  }
};

export const updateExperiment = async (req, res) => {
  try {
    const { name, mode, efficiencyMin, efficiencyMax, initialTaskNumber, seriesTime, presentationsPerTask } = req.body;
    
    const experiment = await Experiment.findById(req.params.id);
    if (!experiment) {
      return res.status(404).json({ message: 'Эксперимент не найден' });
    }

    // Проверка прав
    if (experiment.author.toString() !== req.userId) {
      return res.status(403).json({ message: 'Нет прав на редактирование' });
    }

    // Обновление полей
    experiment.name = name || experiment.name;
    experiment.mode = mode || experiment.mode;
    experiment.presentationsPerTask = presentationsPerTask || experiment.presentationsPerTask;

    if (mode === 'adaptive') {
      experiment.efficiencyMin = efficiencyMin;
      experiment.efficiencyMax = efficiencyMax;
      experiment.initialTaskNumber = initialTaskNumber;
      experiment.seriesTime = seriesTime;
    } else {
      experiment.efficiencyMin = null;
      experiment.efficiencyMax = null;
      experiment.initialTaskNumber = null;
      experiment.seriesTime = null;
    }

    await experiment.save();
    res.json(experiment);
  } catch (error) {
    console.error('Error updating experiment:', error);
    res.status(500).json({ message: 'Ошибка при обновлении эксперимента', error: error.message });
  }
};

export const deleteExperiment = async (req, res) => {
  try {
    const experiment = await Experiment.findById(req.params.id);
    if (!experiment) {
      return res.status(404).json({ message: 'Эксперимент не найден' });
    }

    if (experiment.author.toString() !== req.userId) {
      return res.status(403).json({ message: 'Нет прав на удаление' });
    }

    // Удаляем связанные задачи и сессии
    await Promise.all([
      Task.deleteMany({ experiment: experiment._id }),
      Session.deleteMany({ experiment: experiment._id }),
      Experiment.deleteOne({ _id: experiment._id })
    ]);

    res.json({ message: 'Эксперимент и все связанные данные удалены' });
  } catch (error) {
    console.error('Error deleting experiment:', error);
    res.status(500).json({ message: 'Ошибка при удалении эксперимента', error: error.message });
  }
};