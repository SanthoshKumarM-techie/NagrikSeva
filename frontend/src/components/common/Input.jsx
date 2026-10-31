import React, { useState, forwardRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { VoiceTextarea } from './VoiceTextarea.jsx';

export const Input = forwardRef(({
  label,
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  helperText,
  icon: Icon,
  disabled = false,
  required = false,
  readOnly = false,
  autoComplete,
  className = '',
  rows = 3,
  showPasswordToggle = true,
  isPasswordVisible,
  onTogglePasswordVisibility,
  enableVoice = false,
  onVoiceChange,
  ...props
}, ref) => {
  const [internalShowPassword, setInternalShowPassword] = useState(false);
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  // If textarea and voice typing requested, delegate to VoiceTextarea
  if (type === 'textarea' && enableVoice) {
    return (
      <VoiceTextarea
        id={inputId}
        label={label}
        value={value}
        onChange={onChange}
        onVoiceChange={onVoiceChange}
        disabled={disabled}
        placeholder={placeholder}
        rows={rows}
        required={required}
        error={error}
        helperText={helperText}
        className={className}
        {...props}
      />
    );
  }

  const isPassword = type === 'password';
  const showPassword = isPasswordVisible !== undefined ? isPasswordVisible : internalShowPassword;

  const togglePasswordVisibility = () => {
    if (disabled) return;
    if (onTogglePasswordVisibility) {
      onTogglePasswordVisibility(!showPassword);
    } else {
      setInternalShowPassword((prev) => !prev);
    }
  };

  const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type;
  const safeValue = value !== undefined && value !== null ? value : '';

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div className="relative rounded-lg shadow-sm">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <Icon className="h-4 w-4" />
          </div>
        )}
        {type === 'textarea' ? (
          <textarea
            ref={ref}
            id={inputId}
            rows={rows}
            value={safeValue}
            onChange={onChange}
            disabled={disabled}
            readOnly={readOnly}
            placeholder={placeholder}
            className={`block w-full rounded-lg border text-sm transition-colors duration-150 p-2.5 ${
              Icon ? 'pl-9' : ''
            } ${
              error
                ? 'border-rose-400 bg-rose-50/20 text-rose-900 dark:text-rose-300 focus:border-rose-500 focus:ring-rose-500'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500 focus:ring-1'
            } disabled:bg-slate-50 dark:disabled:bg-slate-900 disabled:text-slate-400 disabled:cursor-not-allowed`}
            {...props}
          />
        ) : (
          <>
            <input
              ref={ref}
              id={inputId}
              type={effectiveType}
              value={safeValue}
              onChange={onChange}
              disabled={disabled}
              readOnly={readOnly}
              autoComplete={autoComplete}
              placeholder={placeholder}
              className={`block w-full rounded-lg border text-sm transition-colors duration-150 h-10 px-3 ${
                Icon ? 'pl-9' : ''
              } ${
                isPassword && showPasswordToggle ? 'pr-10' : ''
              } ${
                error
                  ? 'border-rose-400 bg-rose-50/20 text-rose-900 dark:text-rose-300 focus:border-rose-500 focus:ring-rose-500'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500 focus:ring-1'
              } disabled:bg-slate-50 dark:disabled:bg-slate-900 disabled:text-slate-400 disabled:cursor-not-allowed`}
              {...props}
            />
            {isPassword && showPasswordToggle && (
              <button
                type="button"
                onClick={togglePasswordVisibility}
                disabled={disabled}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'View password'}
                title={showPassword ? 'Hide password' : 'View password'}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            )}
          </>
        )}
      </div>
      {error ? (
        <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
