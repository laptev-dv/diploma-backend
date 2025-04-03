export const getAllExperiments = async (req, res) => {
  try {
    // Фильтрация по автору, если указан query-параметр
    const authorFilter = req.query.author;
    const filteredExperiments = authorFilter
      ? mockExperiments.filter(exp => exp.author === authorFilter)
      : mockExperiments;

    res.json(filteredExperiments);
  } catch (error) {
    console.error('Error getting experiments:', error);
    res.status(500).json({ message: 'Ошибка при получении списка экспериментов' });
  }
};

export const getExperimentById = async (req, res) => {
  try {
    const experiment = mockExperiments.find(exp => exp.id === parseInt(req.params.id));
    
    if (!experiment) {
      return res.status(404).json({ message: 'Эксперимент не найден' });
    }

    res.json(experiment);
  } catch (error) {
    console.error('Error getting experiment:', error);
    res.status(500).json({ message: 'Ошибка при получении эксперимента' });
  }
};

export const createExperiment = async (req, res) => {
  try {
    const newExperiment = {
      id: mockExperiments.length + 1,
      ...req.body,
      createdAt: new Date().toISOString(),
      sessions: []
    };

    mockExperiments.push(newExperiment);
    res.status(201).json(newExperiment);
  } catch (error) {
    console.error('Error creating experiment:', error);
    res.status(500).json({ message: 'Ошибка при создании эксперимента' });
  }
};

export const updateExperiment = async (req, res) => {
  try {
    const experimentIndex = mockExperiments.findIndex(exp => exp.id === parseInt(req.params.id));
    
    if (experimentIndex === -1) {
      return res.status(404).json({ message: 'Эксперимент не найден' });
    }

    const updatedExperiment = {
      ...mockExperiments[experimentIndex],
      ...req.body,
      id: parseInt(req.params.id) // Защищаем ID от изменения
    };

    mockExperiments[experimentIndex] = updatedExperiment;
    res.json(updatedExperiment);
  } catch (error) {
    console.error('Error updating experiment:', error);
    res.status(500).json({ message: 'Ошибка при обновлении эксперимента' });
  }
};

export const deleteExperiment = async (req, res) => {
  try {
    const experimentIndex = mockExperiments.findIndex(exp => exp.id === parseInt(req.params.id));
    
    if (experimentIndex === -1) {
      return res.status(404).json({ message: 'Эксперимент не найден' });
    }

    mockExperiments.splice(experimentIndex, 1);
    res.json({ message: 'Эксперимент успешно удален' });
  } catch (error) {
    console.error('Error deleting experiment:', error);
    res.status(500).json({ message: 'Ошибка при удалении эксперимента' });
  }
};

export const getExperimentSessions = async (req, res) => {
  try {
    const experiment = mockExperiments.find(exp => exp.id === parseInt(req.params.id));
    
    if (!experiment) {
      return res.status(404).json({ message: 'Эксперимент не найден' });
    }

    res.json(experiment.sessions);
  } catch (error) {
    console.error('Error getting sessions:', error);
    res.status(500).json({ message: 'Ошибка при получении сессий эксперимента' });
  }
};

export const createExperimentSession = async (req, res) => {
  try {
    const experiment = mockExperiments.find(exp => exp.id === parseInt(req.params.id));
    
    if (!experiment) {
      return res.status(404).json({ message: 'Эксперимент не найден' });
    }

    const newSession = {
      id: `session${experiment.sessions.length + 1}`,
      ...req.body,
      date: new Date().toISOString()
    };

    experiment.sessions.push(newSession);
    res.status(201).json(newSession);
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ message: 'Ошибка при создании сессии' });
  }
};