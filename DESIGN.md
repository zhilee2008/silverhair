# SilverHair 银发活动平台 - 设计文档

## 产品定位
面向中老年群体的社区活动平台，提供广场舞、乐器学习、太极、书法等活动的发布、浏览、预约和参与功能。

## 核心功能
1. **活动浏览** - 按分类查看附近活动
2. **活动详情** - 查看活动信息、地点、时间、人数
3. **报名参与** - 一键报名参加活动
4. **发布活动** - 创建新活动（标题、分类、时间、地点、人数上限、描述）
5. **个人中心** - 我的报名、我发布的活动、个人信息

## 分类
- 广场舞
- 乐器学习（二胡、葫芦丝、手风琴等）
- 太极/养生
- 书法/绘画
- 合唱/朗诵
- 棋牌娱乐
- 户外徒步
- 其他

## 页面结构
| 页面 | 路径 | 说明 |
|------|------|------|
| 首页 | pages/index/index | 活动列表 + 分类筛选 |
| 活动详情 | pages/detail/detail | 活动详情 + 报名 |
| 发布活动 | pages/publish/publish | 创建活动表单 |
| 个人中心 | pages/me/me | 个人信息 + 我的活动 |
| 活动管理 | pages/myActivities/myActivities | 我发布/参与的活动列表 |

## TabBar 导航
- 首页（活动列表）
- 发现（分类浏览）
- 发布（创建活动）
- 我的（个人中心）

## 数据库设计（云开发）

### activities 集合
```json
{
  "_id": "自动生成",
  "title": "活动标题",
  "category": "square_dance | instrument | taichi | calligraphy | chorus | chess | hiking | other",
  "categoryName": "广场舞",
  "description": "活动描述",
  "date": "2024-01-15",
  "startTime": "09:00",
  "endTime": "11:00",
  "location": {
    "name": "人民公园广场",
    "address": "XX路XX号",
    "latitude": 0,
    "longitude": 0
  },
  "maxParticipants": 30,
  "currentParticipants": 5,
  "organizer": {
    "openid": "xxx",
    "nickName": "张阿姨",
    "avatarUrl": ""
  },
  "images": ["cloud://xxx"],
  "status": "open | full | ended | cancelled",
  "createTime": "Date",
  "updateTime": "Date"
}
```

### registrations 集合
```json
{
  "_id": "自动生成",
  "activityId": "活动ID",
  "openid": "用户openid",
  "nickName": "张三",
  "avatarUrl": "",
  "phone": "13800138000",
  "status": "registered | cancelled",
  "createTime": "Date"
}
```

### users 集合
```json
{
  "_id": "自动生成",
  "openid": "xxx",
  "nickName": "张三",
  "avatarUrl": "",
  "phone": "",
  "gender": 0,
  "createTime": "Date"
}
```

## 云函数设计

### activityFunctions
- `createActivity` - 创建活动
- `getActivityList` - 获取活动列表（支持分类筛选、分页）
- `getActivityDetail` - 获取活动详情
- `registerActivity` - 报名活动
- `cancelRegistration` - 取消报名
- `getMyActivities` - 获取我发布的活动
- `getMyRegistrations` - 获取我报名的活动
- `updateActivity` - 更新活动信息
- `deleteActivity` - 删除/取消活动

## UI 设计原则（适老化）
- 字体最小 28rpx，正文 32-36rpx，标题 40-48rpx
- 按钮大且明显，最小高度 88rpx
- 高对比度配色
- 简洁的操作流程，减少层级
- 大图标 + 文字标签
