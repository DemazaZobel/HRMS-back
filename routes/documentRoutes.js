import express from 'express';
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
 * Create document
 * RBAC: Admin only
 * ABAC: optional rules
 * Activity logging
 */
router.post(
  '/',
  authenticate,
  authorizeRoles('Admin'),
  enforceABAC('Document', 'create'),
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
 * RBAC: Admin only
 * DAC: optional check
 * ABAC: optional
 * Activity logging
 */
router.delete(
  '/:id',
  authenticate,
  authorizeRoles('Admin'),
  enforceDAC('delete'),
  enforceABAC('Document', 'delete'),
  activityLogger('deleteDocument', 'Document'),
  deleteDocument
);

export default router;
