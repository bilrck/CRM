import { getSystemConfig } from "../services/systemConfig.service.js";

/**
 * Middleware to restrict API access based on active modules in system settings.
 * @param {string} moduleName - Name of the module to check ('whatsapp', 'meta', 'googleAds')
 */
export const checkModuleActive = (moduleName) => {
  return (req, res, next) => {
    const config = getSystemConfig();
    const isModuleActive = config && config.modules && config.modules[moduleName] !== false;

    if (!isModuleActive) {
      return res.status(403).json({
        error: `O módulo "${moduleName}" está atualmente desativado nas configurações do sistema.`
      });
    }

    next();
  };
};
