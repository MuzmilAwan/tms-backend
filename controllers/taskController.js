const Task = require('../models/Task');


function buildFilter(req) {
    const filter = { user: req.user._id };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;
    if (req.query.tags) filter.tags = { $in: req.query.tags.split(',').map(t => t.trim()) };
    if (req.query.search) {
        const s = req.query.search;
        filter.$or = [
            { title: { $regex: s, $options: 'i' } },
            { description: { $regex: s, $options: 'i' } }
        ];
    }
    return filter;
}


exports.createTask = async (req, res, next) => {
    try {
        const data = { ...req.body, user: req.user._id };
        const task = await Task.create(data);
        res.status(201).json({ task });
    } catch (err) { next(err); }
};


exports.getTasks = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page || 1));
        const limit = Math.min(100, parseInt(req.query.limit || 10));
        const sortBy = req.query.sortBy || '-createdAt';


        const filter = buildFilter(req);
        const total = await Task.countDocuments(filter);


        const tasks = await Task.find(filter)
            .sort(sortBy)
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();


        res.status(200).json({ page, limit, total, tasks });
    } catch (err) { next(err); }
};


exports.getTaskById = async (req, res, next) => {
    try {
        const task = await Task.findOne({ _id: req.params.id, user: req.user._id }).lean();
        if (!task) return res.status(404).json({ message: 'Task not found' });
        res.status(200).json({ task });
    } catch (err) { next(err); }
};


exports.updateTask = async (req, res, next) => {
    try {
        const updates = req.body;
        const task = await Task.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, updates, { new: true, runValidators: true });
        if (!task) return res.status(404).json({ message: 'Task not found' });
        res.status(200).json({ task });
    } catch (err) { next(err); }
};

exports.deleteTask = async (req, res, next) => {
    try {
        const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });
        if (!task) return res.status(404).json({ message: 'Task not found' });
        res.status(200).json({ message: 'Task deleted successfully' });
    } catch (err) {
        next(err);
    }
};
