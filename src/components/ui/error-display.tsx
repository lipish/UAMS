'use client';

import React from 'react';
import { AlertCircle, AlertOctagon, AlertTriangle, Info, X } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const errorVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        error: "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
        warning: "border-warning/50 bg-warning/10 text-warning dark:border-warning [&>svg]:text-warning",
        info: "border-info/50 bg-info/10 text-info dark:border-info [&>svg]:text-info",
        success: "border-success/50 bg-success/10 text-success dark:border-success [&>svg]:text-success",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface ErrorDisplayProps extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof errorVariants> {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  onClose?: () => void;
  status?: number;
}

export function ErrorDisplay({
  className,
  variant = "error",
  title,
  description,
  icon,
  onClose,
  status,
  ...props
}: ErrorDisplayProps) {
  // 根据variant选择默认图标
  const getIcon = () => {
    if (icon) return icon;
    
    switch (variant) {
      case 'error':
        return <AlertOctagon className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'info':
        return <Info className="h-4 w-4" />;
      case 'success':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  // 根据HTTP状态码生成默认标题
  const getTitle = () => {
    if (title) return title;
    
    if (status) {
      switch (status) {
        case 400: return '请求错误';
        case 401: return '未授权访问';
        case 403: return '禁止访问';
        case 404: return '资源未找到';
        case 408: return '请求超时';
        case 500: return '服务器内部错误';
        case 502: return '网关错误';
        case 503: return '服务不可用';
        case 504: return '网关超时';
        default: return `错误 (${status})`;
      }
    }
    
    return variant === 'error' ? '发生错误' : 
           variant === 'warning' ? '警告' :
           variant === 'info' ? '提示信息' : '成功';
  };

  return (
    <div
      className={cn(errorVariants({ variant }), className)}
      {...props}
    >
      {getIcon()}
      {onClose && (
        <button 
          onClick={onClose} 
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">关闭</span>
        </button>
      )}
      <div className="grid gap-1">
        {(title || status) && (
          <div className="font-medium leading-none tracking-tight">
            {status ? `${getTitle()} (${status})` : getTitle()}
          </div>
        )}
        {description && (
          <div className="text-sm [&_p]:leading-relaxed">
            {description}
          </div>
        )}
        {props.children}
      </div>
    </div>
  );
}