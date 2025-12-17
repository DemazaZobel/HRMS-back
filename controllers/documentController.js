import Document from '../models/Document.js';
import DocumentPermission from '../models/DocumentPermission.js';
import User from '../models/User.js';

// Sensitivity levels
const levels = { 'Public': 1, 'Internal': 2, 'Confidential': 3 };

// Get all documents accessible to user
export const getAllDocuments = async (req, res) => {
  try {
    const docs = await Document.findAll({
      include: [{ model: DocumentPermission, as: 'permissions', where: { user_id: req.user.id }, required: false }]
    });

    const accessible = docs.filter(doc => {
      const permission = doc.permissions[0];
      return permission?.can_view ?? false;
    });

    res.json(accessible);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get document by ID
export const getDocumentById = async (req, res) => {
  try {
    const doc = await Document.findByPk(req.params.id, {
      include: [{ model: DocumentPermission, as: 'permissions', where: { user_id: req.user.id }, required: false }]
    });

    if (!doc) return res.status(404).json({ message: 'Document not found' });

    const permission = doc.permissions[0];
    if (!(permission?.can_view ?? false)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create document (Admin only)
export const createDocument = async (req, res) => {
  if (!req.user.roles.includes('Admin')) {
    return res.status(403).json({ message: 'Only Admin can create documents' });
  }

  try {
    const { title, file_path } = req.body;
    const doc = await Document.create({ title, file_path });
    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update document (Admin only)
export const updateDocument = async (req, res) => {
  if (!req.user.roles.includes('Admin')) {
    return res.status(403).json({ message: 'Only Admin can update documents' });
  }

  try {
    const doc = await Document.findByPk(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    const { title, file_path } = req.body;
    if (title) doc.title = title;
    if (file_path) doc.file_path = file_path;

    await doc.save();
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete department (Admin only)
export const deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findByPk(req.params.id);
    if (!department) return res.status(404).json({ message: 'Department not found' });

    // Check if any employees are in this department
    const employees = await EmployeeProfile.findAll({ where: { department_id: department.id } });
    if (employees.length > 0) {
      return res.status(400).json({ message: 'Cannot delete department with employees assigned' });
    }

    await department.destroy();
    res.json({ message: 'Department deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

