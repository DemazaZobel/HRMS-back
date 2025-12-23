import express from 'express';
import multer from 'multer';
import {
  getAllDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument
} from '../controllers/documentController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { enforceDAC } from '../middleware/dacMiddleware.js';
import { enforceABAC } from '../middleware/abacMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { activityLogger } from '../middleware/activityLogger.js'; // updated

const router = express.Router();

// Simple disk storage for uploads
const upload = multer({ dest: 'uploads/' });

/**
 * Get all documents
 * RBAC: Employee, Manager, Admin
 * ABAC: attribute filters
 * Activity logging: records user, IP, agent, action, module
 */
router.get(
  '/',
  authenticate,
  authorizeRoles('Employee', 'Manager', 'Admin'),
  enforceABAC('Document', 'view'),
  activityLogger('viewAllDocuments', 'Document'),
  getAllDocuments
);

/**
 * Get document by ID
 * DAC: check permission
 * ABAC: optional attribute-based checks
 * RBAC: Employee, Manager, Admin
 * Activity logging
 */
router.get(
  '/:id',
  authenticate,
  authorizeRoles('Employee', 'Manager', 'Admin'),
  enforceDAC('view'),
  enforceABAC('Document', 'view'),
  activityLogger('viewDocument', 'Document'),
  getDocumentById
);

/**
 * Create document (employees can upload their own documents)
 * Activity logging
 */
router.post(
  '/',
  authenticate,
  authorizeRoles('Employee', 'Manager', 'Admin'),
  upload.single('file'),
  activityLogger('createDocument', 'Document'),
  createDocument
);

/**
 * Update document
 * RBAC: Admin only
 * DAC: check edit permission
 * ABAC: optional
 * Activity logging
 */
router.put(
  '/:id',
  authenticate,
  authorizeRoles('Admin'),
  enforceDAC('edit'),
  enforceABAC('Document', 'update'),
  activityLogger('updateDocument', 'Document'),
  updateDocument
);

/**
 * Delete document
 * RBAC: Employee, Manager, Admin (controller & DAC/ABAC enforce finer rules)
 * Activity logging
 */
router.delete(
  '/:id',
  authenticate,
  authorizeRoles('Employee', 'Manager', 'Admin'),
  enforceDAC('delete'),
  enforceABAC('Document', 'delete'),
  activityLogger('deleteDocument', 'Document'),
  deleteDocument
);

export default router;
