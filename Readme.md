# ImageTagger

## 项目简介
ImageTagger是一个用于让Vision大模型自动识别图片进行打标和标签管理的工具，帮助用户更好地组织和分类图片资源。应用支持中英双语描述，适用于机器学习模型训练数据准备。

## 当前版本
V0.8

## 功能特点
- **图像管理** - 批量加载、浏览和选择图片
- **双语标记** - 支持中文和英文描述的创建与编辑
- **AI自动打标** - 通过Vision大模型自动生成图像描述
- **批量处理** - 选择单页或多页图片进行批处理
- **高级选择** - 灵活的图片选择和勾选功能
- **一键添加咒语** - 批量向所有英文描述添加统一前缀
- **多线程处理** - 支持1-20线程同时处理，提高效率
- **分页浏览** - 支持大型图像集分页查看

## 技术栈
- **前端**：HTML、CSS、JavaScript (原生)
- **后端**：Django (Python)
- **AI集成**：Qwen-vl-max
- **数据存储**：文件系统存储图像和文本文件

## 项目结构
```
ImageTagger/
├── main/                  # 主应用
│   ├── static/            # 静态文件
│   │   ├── css/           # 样式表
│   │   ├── js/            # JavaScript文件
│   │   │   └── modules/   # JS模块
│   ├── templates/         # HTML模板
│   ├── views.py           # 视图函数
│   └── urls.py            # URL路由
├── ImageTagger/           # 项目配置
├── staticfiles/           # 收集的静态文件
├── manage.py              # Django管理脚本
└── requirements.txt       # 项目依赖
```

## 安装与部署

### 方法一：直接安装

1. 克隆项目
```bash
git clone https://github.com/linseasea/Imagetagger.git
```

2. 创建并激活虚拟环境
```bash
python -m venv env
source env/bin/activate  # Linux/Mac
# 或 env\Scripts\activate  # Windows
```

3. 安装依赖
```bash
pip install -r requirements.txt
```

4. 初始化数据库
```bash
python manage.py migrate
```

5. 启动服务器
```bash
python manage.py runserver
```

6. 访问应用
在浏览器中打开 `http://127.0.0.1:8000`

### 方法二：使用Docker构建

1. 克隆项目
```bash
git clone https://github.com/linseasea/Imagetagger.git
```

2. 创建数据目录
```bash
mkdir -p data/images data/cn data/en
```

3. 构建并启动Docker容器
```bash
docker-compose up --build
```

4. 访问应用
在浏览器中打开 `http://localhost:8000`

5. 配置数据目录
   - 将图片文件放入 `data/images` 目录
   - 中文标签文件将保存在 `data/cn` 目录
   - 英文标签文件将保存在 `data/en` 目录

6. 停止应用
```bash
docker-compose down
```

### 方法三：使用预构建Docker镜像

1. 获取并导入预构建的Docker镜像
```bash
# 从分享位置复制imagetagger.tar到本地
docker load -i imagetagger.tar
```

2. 创建数据目录
```bash
mkdir -p data/images data/cn data/en
```

3. 创建docker-compose.yml文件
```yaml
services:
  web:
    image: 133-imagetagger-web
    ports:
      - "8000:8000"
    volumes:
      - ./data/images:/app/data/images
      - ./data/cn:/app/data/cn
      - ./data/en:/app/data/en
    environment:
      - DEBUG=True
      - SECRET_KEY=your_secret_key_here
      - ALLOWED_HOSTS=localhost,127.0.0.1
    restart: always
```

4. 启动Docker容器
```bash
docker-compose up
```

5. 访问应用
在浏览器中打开 `http://localhost:8000`

## 使用指南

### 界面布局
- **导航栏**
  - 工具名称区域 (ImageTagger)
  - 文件统计区域 (显示图片和文本文件数量)
  - 功能按钮区域 (设置按钮)
- **主内容区**
  - 图片加载区域 (左侧)
  - 文本展示区域 (中间)
  - 日志展示区域 (右侧)

### 功能操作指南

#### 初始配置
1. 首次访问应用时，将自动弹出设置窗口
2. 配置图片目录、中文文本目录和英文文本目录路径
-图片目录：/app/data/images
-中文文件：/app/data/cn
-英文文件：/app/data/en
3. 设置API密钥和模型配置 (用于AI打标功能)
-当前只支持阿里云的qwen-vl-max、qwen-vl-plus模型
4. 调整线程数 (1-20) 以适应您的系统性能
5. 保存配置后即可开始使用

#### 图片管理
- **勾选所有/取消所有** - 一键勾选或取消勾选当前页面所有图片
- **选择单页** - 将当前页面的所有图片添加到选择集合
- **选择勾选项** - 将手动勾选的图片添加到选择集合
- **分页浏览** - 使用分页控制器浏览大量图片

#### 文本操作
- **创建文本文件** - 为选中的图片创建对应的中英文文本文件
- **编辑文本** - 在文本区域直接编辑描述内容
- **一键添加咒语** - 为所有英文文本添加统一前缀，适用于AI提示词等场景

#### AI辅助打标
1. 选择需要打标的图片 (可以是单张或批量)
2. 点击"AI打标"按钮
3. 系统调用Vision大模型自动分析图片内容
4. 生成的中英文描述会自动保存到对应文件中
5. 日志区域实时显示处理进度和结果

## 常见问题与解决

1. **设置窗口自动弹出**
   - 这是正常现象，首次使用需要配置必要的路径和API信息
   - 配置完成后保存即可

2. **权限问题**
   - 确保配置的目录路径有读写权限
   - Docker部署时确保数据目录挂载正确

3. **性能问题**
   - 对于大量图片处理，可以适当调整线程数
   - 降低线程数可减轻系统负载，提高线程数可加快处理速度

## 开发计划
- [x] 图片批量浏览和选择功能
- [x] 中英双语文本自动生成
- [x] 多线程并行处理
- [x] 一键添加咒语功能
- [ ] 支持更多AI模型接口
- [ ] 用户自定义标签模板
- [ ] 导出功能增强

## 贡献指南
欢迎提交Issue和Pull Request来帮助改进项目。

## 许可证
本项目采用MIT许可证开源。

## 联系方式
- 项目地址：https://github.com/linseasea/Imagetagger.git
- 问题反馈：可通过GitHub Issues提交



