import { Metadata } from 'next';
import { RegisterForm } from './RegisterForm';

export const metadata: Metadata = {
  title: '注册 | License 管理系统',
  description: '代理商注册页面',
};

export default function RegisterPage() {
  return <RegisterForm />;
}