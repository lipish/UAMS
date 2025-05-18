-- 重命名 password_hash 列为 password
ALTER TABLE users RENAME COLUMN password_hash TO password;
