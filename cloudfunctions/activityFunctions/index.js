const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;

// ==================== 获取 OpenId ====================
const getOpenId = async (event, context) => {
  const wxContext = cloud.getWXContext();
  return {
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID,
  };
};

// ==================== 创建活动 ====================
const createActivity = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  const {
    title, category, categoryName, description,
    date, startTime, endTime,
    maxParticipants, location, images
  } = event;

  // 参数校验
  if (!title || !category || !date || !startTime || !endTime || !location || !location.name) {
    return { success: false, message: '参数不完整' };
  }

  try {
    // 获取用户昵称（如果有保存过）
    let nickName = '热心邻居';
    let avatarUrl = '';
    try {
      const userRes = await db.collection('users').where({ openid }).get();
      if (userRes.data.length > 0) {
        nickName = userRes.data[0].nickName || nickName;
        avatarUrl = userRes.data[0].avatarUrl || avatarUrl;
      }
    } catch (e) { /* users 集合可能不存在 */ }

    const result = await db.collection('activities').add({
      data: {
        title,
        category,
        categoryName: categoryName || category,
        description: description || '',
        date,
        startTime,
        endTime,
        location,
        maxParticipants: Number(maxParticipants) || 20,
        currentParticipants: 0,
        organizer: {
          openid,
          nickName,
          avatarUrl,
        },
        images: images || [],
        status: 'open',
        createTime: db.serverDate(),
        updateTime: db.serverDate(),
      }
    });

    return { success: true, data: result._id };
  } catch (e) {
    console.error('创建活动失败:', e);
    return { success: false, message: '创建活动失败' };
  }
};

// ==================== 获取活动列表 ====================
const getActivityList = async (event, context) => {
  const { category, page = 0, pageSize = 10 } = event;
  const skip = page * pageSize;

  try {
    let query = db.collection('activities')
      .where({
        status: _.in(['open', 'full']),
      });

    // 分类筛选
    if (category) {
      query = db.collection('activities').where({
        category: category,
        status: _.in(['open', 'full']),
      });
    }

    const result = await query
      .orderBy('createTime', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get();

    return { success: true, data: result.data };
  } catch (e) {
    console.error('获取活动列表失败:', e);
    return { success: false, data: [] };
  }
};

// ==================== 获取活动详情 ====================
const getActivityDetail = async (event, context) => {
  const { activityId } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  if (!activityId) {
    return { success: false, message: '缺少活动ID' };
  }

  try {
    const res = await db.collection('activities').doc(activityId).get();

    // 检查当前用户是否已报名
    let isRegistered = false;
    try {
      const regRes = await db.collection('registrations').where({
        activityId: activityId,
        openid: openid,
        status: 'registered',
      }).count();
      isRegistered = regRes.total > 0;
    } catch (e) { /* registrations 集合可能不存在 */ }

    return { success: true, data: res.data, isRegistered };
  } catch (e) {
    console.error('获取活动详情失败:', e);
    return { success: false, message: '活动不存在' };
  }
};

// ==================== 报名活动 ====================
const registerActivity = async (event, context) => {
  const { activityId } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  if (!activityId) {
    return { success: false, message: '缺少活动ID' };
  }

  try {
    // 获取活动信息
    const activityRes = await db.collection('activities').doc(activityId).get();
    const activity = activityRes.data;

    // 检查活动状态
    if (activity.status !== 'open') {
      return { success: false, message: '活动不在报名状态' };
    }

    // 检查是否已报名
    const existReg = await db.collection('registrations').where({
      activityId: activityId,
      openid: openid,
      status: 'registered',
    }).count();

    if (existReg.total > 0) {
      return { success: false, message: '你已经报名过了' };
    }

    // 检查人数是否已满
    if (activity.currentParticipants >= activity.maxParticipants) {
      return { success: false, message: '活动人数已满' };
    }

    // 获取用户信息
    let nickName = '用户';
    let avatarUrl = '';
    try {
      const userRes = await db.collection('users').where({ openid }).get();
      if (userRes.data.length > 0) {
        nickName = userRes.data[0].nickName || nickName;
        avatarUrl = userRes.data[0].avatarUrl || avatarUrl;
      }
    } catch (e) { /* ignore */ }

    // 创建报名记录
    await db.collection('registrations').add({
      data: {
        activityId,
        openid,
        nickName,
        avatarUrl,
        status: 'registered',
        createTime: db.serverDate(),
      }
    });

    // 更新活动参与人数
    const newCount = activity.currentParticipants + 1;
    const updateData = {
      currentParticipants: newCount,
      updateTime: db.serverDate(),
    };

    // 如果达到上限，更新状态
    if (newCount >= activity.maxParticipants) {
      updateData.status = 'full';
    }

    await db.collection('activities').doc(activityId).update({
      data: updateData,
    });

    return { success: true };
  } catch (e) {
    console.error('报名失败:', e);
    return { success: false, message: '报名失败' };
  }
};

// ==================== 取消报名 ====================
const cancelRegistration = async (event, context) => {
  const { activityId } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  try {
    // 查找报名记录
    const regRes = await db.collection('registrations').where({
      activityId,
      openid,
      status: 'registered',
    }).get();

    if (regRes.data.length === 0) {
      return { success: false, message: '未找到报名记录' };
    }

    // 更新报名状态
    await db.collection('registrations').doc(regRes.data[0]._id).update({
      data: {
        status: 'cancelled',
      }
    });

    // 减少活动参与人数
    const activityRes = await db.collection('activities').doc(activityId).get();
    const newCount = Math.max(0, activityRes.data.currentParticipants - 1);

    const updateData = {
      currentParticipants: newCount,
      updateTime: db.serverDate(),
    };

    // 如果之前是满员，改回报名中
    if (activityRes.data.status === 'full') {
      updateData.status = 'open';
    }

    await db.collection('activities').doc(activityId).update({
      data: updateData,
    });

    return { success: true };
  } catch (e) {
    console.error('取消报名失败:', e);
    return { success: false, message: '取消报名失败' };
  }
};

// ==================== 获取我发布的活动 ====================
const getMyActivities = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  try {
    const result = await db.collection('activities')
      .where({ 'organizer.openid': openid })
      .orderBy('createTime', 'desc')
      .limit(50)
      .get();

    return { success: true, data: result.data };
  } catch (e) {
    console.error('获取我的活动失败:', e);
    return { success: false, data: [] };
  }
};

// ==================== 获取我报名的活动 ====================
const getMyRegistrations = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  try {
    // 获取报名记录
    const regRes = await db.collection('registrations')
      .where({
        openid,
        status: 'registered',
      })
      .orderBy('createTime', 'desc')
      .limit(50)
      .get();

    if (regRes.data.length === 0) {
      return { success: true, data: [] };
    }

    // 获取对应的活动详情
    const activityIds = regRes.data.map(r => r.activityId);
    const actRes = await db.collection('activities')
      .where({ _id: _.in(activityIds) })
      .get();

    return { success: true, data: actRes.data };
  } catch (e) {
    console.error('获取报名活动失败:', e);
    return { success: false, data: [] };
  }
};

// ==================== 更新活动 ====================
const updateActivity = async (event, context) => {
  const { activityId, status } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  try {
    // 验证是组织者
    const activity = await db.collection('activities').doc(activityId).get();
    if (activity.data.organizer.openid !== openid) {
      return { success: false, message: '无权操作' };
    }

    await db.collection('activities').doc(activityId).update({
      data: {
        status: status || 'open',
        updateTime: db.serverDate(),
      }
    });

    return { success: true };
  } catch (e) {
    console.error('更新活动失败:', e);
    return { success: false, message: '更新失败' };
  }
};

// ==================== 更新用户资料 ====================
const updateUserProfile = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { userInfo } = event;

  try {
    // 检查是否已存在
    const existUser = await db.collection('users').where({ openid }).get();

    if (existUser.data.length > 0) {
      // 更新
      await db.collection('users').doc(existUser.data[0]._id).update({
        data: {
          nickName: userInfo.nickName,
          avatarUrl: userInfo.avatarUrl,
          updateTime: db.serverDate(),
        }
      });
    } else {
      // 新增
      await db.collection('users').add({
        data: {
          openid,
          nickName: userInfo.nickName,
          avatarUrl: userInfo.avatarUrl,
          phone: '',
          gender: userInfo.gender || 0,
          createTime: db.serverDate(),
          updateTime: db.serverDate(),
        }
      });
    }

    return { success: true };
  } catch (e) {
    console.error('更新用户资料失败:', e);
    return { success: false, message: '更新失败' };
  }
};

// ==================== 获取手机号 ====================
const getPhoneNumber = async (event, context) => {
  const { code } = event;
  if (!code) {
    return { success: false, message: '缺少 code' };
  }

  try {
    // 通过云调用获取手机号
    const res = await cloud.openapi.phonenumber.getPhoneNumber({
      code: code,
    });

    if (res && res.phoneInfo && res.phoneInfo.phoneNumber) {
      return { success: true, phoneNumber: res.phoneInfo.phoneNumber };
    }
    return { success: false, message: '获取手机号失败' };
  } catch (e) {
    console.error('获取手机号失败:', e);
    return { success: false, message: '获取手机号失败' };
  }
};

// ==================== 云函数入口 ====================
exports.main = async (event, context) => {
  switch (event.type) {
    case 'getOpenId':
      return await getOpenId(event, context);
    case 'createActivity':
      return await createActivity(event, context);
    case 'getActivityList':
      return await getActivityList(event, context);
    case 'getActivityDetail':
      return await getActivityDetail(event, context);
    case 'registerActivity':
      return await registerActivity(event, context);
    case 'cancelRegistration':
      return await cancelRegistration(event, context);
    case 'getMyActivities':
      return await getMyActivities(event, context);
    case 'getMyRegistrations':
      return await getMyRegistrations(event, context);
    case 'updateActivity':
      return await updateActivity(event, context);
    case 'updateUserProfile':
      return await updateUserProfile(event, context);
    case 'getPhoneNumber':
      return await getPhoneNumber(event, context);
    default:
      return { success: false, message: '未知操作类型' };
  }
};
