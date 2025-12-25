import Document from '../models/Document.js';
import DocumentPermission from '../models/DocumentPermission.js';
import User from '../models/User.js';
import EmployeeProfile from '../models/EmployeeProfile.js';
import Department from '../models/Department.js';

// Get public documents (for unauthenticated users)
export const getPublicDocuments = async (req, res) => {
  try {
    const publicDocs = await Document.findAll({
      where: { visibility: 'PUBLIC' },
      include: [
        { model: User, as: 'documentOwner', attributes: ['id', 'username', 'email'] }
      ]
    });

    // Get owner profiles for department info
    const docsWithProfiles = await Promise.all(publicDocs.map(async (doc) => {
      const profile = await EmployeeProfile.findOne({ 
        where: { user_id: doc.owner_id },
        include: [{ model: Department, as: 'profileDepartment', attributes: ['id', 'name'] }]
      });
      return {
        ...doc.toJSON(),
        ownerProfile: profile
      };
    }));

    res.json(docsWithProfiles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all documents accessible to user (with MAC + DAC enforcement)
export const getAllDocuments = async (req, res) => {
  try {
    const user = req.user;
    const userRoles = user.roles || [];
    const isAdmin = userRoles.includes('Admin');
    const isHR = userRoles.includes('HR') || isAdmin; // Admin acts as HR
    const isManager = userRoles.includes('Manager');

    // Get user's employee profile to find manager
    const userProfile = await EmployeeProfile.findOne({ where: { user_id: user.id } });
    const managerId = userProfile?.manager_id;

    // Get all documents
    const allDocs = await Document.findAll({
      include: [
        { model: User, as: 'documentOwner', attributes: ['id', 'username', 'email'] }
      ]
    });

    // Get owner profiles for all documents
    const docsWithProfiles = await Promise.all(allDocs.map(async (doc) => {
      const profile = await EmployeeProfile.findOne({ 
        where: { user_id: doc.owner_id },
        include: [{ model: Department, as: 'profileDepartment', attributes: ['id', 'name'] }]
      });
      return {
        ...doc.toJSON(),
        ownerProfile: profile
      };
    }));

    // Filter based on MAC + DAC rules
    const accessible = docsWithProfiles.filter(doc => {
      // DAC: Owner always has access
      if (doc.owner_id === user.id) return true;

      // MAC + DAC: Visibility-based access
      if (doc.visibility === 'PUBLIC') {
        return true; // Everyone can see PUBLIC
      }

      if (doc.visibility === 'INTERNAL') {
        // INTERNAL: Only owner's manager can see
        if (isAdmin || isHR) return true; // HR/Admin can see all
        if (isManager && doc.ownerProfile?.manager_id === user.id) return true;
        return false;
      }

      if (doc.visibility === 'PRIVATE') {
        // PRIVATE: Only HR/Admin can see
        return isAdmin || isHR;
      }

      return false;
    });

    res.json(accessible);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get document by ID (with MAC + DAC enforcement)
export const getDocumentById = async (req, res) => {
  try {
    const user = req.user;
    const userRoles = user.roles || [];
    const isAdmin = userRoles.includes('Admin');
    const isHR = userRoles.includes('HR') || isAdmin;
    const isManager = userRoles.includes('Manager');

    const doc = await Document.findByPk(req.params.id, {
      include: [
        { model: User, as: 'documentOwner', attributes: ['id', 'username', 'email'] }
      ]
    });

    if (!doc) return res.status(404).json({ message: 'Document not found' });

    // Get owner profile
    const ownerProfile = await EmployeeProfile.findOne({ 
      where: { user_id: doc.owner_id },
      include: [{ model: Department, as: 'profileDepartment', attributes: ['id', 'name'] }]
    });

    // DAC: Owner always has access
    if (doc.owner_id === user.id) {
      return res.json({ ...doc.toJSON(), ownerProfile });
    }

    // MAC + DAC: Visibility-based access
    if (doc.visibility === 'PUBLIC') {
      return res.json({ ...doc.toJSON(), ownerProfile });
    }

    if (doc.visibility === 'INTERNAL') {
      if (isAdmin || isHR) return res.json({ ...doc.toJSON(), ownerProfile });
      if (isManager && ownerProfile?.manager_id === user.id) {
        return res.json({ ...doc.toJSON(), ownerProfile });
      }
      return res.status(403).json({ message: '[MAC/DAC] Access denied: INTERNAL documents are only visible to your manager, HR, or Admin' });
    }

    if (doc.visibility === 'PRIVATE') {
      if (isAdmin || isHR) return res.json({ ...doc.toJSON(), ownerProfile });
      return res.status(403).json({ message: '[MAC/DAC] Access denied: PRIVATE documents are only visible to HR and Admin' });
    }

    return res.status(403).json({ message: '[MAC/DAC] Access denied' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create document (Employees/Managers/Admins can upload)
export const createDocument = async (req, res) => {
  try {
    const file = req.file;
    const { title, visibility } = req.body;

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Validate visibility
    const validVisibilities = ['PUBLIC', 'INTERNAL', 'PRIVATE'];
    const docVisibility = visibility && validVisibilities.includes(visibility.toUpperCase()) 
      ? visibility.toUpperCase() 
      : 'PRIVATE';

    // Create document owned by current user
    const doc = await Document.create({
      title: title || file.originalname,
      file_path: file.path,
      owner_id: req.user.id,
      visibility: docVisibility
    });

    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update document visibility (DAC: only owner can change)
export const updateDocument = async (req, res) => {
  try {
    const doc = await Document.findByPk(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    // DAC: Only owner can update
    if (doc.owner_id !== req.user.id) {
      return res.status(403).json({ message: '[DAC] Access denied: Only the document owner can modify visibility' });
    }

    const { title, visibility } = req.body;
    if (title) doc.title = title;
    
    if (visibility) {
      const validVisibilities = ['PUBLIC', 'INTERNAL', 'PRIVATE'];
      if (validVisibilities.includes(visibility.toUpperCase())) {
        doc.visibility = visibility.toUpperCase();
      }
    }

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
      return res.status(403).json({ message: '[DAC] Access denied: Only the owner or an Admin can delete this document' });
    }

    // Clean up any permissions for this document
    await DocumentPermission.destroy({ where: { resource_id: doc.id } });

    await doc.destroy();
    res.json({ message: 'Document deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
