import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { contextClient, ContextItem } from './postgres-context-client';

// 上下文数据类型
interface LicenseContextData {
  projectSummary: ContextItem | null;
  businessLogic: ContextItem | null;
  databaseSchema: ContextItem | null;
  isLoading: boolean;
  error: string | null;
  refreshContext: () => Promise<void>;
  searchContext: (query: string) => Promise<ContextItem[]>;
}

// 创建React上下文
const LicenseContext = createContext<LicenseContextData | undefined>(undefined);

// 上下文提供者属性
interface LicenseContextProviderProps {
  children: ReactNode;
  userId?: number;
}

/**
 * 为应用程序提供License管理系统上下文数据
 */
export const LicenseContextProvider: React.FC<LicenseContextProviderProps> = ({ 
  children, 
  userId = 1 // 默认用户ID
}) => {
  const [projectSummary, setProjectSummary] = useState<ContextItem | null>(null);
  const [businessLogic, setBusinessLogic] = useState<ContextItem | null>(null);
  const [databaseSchema, setDatabaseSchema] = useState<ContextItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 加载上下文数据
  const loadContextData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 加载项目总结
      const summaryContexts = await contextClient.retrieveContexts(
        'project_summary', 
        undefined, 
        undefined, 
        1
      );
      
      if (summaryContexts.length > 0) {
        setProjectSummary(summaryContexts[0]);
        
        // 记录访问历史
        await contextClient.recordContextAccess(
          summaryContexts[0].id, 
          userId, 
          'view',
          { source: 'context-provider', client_type: 'web' }
        );
      }
      
      // 加载业务逻辑上下文
      const businessContexts = await contextClient.retrieveContexts(
        'business_logic',
        ['license', 'workflow'],
        undefined,
        1
      );
      
      if (businessContexts.length > 0) {
        setBusinessLogic(businessContexts[0]);
      }
      
      // 加载数据库结构上下文
      const dbContexts = await contextClient.retrieveContexts(
        'database_schema',
        undefined,
        undefined,
        1
      );
      
      if (dbContexts.length > 0) {
        setDatabaseSchema(dbContexts[0]);
      }
      
    } catch (err) {
      console.error('加载上下文数据失败:', err);
      setError('无法加载系统上下文数据。请稍后再试。');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 搜索上下文
  const searchContext = async (query: string): Promise<ContextItem[]> => {
    try {
      return await contextClient.retrieveContexts(
        undefined, // 所有类型
        undefined, // 所有标签
        query,     // 搜索词
        10         // 限制10条结果
      );
    } catch (err) {
      console.error('搜索上下文失败:', err);
      setError('搜索上下文时出错。');
      return [];
    }
  };

  // 初始加载
  useEffect(() => {
    loadContextData();
    
    // 组件卸载时清理
    return () => {
      // 这里可以添加清理逻辑
    };
  }, [userId]);

  // 暴露上下文值
  const contextValue: LicenseContextData = {
    projectSummary,
    businessLogic,
    databaseSchema,
    isLoading,
    error,
    refreshContext: loadContextData,
    searchContext
  };

  return (
    <LicenseContext.Provider value={contextValue}>
      {children}
    </LicenseContext.Provider>
  );
};

/**
 * 使用License上下文的自定义Hook
 */
export const useLicenseContext = () => {
  const context = useContext(LicenseContext);
  
  if (context === undefined) {
    throw new Error('useLicenseContext必须在LicenseContextProvider内部使用');
  }
  
  return context;
};

/**
 * 用于在组件中渲染上下文内容的实用组件
 */
export const LicenseContextDisplay: React.FC = () => {
  const { projectSummary, isLoading, error } = useLicenseContext();
  
  if (isLoading) {
    return <div>加载上下文数据...</div>;
  }
  
  if (error) {
    return <div className="error">{error}</div>;
  }
  
  if (!projectSummary) {
    return <div>没有可用的项目上下文信息</div>;
  }
  
  return (
    <div className="context-display">
      <h2>{projectSummary.title}</h2>
      <div className="tags">
        {projectSummary.tags.map(tag => (
          <span key={tag} className="tag">{tag}</span>
        ))}
      </div>
      <div className="context-content">
        {/* 将Markdown内容渲染为HTML (需要markdown渲染器) */}
        <div dangerouslySetInnerHTML={{ __html: projectSummary.content }} />
      </div>
      <div className="metadata">
        <p>最后更新: {new Date(projectSummary.updatedAt).toLocaleString()}</p>
      </div>
    </div>
  );
};