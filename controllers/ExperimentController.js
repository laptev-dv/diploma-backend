import Experiment from '../models/Experiment.js';

export const createExperiment = async (req, res) => {
  try {
    const {
      name,
      mode,
      efficiencyMin,
      efficiencyMax,
      initialTaskNumber,
      seriesTime,
      presentationsPerTask,
      tasks
    } = req.body;

    // Получаем данные автора из токена
    const author = req.userId;
    const authorName = req.userName; // Предполагаем, что middleware добавило имя пользователя в req

    // Валидация режимов
    if (mode === 'strict') {
      if (efficiencyMin !== null || efficiencyMax !== null || 
          initialTaskNumber !== null || seriesTime !== null) {
        return res.status(400).json({ 
          message: 'Для strict режима efficiencyMin, efficiencyMax, initialTaskNumber и seriesTime должны быть null' 
        });
      }
    }

    // Валидация adaptive режима
    if (mode === 'adaptive') {
      if (efficiencyMin === null || efficiencyMax === null || 
          initialTaskNumber === null || seriesTime === null) {
        return res.status(400).json({ 
          message: 'Для adaptive режима все параметры должны быть указаны' 
        });
      }
      if (efficiencyMin > efficiencyMax) {
        return res.status(400).json({ 
          message: 'efficiencyMin не может быть больше efficiencyMax' 
        });
      }
    }

    // Создаем новый эксперимент
    const newExperiment = new Experiment({
      name,
      author,
      authorName,
      mode,
      efficiencyMin: mode === 'strict' ? null : efficiencyMin,
      efficiencyMax: mode === 'strict' ? null : efficiencyMax,
      initialTaskNumber: mode === 'strict' ? null : initialTaskNumber,
      seriesTime: mode === 'strict' ? null : seriesTime,
      presentationsPerTask,
      tasks,
      sessions: []
    });

    // Валидация задач
    for (const task of newExperiment.tasks) {
      if (task.rows < 1 || task.columns < 1 || 
          task.symbolHeight < 1 || task.symbolWidth < 1 ||
          task.verticalSpacing < 0 || task.horizontalSpacing < 0 ||
          task.stimulusTime < 1 || task.responseTime < 1 || task.pauseTime < 1) {
        return res.status(400).json({ 
          message: 'Все числовые параметры задач должны быть ≥ 1' 
        });
      }
    }

    const savedExperiment = await newExperiment.save();
    
    res.status(201).json(savedExperiment);
  } catch (error) {
    console.error('Error creating experiment:', error);
    res.status(500).json({ 
      message: 'Ошибка при создании эксперимента',
      error: error.message 
    });
  }
};

export const getAllExperiments = async (req, res) => {
  try {
    const { sort = '-createdAt', name } = req.query;
    const filter = {};
    
    if (name) {
      filter.name = { $regex: name, $options: 'i' };
    }

    const experiments = await Experiment.find(filter)
      .sort(sort)
      .select('-tasks -sessions')
      .lean()
      .exec();

    // Добавляем количество задач и сессий
    const result = experiments.map(exp => ({
      ...exp,
      tasksCount: exp.tasks ? exp.tasks.length : 0,
      sessionsCount: exp.sessions ? exp.sessions.length : 0
    }));

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка при получении экспериментов' });
  }
};

export const getExperimentById = async (req, res) => {
  try {
    const experiment = await Experiment.findById(req.params.id)
      .exec();

    if (!experiment) {
      return res.status(404).json({ message: 'Эксперимент не найден' });
    }

    res.json(experiment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка при получении эксперимента' });
  }
};

export const updateExperiment = async (req, res) => {
  try {
    const { name } = req.body;
    const experiment = await Experiment.findById(req.params.id);

    if (!experiment) {
      return res.status(404).json({ message: 'Эксперимент не найден' });
    }

    // Проверяем, что пользователь - автор эксперимента
    if (experiment.author.toString() !== req.userId) {
      return res.status(403).json({ message: 'Нет прав на редактирование' });
    }

    experiment.name = name || experiment.name;
    await experiment.save();

    res.json(experiment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка при обновлении эксперимента' });
  }
};

export const deleteExperiment = async (req, res) => {
  try {
    const experiment = await Experiment.findById(req.params.id);

    if (!experiment) {
      return res.status(404).json({ message: 'Эксперимент не найден' });
    }

    // Проверяем, что пользователь - автор эксперимента
    if (experiment.author.toString() !== req.userId) {
      return res.status(403).json({ message: 'Нет прав на удаление' });
    }

    // Используем deleteOne() вместо remove()
    await Experiment.deleteOne({ _id: req.params.id });
    
    res.json({ message: 'Эксперимент успешно удален' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      message: 'Ошибка при удалении эксперимента',
      error: error.message 
    });
  }
};