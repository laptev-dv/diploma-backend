import Task from '../models/Task.js';
import Experiment from '../models/Experiment.js';

export const createTask = async (req, res) => {
    try {
      const { experimentId } = req.params;
      const taskData = req.body;
  
      const experiment = await Experiment.findById(experimentId);
      if (!experiment) {
        return res.status(404).json({ message: 'Эксперимент не найден' });
      }
  
      if (experiment.author.toString() !== req.userId) {
        return res.status(403).json({ message: 'Нет прав на добавление задач' });
      }
  
      const task = new Task({
        ...taskData,
        experiment: experimentId
      });
  
      const savedTask = await task.save();
      experiment.tasks.push(savedTask._id);
      await experiment.save();
  
      res.status(201).json(savedTask);
    } catch (error) {
      console.error('Error creating task:', error);
      res.status(500).json({ message: 'Ошибка при создании задачи', error: error.message });
    }
  };
  
  export const getTasksByExperiment = async (req, res) => {
    try {
      const { experimentId } = req.params;
      
      const tasks = await Task.find({ experiment: experimentId })
        .select('-__v')
        .sort({ createdAt: 1 });
  
      res.json(tasks);
    } catch (error) {
      console.error('Error getting tasks:', error);
      res.status(500).json({ message: 'Ошибка при получении задач', error: error.message });
    }
  };