// controllers/documentPermissionController.js
import DocumentPermission from '../models/DocumentPermission.js';
import Document from '../models/Document.js';
import ActivityLog from '../models/ActivityLog.js';

/**
 * Grant permission
 */
export const grantPermission = async (req, res) => {
  try {
    const { document_id, user_id, can_view, can_edit } = req.body;

    const document = await Document.findByPk(document_id);
    if (!document) return res.status(404).json({ message: 'Document not found' });

    // Only owner can grant
    if (document.owner_id !== req.user.id) {
      return res.status(403).json({ message: 'Only owner can grant permissions' });
    }

    const permission = await DocumentPermission.create({
      resource_id: document_id,
      user_id,
      can_view,
      can_edit,
      granted_by: req.user.id
    });

    // Log the grant
    await ActivityLog.create({
      user_id: req.user.id,
      action: `Granted permission (view: ${can_view}, edit: ${can_edit}) to user ${user_id} for document ${document_id}`
    });

    res.status(201).json(permission);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Revoke permission
 */
export const revokePermission = async (req, res) => {
  try {
    const { document_id, user_id } = req.body;

    const document = await Document.findByPk(document_id);
    if (!document) return res.status(404).json({ message: 'Document not found' });

    if (document.owner_id !== req.user.id) {
      return res.status(403).json({ message: 'Only owner can revoke permissions' });
    }

    const deleted = await DocumentPermission.destroy({
      where: { resource_id: document_id, user_id }
    });

    // Log the revoke
    await ActivityLog.create({
      user_id: req.user.id,
      action: `Revoked permission for user ${user_id} on document ${document_id}`
    });

    res.json({ message: 'Permission revoked', deleted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
