import React from 'react';

const Tabs = ({ children, activeTab, onChange, className = '' }) => {
  return (
    <div className={`border-b border-gray-200 dark:border-gray-700 ${className}`}>
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {React.Children.map(children, (child) => {
          if (!React.isValidElement(child)) return null;
          
          return React.cloneElement(child, {
            isActive: child.props.tabId === activeTab,
            onClick: () => onChange(child.props.tabId)
          });
        })}
      </nav>
    </div>
  );
};

const Tab = ({ children, isActive, onClick, className = '' }) => {
  return (
    <button
      onClick={onClick}
      className={`${isActive
        ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-500'
      } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${className}`}
      aria-current={isActive ? 'page' : undefined}
    >
      {children}
    </button>
  );
};

Tabs.Tab = Tab;

export default Tabs;
