// Reusable button styles for consistent UI across all dashboards

export const buttonStyles = {
  // Primary buttons
  primary: 'px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-sm',
  primarySm: 'px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm shadow-sm',
  primaryLg: 'px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-lg shadow-sm',
  
  // Secondary buttons
  secondary: 'px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium',
  secondarySm: 'px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm',
  
  // Success/Green buttons
  success: 'px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm',
  
  // Danger/Red buttons
  danger: 'px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-sm',
  
  // Outline buttons
  outline: 'px-6 py-2.5 border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors font-medium',
  
  // Ghost/Text buttons
  ghost: 'px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors',
  
  // Icon-only buttons
  icon: 'p-2 hover:bg-gray-100 rounded-lg transition-colors',
  iconPrimary: 'p-2 bg-purple-600 text-white hover:bg-purple-700 rounded-lg transition-colors',
  
  // Disabled state
  disabled: 'px-6 py-2.5 bg-gray-400 text-white rounded-lg cursor-not-allowed opacity-60',
};

export const cardStyles = {
  base: 'bg-white rounded-xl shadow-md p-6',
  hover: 'bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all cursor-pointer',
  bordered: 'bg-white rounded-xl shadow-md p-6 border-2 border-gray-200',
  gradient: 'bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl shadow-md p-6 text-white',
};

export const inputStyles = {
  base: 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent',
  error: 'w-full px-4 py-2 border-2 border-red-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500',
  disabled: 'w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed',
};

export const badgeStyles = {
  success: 'px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium',
  warning: 'px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium',
  error: 'px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium',
  info: 'px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium',
  purple: 'px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium',
};
