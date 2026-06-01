# SilverHair 银发活动平台

面向中老年群体的社区活动平台，提供广场舞、乐器学习、太极、书法等活动的发布、浏览、预约和参与功能。

## 功能模块

- **首页** - 活动列表，支持按分类筛选
- **发现** - 按活动类别浏览（广场舞、乐器、太极、书法等）
- **发布** - 创建活动（选地点、选时间、设人数上限）
- **我的** - 个人中心，查看我发布的/参与的活动
- **活动详情** - 查看活动信息、报名/取消报名

## 技术栈

- 微信小程序原生开发
- 微信云开发（云函数 + 云数据库 + 云存储）

## 数据库集合

| 集合名 | 说明 |
|--------|------|
| activities | 活动信息 |
| registrations | 报名记录 |
| users | 用户信息 |

## 云函数

- `activityFunctions` - 所有业务逻辑
  - getOpenId - 获取用户 openid
  - createActivity - 创建活动
  - getActivityList - 获取活动列表
  - getActivityDetail - 获取活动详情
  - registerActivity - 报名活动
  - cancelRegistration - 取消报名
  - getMyActivities - 获取我发布的活动
  - getMyRegistrations - 获取我报名的活动
  - updateActivity - 更新活动状态
  - updateUserProfile - 更新用户资料

## 使用步骤

1. 在微信开发者工具中打开项目
2. 开通云开发，创建云环境
3. 在 `miniprogram/app.js` 中填入云环境 ID（`env` 字段）
4. 在云开发控制台创建数据库集合：`activities`、`registrations`、`users`
5. 右键 `cloudfunctions/activityFunctions` 目录，选择"上传并部署：云端安装依赖"
6. 编译运行

## 活动分类

- 💃 广场舞
- 🎵 乐器学习
- 🥋 太极养生
- 🎨 书法绘画
- 🎤 合唱朗诵
- ♟️ 棋牌娱乐
- 🚶 户外徒步
- 🎯 其他
