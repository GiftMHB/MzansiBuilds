const projectModel = require('../models/project.model');

const createProject = async (req, res) => {
    try {
        const { title, description, stage, support_needed } = req.body;
        const userId = req.user.id; 
        
        if (!title || !description) {
            return res.status(400).json({ error: 'Title and description are required' });
        }
        
        const newProject = await projectModel.create(
            userId, title, description, stage || 'planning', support_needed || null
        );
        
        res.status(201).json({
            message: 'Project created successfully',
            project: newProject
        });
        
    } catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const getAllProjects = async (req, res) => {
    try {
        const projects = await projectModel.findAll();
        res.status(200).json({ projects });
    } catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const getProjectById = async (req, res) => {
    try {
        const { id } = req.params;
        const project = await projectModel.findById(id);
        
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        
        res.status(200).json({ project });
    } catch (error) {
        console.error('Get project error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const getMyProjects = async (req, res) => {
    try {
        const userId = req.user.id;
        const projects = await projectModel.findByUserId(userId);
        res.status(200).json({ projects });
    } catch (error) {
        console.error('Get my projects error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


const updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        const project = await projectModel.findById(id);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        if (project.user_id !== userId) {
            return res.status(403).json({ error: 'You can only update your own projects' });
        }
        
        const updatedProject = await projectModel.update(id, req.body);
        res.status(200).json({
            message: 'Project updated successfully',
            project: updatedProject
        });
        
    } catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const completeProject = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        const project = await projectModel.findById(id);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        if (project.user_id !== userId) {
            return res.status(403).json({ error: 'You can only complete your own projects' });
        }
        
        const completedProject = await projectModel.markComplete(id);
        res.status(200).json({
            message: 'Congratulations! Project marked as completed!',
            project: completedProject
        });
        
    } catch (error) {
        console.error('Complete project error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const deleteProject = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        const project = await projectModel.findById(id);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        if (project.user_id !== userId) {
            return res.status(403).json({ error: 'You can only delete your own projects' });
        }
        
        await projectModel.remove(id);
        res.status(200).json({ message: 'Project deleted successfully' });
        
    } catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    createProject,
    getAllProjects,
    getProjectById,
    getMyProjects,
    updateProject,
    completeProject,
    deleteProject
};