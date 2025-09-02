module.exports = {
  extends: [
    'react-app',
    'react-app/jest'
  ],
  rules: {
    // Disable unused variables error for production builds
    'no-unused-vars': process.env.NODE_ENV === 'production' ? 'warn' : 'error',
    // Disable other problematic rules for deployment
    'react-hooks/exhaustive-deps': 'warn',
    'import/no-anonymous-default-export': 'warn'
  }
};
