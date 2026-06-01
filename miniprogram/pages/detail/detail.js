// pages/detail/detail.js
const mockData = require('../../mockData.js');

Page({
  data: {
    activity: null,
    isOrganizer: false,
    isRegistered: false,
    registering: false,
    isMock: false,
  },

  onLoad(options) {
    const app = getApp();
    const isMock = mockData.isMock();
    this.setData({ isMock, openid: app.globalData.openid });

    if (options.id) {
      this.loadDetail(options.id);
    }
  },

  // 加载活动详情
  loadDetail(id) {
    wx.showLoading({ title: '加载中...' });

    const { isMock } = this.data;

    // 模拟模式
    if (isMock) {
      setTimeout(() => {
        wx.hideLoading();
        const activity = mockData.getMockDetail(id);
        if (!activity) {
          wx.showToast({ title: '活动不存在', icon: 'none' });
          setTimeout(() => wx.navigateBack(), 1500);
          return;
        }
        this.setData({
          activity,
          isOrganizer: false,
          isRegistered: false,
        });
        wx.setNavigationBarTitle({ title: activity.title });
      }, 300);
      return;
    }

    // 正式模式
    wx.cloud.callFunction({
      name: 'activityFunctions',
      data: {
        type: 'getActivityDetail',
        activityId: id,
      }
    }).then(res => {
      wx.hideLoading();
      const activity = res.result.data;
      if (!activity) {
        wx.showToast({ title: '活动不存在', icon: 'none' });
        setTimeout(() => wx.navigateBack(), 1500);
        return;
      }
      const app = getApp();
      const isOrganizer = activity.organizer && activity.organizer.openid === app.globalData.openid;
      const isRegistered = res.result.isRegistered || false;
      this.setData({ activity, isOrganizer, isRegistered });
      wx.setNavigationBarTitle({ title: activity.title });
    }).catch(err => {
      wx.hideLoading();
      console.error('加载详情失败:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    });
  },

  // 报名参加
  onRegister() {
    const { activity, registering, isMock } = this.data;
    if (registering || !activity) return;

    if (activity.status === 'full') {
      wx.showToast({ title: '活动已满员', icon: 'none' });
      return;
    }
    if (activity.status === 'ended') {
      wx.showToast({ title: '活动已结束', icon: 'none' });
      return;
    }
    if (activity.status === 'cancelled') {
      wx.showToast({ title: '活动已取消', icon: 'none' });
      return;
    }

    // 模拟模式
    if (isMock) {
      wx.showLoading({ title: '报名中...' });
      setTimeout(() => {
        wx.hideLoading();
        activity.currentParticipants += 1;
        if (activity.currentParticipants >= activity.maxParticipants) {
          activity.status = 'full';
        }
        this.setData({
          activity,
          isRegistered: true,
        });
        wx.showToast({ title: '报名成功！🎉', icon: 'success' });
      }, 500);
      return;
    }

    // 正式模式
    this.setData({ registering: true });
    wx.cloud.callFunction({
      name: 'activityFunctions',
      data: {
        type: 'registerActivity',
        activityId: activity._id,
      }
    }).then(res => {
      this.setData({ registering: false });
      if (res.result.success) {
        wx.showToast({ title: '报名成功！', icon: 'success' });
        this.loadDetail(activity._id);
      } else {
        wx.showToast({ title: res.result.message || '报名失败', icon: 'none' });
      }
    }).catch(err => {
      this.setData({ registering: false });
      console.error('报名失败:', err);
      wx.showToast({ title: '报名失败，请重试', icon: 'none' });
    });
  },

  // 取消报名
  onCancelRegister() {
    const { activity, isMock } = this.data;

    // 模拟模式
    if (isMock) {
      activity.currentParticipants = Math.max(0, activity.currentParticipants - 1);
      if (activity.status === 'full') activity.status = 'open';
      this.setData({ activity, isRegistered: false });
      wx.showToast({ title: '已取消报名', icon: 'success' });
      return;
    }

    // 正式模式
    wx.showModal({
      title: '确认取消',
      content: '确定要取消报名吗？',
      success: (res) => {
        if (res.confirm) {
          wx.cloud.callFunction({
            name: 'activityFunctions',
            data: {
              type: 'cancelRegistration',
              activityId: activity._id,
            }
          }).then(res => {
            if (res.result.success) {
              wx.showToast({ title: '已取消报名', icon: 'success' });
              this.loadDetail(activity._id);
            }
          });
        }
      }
    });
  },

  // 取消活动（组织者）
  onCancelActivity() {
    const { activity } = this.data;
    wx.showModal({
      title: '确认取消',
      content: '确定要取消这个活动吗？',
      success: (res) => {
        if (res.confirm) {
          if (this.data.isMock) {
            activity.status = 'cancelled';
            this.setData({ activity });
            wx.showToast({ title: '活动已取消', icon: 'success' });
            return;
          }
          wx.cloud.callFunction({
            name: 'activityFunctions',
            data: {
              type: 'updateActivity',
              activityId: activity._id,
              status: 'cancelled',
            }
          }).then(res => {
            if (res.result.success) {
              wx.showToast({ title: '活动已取消', icon: 'success' });
              this.loadDetail(activity._id);
            }
          });
        }
      }
    });
  },

  // 查看地图
  onViewMap() {
    const { activity } = this.data;
    const location = activity.location;
    if (location && location.latitude && location.longitude) {
      wx.openLocation({
        latitude: location.latitude,
        longitude: location.longitude,
        name: location.name,
        address: location.address,
        scale: 15,
      });
    } else {
      wx.showToast({ title: '暂无位置信息', icon: 'none' });
    }
  },

  // 分享
  onShareAppMessage() {
    const { activity } = this.data;
    return {
      title: activity.title,
      path: `/pages/detail/detail?id=${activity._id}`,
    };
  },
});
