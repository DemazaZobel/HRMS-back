// middleware/abacMiddleware.js
import EmployeeProfile from '../models/EmployeeProfile.js';
import Document from '../models/Document.js';
import User from '../models/User.js';
import Department from '../models/Department.js'; // Added
import Roles from '../models/Role.js';
// You can also import other resources as needed

// Helper for consistent deny messages
const deny = (res, middleware, reason, code = 403) => {
  console.warn(`[${middleware}] Access denied: ${reason}`);
  return res.status(code).json({ message: `[${middleware}] ${reason}` });
};

export const enforceABAC = (resourceType, action) => {
  return async (req, res, next) => {
    const middlewareName = 'ABAC';
    try {
      const user = req.user;
      const roles = user.roles?.map(r => (typeof r === 'string' ? r : r.name)) || [];
      const { id } = req.params;

      console.log(`[${middlewareName}] Middleware invoked for resource: ${resourceType}, action: ${action}`);
      console.log(`[${middlewareName}] Request params:`, req.params);
      console.log(`[${middlewareName}] Authenticated user:`, user);
      console.log(`[${middlewareName}] User roles:`, roles);

      let resource;

      // Load resource based on type
      switch(resourceType) {
        case 'EmployeeProfile':
          resource = await EmployeeProfile.findByPk(id, { include: ['profileDepartment'] });
          if (!resource) return deny(res, middlewareName, 'EmployeeProfile not found', 404);
          break;

        case 'Document':
          // For collection routes (no specific :id), skip ABAC resource lookup
          if (!id) {
            return next();
          }
          resource = await Document.findByPk(id);
          if (!resource) return deny(res, middlewareName, 'Document not found', 404);

          // Owners can always manage their own documents regardless of sensitivity
          if (resource.owner_id === user.id) {
            console.log(`[${middlewareName}] Owner access granted for document ${id}`);
            return next();
          }
          break;

        case 'User':
          if (id) {
            resource = await User.findByPk(id, { include: ['roles'] });
            if (!resource) return deny(res, middlewareName, 'User not found', 404);
          } else {
            return next(); // Creating a new user, skip ABAC
          }
          break;

        case 'Department':
          if (id) {
            resource = await Department.findByPk(id);
            if (!resource) return deny(res, middlewareName, 'Department not found', 404);
          } else {
            return next(); // Creating a new department, skip ABAC
          }
          break;
        case 'Role':
          if (id) {
            resource = await Roles.findByPk(id);
            if (!resource) return deny(res, middlewareName, 'Role not found', 404);
          } else {
            return next(); // Creating a new role, skip ABAC
          }
          break;

        default:
          return deny(res, middlewareName, 'Unknown resource type', 400);
      }

      console.log(`[${middlewareName}] Resource loaded:`, resource?.dataValues || resource);

      // Sensitivity / role-based access map
      const accessMap = {
        Public: ['Employee','Manager','Admin'],
        Internal: ['Manager','Admin'],
        Confidential: ['Admin'],
        Department: ['Admin', 'Manager'] // Departments only for Admin/Manager
      };

      // Determine resource sensitivity
      const resourceLevel = resource.sensitivityLevel || (resourceType === 'Department' ? 'Department' : 'Internal');
      const allowedRoles = accessMap[resourceLevel] || [];

      if (!roles.some(r => allowedRoles.includes(r))) {
        return deny(res, middlewareName, `Access denied for ${resourceType} with sensitivity '${resourceLevel}'`);
      }

      // Optional: EmployeeProfile department check
      if (resourceType === 'EmployeeProfile') {
        const userDeptId = user.profile?.department_id;
        if (roles.includes('Employee') && userDeptId !== resource.department_id) {
          return deny(res, middlewareName, 'Employee cannot access profiles from a different department');
        }
      }

      // Passed all checks
      console.log(`[${middlewareName}] Access granted`);
      next();

    } catch (error) {
      console.error(`[${middlewareName}] Server error:`, error);
      res.status(500).json({ message: `[${middlewareName}] Server error` });
    }
  };
};
