# 📚 智慧图书馆项目（Smart Library）

## 🧩 项目简介

本项目是一个基于 **Node.js + ThinkJS + MySQL** 开发的小型虚拟智慧图书馆网页系统。  
适合作为 **数据结构与算法**、**程序设计** 等课程的课程项目或实验作品。

项目结构清晰，功能完整，支持本地运行与服务器部署。

---

## 🚀 使用说明

### 第一步：安装项目
将项目代码下载或克隆到本地。

```bash
git clone 
```
> 如果是压缩包形式，请直接解压到本地目录。

---

### 第二步：进入项目目录并安装依赖

进入后端目录并执行依赖安装命令：
```bash
cd smart_library_backend/backend
npm install
```

---

### 第三步：启动项目

安装完成后，运行以下命令启动服务：
```bash
npm start
```

默认情况下，项目会在本地 `http://localhost:8360` 启动运行。

---

### 第四步：创建并配置数据库

1. **创建数据库连接**  
   建议使用以下 MySQL 连接配置：
   - 用户名：`root`  
   - 密码：`123456`

2. **创建数据库**
   ```sql
   CREATE DATABASE smart_library;
   ```

3. **导入数据库结构与数据**  
   将项目根目录下的 `.sql` 文件导入刚创建的 `smart_library` 数据库中：
   ```bash
   # 方式一：命令行导入
   mysql -u root -p smart_library < smart_library.sql

   # 方式二：图形化工具（如 Navicat、DBeaver）导入
   ```

---

### 第五步（可选）：配置 Nginx

如果需要在服务器上部署本项目，可参考根目录下的 `nginx.conf` 文件进行配置。  
根据服务器环境修改相关路径与端口，即可完成前后端分离部署。

---

## 🧱 项目结构

```
smart_library/
├── smart_libray/
│   ├── pages/
│   ├── components/
│   └── index.html
│
├── smart_library_backend/               # 后端主目录（Node.js + ThinkJS）
│   ├── src/
│   ├── www/
│   └── package.json
│
├── smart_library.sql      # 数据库初始化文件
├── nginx.conf             # Nginx 配置文件（可选）
└── README.md              # 使用说明文件
```

---

## ✅ 环境要求

- Node.js ≥ 14.x  
- MySQL ≥ 5.7  
- npm ≥ 6.x  

---

## 📞 联系方式

如有问题或建议，欢迎提交 **2827825079@qq.com** 进行交流。

---

**📖 本项目仅供学习与教学使用。如果对您有帮助，请star，感谢。**
