import fs from 'fs';
import path from 'path';
import { contextClient } from '../lib/postgres-context-client';

/**
 * 加载项目总结到PostgreSQL上下文服务
 * 该脚本读取项目README.md文件，并将内容存储到上下文数据库中
 */
async function loadProjectSummary() {
  try {
    console.log('开始加载项目总结到上下文服务器...');
    
    // 读取README文件
    const readmePath = path.join(process.cwd(), 'README.md');
    const readmeContent = fs.readFileSync(readmePath, 'utf-8');
    
    // 提取项目摘要
    console.log('提取项目摘要信息...');
    const summary = extractSummary(readmeContent);
    
    // 存储到上下文数据库
    console.log('存储项目总结到PostgreSQL上下文服务器...');
    const contextId = await contextClient.storeProjectSummary(
      'License管理系统总结',
      summary.content,
      {
        version: getProjectVersion(),
        source: 'README.md',
        updated_at: new Date().toISOString(),
        sections: summary.sections
      },
      ['license', 'management', 'project', 'summary', 'nextjs']
    );
    
    console.log(`项目总结已成功加载! 上下文ID: ${contextId}`);
    
    // 示例：获取刚存储的上下文
    const loadedContext = await contextClient.getContextById(contextId);
    console.log('验证加载的上下文:');
    console.log(`- 标题: ${loadedContext?.title}`);
    console.log(`- 类型: ${loadedContext?.type}`);
    console.log(`- 标签: ${loadedContext?.tags.join(', ')}`);
    console.log(`- 内容长度: ${loadedContext?.content.length} 字符`);
    
  } catch (error) {
    console.error('加载项目总结失败:', error);
  } finally {
    // 关闭数据库连接
    await contextClient.close();
  }
}

/**
 * 从README中提取摘要信息
 */
function extractSummary(readmeContent: string): { content: string, sections: string[] } {
  // 查找项目总结部分
  const summaryMatch = readmeContent.match(/## 项目总结\s+([\s\S]*?)(?=##|$)/);
  const summaryContent = summaryMatch ? summaryMatch[1].trim() : readmeContent;
  
  // 提取所有部分标题
  const sectionRegex = /### ([^\n]+)/g;
  const sections: string[] = [];
  let match;
  
  while ((match = sectionRegex.exec(readmeContent)) !== null) {
    sections.push(match[1].trim());
  }
  
  return {
    content: summaryContent,
    sections
  };
}

/**
 * 获取项目版本
 */
function getProjectVersion(): string {
  try {
    const packagePath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
    return packageJson.version || '0.1.0';
  } catch (error) {
    console.warn('无法获取项目版本:', error);
    return '0.1.0';
  }
}

// 执行加载过程
loadProjectSummary().catch(err => {
  console.error('执行加载过程失败:', err);
  process.exit(1);
});