import React from 'react';

export interface ErrorPanelProps {
  title?: string;
  message?: string;
  status?: number;
  url?: string;
}

export const ErrorPanel: React.FC<ErrorPanelProps> = ({ title = 'Error', message, status, url }) => {
  return (
    <div className="p-4 border rounded bg-red-50 text-red-900">
      <div className="font-semibold">{title}</div>
      {message && <div className="text-sm mt-1">{message}</div>}
      <div className="text-xs text-muted-foreground mt-2">{status ? `Status: ${status}` : null} {url ? `• ${url}` : null}</div>
    </div>
  );
};

export default ErrorPanel;
