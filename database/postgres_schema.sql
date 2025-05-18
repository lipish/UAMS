-- License Management System Database Schema

-- Users Table (代理商用户)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Products Table (产品表)
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- License Types Table (License类型)
CREATE TABLE license_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL, -- 试用版, 标准版, 专业版, 企业版
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Features Table (功能特性)
CREATE TABLE features (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL, -- 基础功能, 高级功能, 专业功能
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- License Type Features (License类型与功能特性关联表)
CREATE TABLE license_type_features (
    license_type_id INTEGER REFERENCES license_types(id) ON DELETE CASCADE,
    feature_id INTEGER REFERENCES features(id) ON DELETE CASCADE,
    PRIMARY KEY (license_type_id, feature_id)
);

-- License Applications Table (License申请表)
CREATE TABLE license_applications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    license_type_id INTEGER REFERENCES license_types(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    apply_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expiry_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, approved, rejected, expired
    license_key VARCHAR(255),
    mac_address VARCHAR(100),
    reviewed_by INTEGER REFERENCES users(id),
    review_date TIMESTAMP WITH TIME ZONE,
    review_comments TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- License Features (License申请与功能特性关联表)
CREATE TABLE license_features (
    license_application_id INTEGER REFERENCES license_applications(id) ON DELETE CASCADE,
    feature_id INTEGER REFERENCES features(id) ON DELETE CASCADE,
    PRIMARY KEY (license_application_id, feature_id)
);

-- Licenses Table (License表)
CREATE TABLE licenses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    applicant_name VARCHAR(255) NOT NULL,
    applicant_email VARCHAR(255) NOT NULL,
    applicant_phone VARCHAR(50),
    company_name VARCHAR(255),
    license_type VARCHAR(50) NOT NULL,
    mac_address VARCHAR(100) NOT NULL,
    application_reason TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    license_key VARCHAR(255),
    reviewed_by INTEGER REFERENCES users(id),
    review_date TIMESTAMP WITH TIME ZONE,
    review_comments TEXT,
    expiry_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit Log Table (审计日志)
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER,
    details JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_license_applications_user_id ON license_applications(user_id);
CREATE INDEX idx_license_applications_status ON license_applications(status);
CREATE INDEX idx_license_applications_expiry_date ON license_applications(expiry_date);
CREATE INDEX idx_licenses_license_application_id ON licenses(license_application_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- Sample data insertion for testing
INSERT INTO license_types (name, description) VALUES 
('试用版', '基础功能，有限期限'),
('标准版', '常用功能，适合个人或小型团队'),
('专业版', '高级功能，适合中型企业'),
('企业版', '全功能支持，适合大型组织');

INSERT INTO features (name, description) VALUES
('基础功能', '包含核心功能模块'),
('高级功能', '包含进阶分析和报告功能'),
('专业功能', '包含高级管理和集成功能');

-- Associate features with license types
INSERT INTO license_type_features (license_type_id, feature_id) VALUES
(1, 1), -- 试用版 - 基础功能
(2, 1), -- 标准版 - 基础功能
(3, 1), (3, 2), -- 专业版 - 基础功能, 高级功能
(4, 1), (4, 2), (4, 3); -- 企业版 - 所有功能

-- 创建测试用户 (密码: test123)
INSERT INTO users (username, email, password, company_name, contact_name, phone, role) VALUES
('testuser', 'test@example.com', '$2b$10$3IXgAkEl.PWJVmUxj4aOZeS.4h0CycKryDaHsf1TecEbQYqY4flsG', '测试公司', '测试用户', '13800138000', 'user'),
('admin', 'admin@example.com', '$2b$10$3IXgAkEl.PWJVmUxj4aOZeS.4h0CycKryDaHsf1TecEbQYqY4flsG', '管理公司', '管理员', '13900139000', 'admin');