// middleware/roleMiddleware.js

export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    const middlewareName = 'RoleMiddleware';
    const userRoles = req.user.roles || [];

    console.log(`[${middlewareName}] Invoked`);
    console.log(`[${middlewareName}] User roles:`, userRoles);
    console.log(`[${middlewareName}] Allowed roles:`, allowedRoles);

    const hasRole = userRoles.some(role => allowedRoles.includes(role));

    if (!hasRole) {
      console.warn(`[${middlewareName}] Access denied: insufficient role`);
      return res.status(403).json({ message: `[${middlewareName}] Access denied: insufficient role` });
    }

    console.log(`[${middlewareName}] Access granted`);
    next();
  };
};
