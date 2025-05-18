import { Metadata } from 'next';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = {
  title: '登录 | License 管理系统',
  description: '代理商登录页面',
};

export default function LoginPage() {
  return <LoginForm />;
}