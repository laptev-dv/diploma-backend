import Folder from '../models/Folder.js';
import Experiment from '../models/Experiment.js';

export const getAllFolders = async (req, res) => {
  try {
    const { search = '', sort = '-createdAt' } = req.query;
    
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const folders = await Folder.find(filter)
      .sort(sort)
      .populate('author', 'username')
      .lean();

    res.json(folders);
  } catch (error) {
    console.error('Error getting folders:', error);
    res.status(500).json({ 
      message: 'Ошибка при получении папок',
      error: error.message 
    });
  }
};

export const getFolderById = async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id)
      .populate('author', 'username')
      .populate('experiments', 'name mode createdAt');

    if (!folder) {
      return res.status(404).json({ message: 'Папка не найдена' });
    }

    res.json(folder);
  } catch (error) {
    console.error('Error getting folder:', error);
    res.status(500).json({ 
      message: 'Ошибка при получении папки',
      error: error.message 
    });
  }
};

export const createFolder = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    const newFolder = new Folder({
      name,
      description,
      author: req.userId,
      experiments: []
    });

    const savedFolder = await newFolder.save();
    res.status(201).json(savedFolder);
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({ 
      message: 'Ошибка при создании папки',
      error: error.message 
    });
  }
};

export const updateFolder = async (req, res) => {
  try {
    const { name, description } = req.body;
    const folder = await Folder.findById(req.params.id);

    if (!folder) {
      return res.status(404).json({ message: 'Папка не найдена' });
    }

    // Проверяем, что пользователь - автор папки
    if (folder.author.toString() !== req.userId) {
      return res.status(403).json({ message: 'Нет прав на редактирование' });
    }

    folder.name = name || folder.name;
    folder.description = description || folder.description;
    const updatedFolder = await folder.save();

    res.json(updatedFolder);
  } catch (error) {
    console.error('Error updating folder:', error);
    res.status(500).json({ 
      message: 'Ошибка при обновлении папки',
      error: error.message 
    });
  }
};

export const deleteFolder = async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id);

    if (!folder) {
      return res.status(404).json({ message: 'Папка не найдена' });
    }

    // Проверяем, что пользователь - автор папки
    if (folder.author.toString() !== req.userId) {
      return res.status(403).json({ message: 'Нет прав на удаление' });
    }

    await folder.deleteOne();
    res.json({ message: 'Папка успешно удалена' });
  } catch (error) {
    console.error('Error deleting folder:', error);
    res.status(500).json({ 
      message: 'Ошибка при удалении папки',
      error: error.message 
    });
  }
};

export const updateFolderExperiments = async (req, res) => {
  try {
    const { experimentIds } = req.body;
    const folder = await Folder.findById(req.params.id);

    if (!folder) {
      return res.status(404).json({ message: 'Папка не найдена' });
    }

    // Проверяем, что пользователь - автор папки
    if (folder.author.toString() !== req.userId) {
      return res.status(403).json({ message: 'Нет прав на редактирование' });
    }

    // Проверяем существование экспериментов
    const existingExperiments = await Experiment.find({ 
      _id: { $in: experimentIds } 
    }).select('_id');

    const validExperimentIds = existingExperiments.map(exp => exp._id);
    
    folder.experiments = validExperimentIds;
    const updatedFolder = await folder.save();

    res.json(updatedFolder);
  } catch (error) {
    console.error('Error updating folder experiments:', error);
    res.status(500).json({ 
      message: 'Ошибка при обновлении экспериментов в папке',
      error: error.message 
    });
  }
};