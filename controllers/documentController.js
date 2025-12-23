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
      // Owners always see their own documents
      if (doc.owner_id === req.user.id) return true;

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

// Create document (Employees/Managers/Admins can upload)
export const createDocument = async (req, res) => {
  try {
    const file = req.file;
    const { title, shared_with } = req.body;

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Create document owned by current user
    const doc = await Document.create({
      title: title || file.originalname,
      file_path: file.path,
      owner_id: req.user.id
    });

    // Optional: initial sharing permissions (comma-separated user IDs)
    if (shared_with) {
      const ids = String(shared_with)
        .split(',')
        .map((id) => parseInt(id.trim(), 10))
        .filter((id) => !Number.isNaN(id));

      await Promise.all(
        ids.map((uid) =>
          DocumentPermission.create({
            resource_id: doc.id,
            user_id: uid,
            can_view: true,
            can_edit: false,
            granted_by: req.user.id
          })
        )
      );
    }

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

// Delete document (Admin or owner)
export const deleteDocument = async (req, res) => {
  try {
    const doc = await Document.findByPk(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    // Only admins or the owner can delete
    const isAdmin = req.user.roles.includes('Admin');
    const isOwner = doc.owner_id === req.user.id;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'Only the owner or an Admin can delete this document' });
    }

    // Clean up any permissions for this document
    await DocumentPermission.destroy({ where: { resource_id: doc.id } });

    await doc.destroy();
    res.json({ message: 'Document deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

