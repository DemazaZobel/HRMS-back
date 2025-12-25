import express from 'express';
import multer from 'multer';
import {
  getAllDocuments,
  getPublicDocuments,
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
 * Get public documents (no auth required)
 */
router.get(
  '/public',
  getPublicDocuments
);

/**
 * Get all documents (authenticated users)
 * RBAC: Employee, Manager, Admin
 * MAC/DAC: enforced in controller
 */
router.get(
  '/',
  authenticate,
  authorizeRoles('Employee', 'Manager', 'Admin'),
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
 * Update document visibility (DAC: only owner can change)
 */
router.put(
  '/:id',
  authenticate,
  authorizeRoles('Employee', 'Manager', 'Admin'),
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
