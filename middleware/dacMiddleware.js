// middleware/dacMiddleware.js
import DocumentPermission from '../models/DocumentPermission.js';
import Document from '../models/Document.js';

// Helper for consistent deny messages
const deny = (res, middleware, reason, code = 403) => {
  console.warn(`[${middleware}] Access denied: ${reason}`);
  return res.status(code).json({ message: `[${middleware}] ${reason}` });
};

export const enforceDAC = (action) => {
  return async (req, res, next) => {
    const middlewareName = 'DAC';
    try {
      const docId = req.params.id;
      const userId = req.user.id;

      console.log(`[${middlewareName}] Middleware invoked for action: ${action}`);
      console.log(`[${middlewareName}] Request params:`, req.params);
      console.log(`[${middlewareName}] Authenticated user:`, req.user);

      const document = await Document.findByPk(docId);

      if (!document) return deny(res, middlewareName, 'Document not found', 404);

      console.log(`[${middlewareName}] Loaded document:`, document.dataValues);

      // Owners always have full access
      if (document.owner_id === userId) return next();

      // Check permission table
      const permission = await DocumentPermission.findOne({
        where: { resource_id: docId, user_id: userId }
      });

      if (!permission) return deny(res, middlewareName, 'No permissions assigned for this user');

      if (action === 'view' && permission.can_view) return next();
      if ((action === 'edit' || action === 'delete') && permission.can_edit) return next();

      return deny(res, middlewareName, `User does not have ${action} permission for this document`);
    } catch (err) {
      console.error(`[${middlewareName}] Error:`, err);
      res.status(500).json({ message: `[${middlewareName}] Server error` });
    }
  };
};
