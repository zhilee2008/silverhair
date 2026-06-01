// pages/me/me.js
const mockData = require('../../mockData.js');

Page({
  data: {
    isMock: false,
    userInfo: null,
    hasNickName: false,
    hasAvatar: false,
    hasPhone: false,
    phoneNumber: '',
    nickName: '',
    avatarUrl: '',
    menuList: [
      { key: 'myPublished', name: '我发布的活动', icon: '📋', desc: '管理你发布的活动' },
      { key: 'myRegistered', name: '我参与的活动', icon: '✅', desc: '查看已报名的活动' },
    ],
  },

  onLoad() {
    this.setData({ isMock: mockData.isMock() });
    this.loadUserInfo();
  },

  onShow() {
    this.loadUserInfo();
  },

  // 从缓存加载用户信息
  loadUserInfo() {
    const nickName = wx.getStorageSync('nickName') || '';
    const avatarUrl = wx.getStorageSync('avatarUrl') || '';
    const phoneNumber = wx.getStorageSync('phoneNumber') || '';

    this.setData({
      nickName,
      avatarUrl,
      phoneNumber,
      hasNickName: !!nickName,
      hasAvatar: !!avatarUrl,
      hasPhone: !!phoneNumber,
    });

    // 同步到 globalData
    const app = getApp();
    app.globalData.userInfo = {
      nickName,
      avatarUrl,
      phoneNumber,
    };
  },

  // ==================== 头像选择 ====================
  onChooseAvatar(e) {
    const avatarUrl = e.detail.avatarUrl;
    if (!avatarUrl) return;

    this.setData({ avatarUrl, hasAvatar: true });
    wx.setStorageSync('avatarUrl', avatarUrl);

    // 如果有云环境，上传头像到云存储
    if (!mockData.isMock()) {
      this.uploadAvatar(avatarUrl);
    }
  },

  // 上传头像到云存储
  uploadAvatar(tempUrl) {
    const cloudPath = `avatars/${getApp().globalData.openid}_${Date.now()}.jpg`;
    wx.cloud.uploadFile({
      cloudPath,
      filePath: tempUrl,
    }).then(res => {
      const fileID = res.fileID;
      this.setData({ avatarUrl: fileID });
      wx.setStorageSync('avatarUrl', fileID);
      // 更新数据库
      this.saveToCloud();
    }).catch(err => {
      console.error('上传头像失败:', err);
    });
  },

  // ==================== 昵称输入 ====================
  onNickNameInput(e) {
    // 使用昵称输入组件的实时输入
  },

  onNickNameChange(e) {
    const nickName = e.detail.value;
    if (!nickName || !nickName.trim()) return;

    this.setData({ nickName: nickName.trim(), hasNickName: true });
    wx.setStorageSync('nickName', nickName.trim());
    this.saveToCloud();
  },

  // ==================== 手机号获取 ====================
  // 模拟模式获取手机号
  onMockGetPhone() {
    wx.showModal({
      title: '获取手机号',
      content: '当前为预览模式，将模拟获取手机号。\n正式使用需开通云开发并在真机上通过微信授权获取。',
      confirmText: '模拟获取',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            phoneNumber: '138****8888',
            hasPhone: true,
          });
          wx.setStorageSync('phoneNumber', '138****8888');
          wx.showToast({ title: '获取成功', icon: 'success' });
        }
      }
    });
  },

  // 真机通过 button 获取手机号回调（正式模式）
  onGetPhoneNumber(e) {
    if (e.detail.errMsg !== 'getPhoneNumber:ok') {
      console.log('用户拒绝授权手机号');
      return;
    }

    const { code } = e.detail;
    if (!code) return;

    // 模拟模式
    if (mockData.isMock()) {
      this.setData({
        phoneNumber: '138****8888',
        hasPhone: true,
      });
      wx.setStorageSync('phoneNumber', '138****8888');
      wx.showToast({ title: '手机号获取成功', icon: 'success' });
      return;
    }

    // 正式模式：通过云函数解密手机号
    wx.cloud.callFunction({
      name: 'activityFunctions',
      data: {
        type: 'getPhoneNumber',
        code: code,
      }
    }).then(res => {
      if (res.result.success && res.result.phoneNumber) {
        const phone = res.result.phoneNumber;
        // 脱敏显示
        const masked = phone.substring(0, 3) + '****' + phone.substring(7);
        this.setData({
          phoneNumber: masked,
          hasPhone: true,
        });
        wx.setStorageSync('phoneNumber', masked);
        wx.showToast({ title: '手机号获取成功', icon: 'success' });
        this.saveToCloud();
      } else {
        wx.showToast({ title: '获取失败，请重试', icon: 'none' });
      }
    }).catch(err => {
      console.error('获取手机号失败:', err);
      wx.showToast({ title: '获取失败', icon: 'none' });
    });
  },

  // ==================== 保存到云端 ====================
  saveToCloud() {
    if (mockData.isMock()) return;

    const { nickName, avatarUrl, phoneNumber } = this.data;
    wx.cloud.callFunction({
      name: 'activityFunctions',
      data: {
        type: 'updateUserProfile',
        userInfo: { nickName, avatarUrl, phoneNumber },
      }
    }).catch(err => {
      console.error('保存用户信息失败:', err);
    });
  },

  // ==================== 菜单点击 ====================
  onMenuTap(e) {
    const { key } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/myActivities/myActivities?type=${key}`,
    });
  },
});
