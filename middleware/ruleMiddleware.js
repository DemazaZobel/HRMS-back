// middleware/rubacMiddleware.js
import RulePolicy from '../models/RulePolicy.js';
import EmployeeProfile from '../models/EmployeeProfile.js';
import LeaveRequest from '../models/LeaveRequest.js';

export const enforceRules = (action) => {
  return async (req, res, next) => {
    const middlewareName = 'RuBAC Middleware';
    console.log(`[${middlewareName}] Invoked for action: ${action}`);
    console.log(`[${middlewareName}] Request params:`, req.params);
    console.log(`[${middlewareName}] Authenticated user:`, req.user);

    try {
      const user = req.user; // authenticated user
      const rules = await RulePolicy.findAll({ where: { name: action } });

      if (!rules.length) {
        console.log(`[${middlewareName}] No rules found for action: ${action}, access granted by default`);
        return next();
      }

      for (const rule of rules) {
        const conditions = rule.condition_json;
        console.log(`[${middlewareName}] Evaluating rule:`, rule.name, 'Conditions:', conditions);

        // 1️⃣ Time-based rule
        if (conditions.startHour !== undefined && conditions.endHour !== undefined) {
          const nowHour = new Date().getHours();
          if (nowHour < conditions.startHour || nowHour >= conditions.endHour) {
            console.warn(`[${middlewareName}] Access denied: outside allowed hours (${conditions.startHour}-${conditions.endHour})`);
            return res.status(403).json({ message: `[${middlewareName}] Access denied: outside allowed hours (${conditions.startHour}-${conditions.endHour})` });
          }
        }

        // 2️⃣ Role-based condition
        if (conditions.allowedRoles && !conditions.allowedRoles.includes(user.roles[0])) {
          console.warn(`[${middlewareName}] Access denied: role not allowed`);
          return res.status(403).json({ message: `[${middlewareName}] Access denied: role not allowed` });
        }

        // 3️⃣ Device-based condition
        if (conditions.allowedDevices) {
          const device = req.headers['user-agent'] || '';
          const match = conditions.allowedDevices.some(d => device.includes(d));
          if (!match) {
            console.warn(`[${middlewareName}] Access denied: device not allowed`);
            return res.status(403).json({ message: `[${middlewareName}] Access denied: device not allowed` });
          }
        }

        // 4️⃣ IP-based condition
        if (conditions.allowedIPs) {
          const ip = req.ip;
          if (!conditions.allowedIPs.includes(ip)) {
            console.warn(`[${middlewareName}] Access denied: IP not allowed`);
            return res.status(403).json({ message: `[${middlewareName}] Access denied: IP not allowed` });
          }
        }

        // 5️⃣ Country-based condition
        if (conditions.allowedCountries) {
          const userCountry = req.headers['x-country'] || 'Unknown';
          if (!conditions.allowedCountries.includes(userCountry)) {
            console.warn(`[${middlewareName}] Access denied: country not allowed`);
            return res.status(403).json({ message: `[${middlewareName}] Access denied: country not allowed` });
          }
        }

        // 6️⃣ Business-specific rule (leave approval)
        if (action === 'approveLeave' && conditions.maxDays) {
          const leaveId = req.params.id;
          const leave = await LeaveRequest.findByPk(leaveId);
          if (!leave) {
            console.warn(`[${middlewareName}] Leave request not found`);
            return res.status(404).json({ message: `[${middlewareName}] Leave request not found` });
          }

          const daysRequested = (new Date(leave.end_date) - new Date(leave.start_date)) / (1000*60*60*24) + 1;
          if (daysRequested > conditions.maxDays && !conditions.overrideRoles.includes(user.roles[0])) {
            console.warn(`[${middlewareName}] Access denied: leave exceeds ${conditions.maxDays} days`);
            return res.status(403).json({ message: `[${middlewareName}] Access denied: leave exceeds ${conditions.maxDays} days` });
          }
        }
      }

      console.log(`[${middlewareName}] Access granted`);
      next(); // passed all rules
    } catch (err) {
      console.error(`[${middlewareName}] Error:`, err);
      res.status(500).json({ message: `[${middlewareName}] Server error` });
    }
  };
};
