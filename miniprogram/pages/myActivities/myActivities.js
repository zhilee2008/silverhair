// pages/myActivities/myActivities.js
const mockData = require('../../mockData.js');

Page({
  data: {
    type: 'myPublished',
    activityList: [],
    loading: true,
  },

  onLoad(options) {
    const type = options.type || 'myPublished';
    this.setData({ type });
    wx.setNavigationBarTitle({
      title: type === 'myPublished' ? '我发布的活动' : '我参与的活动'
    });
    this.loadActivities();
  },

  loadActivities() {
    this.setData({ loading: true });

    // 模拟模式
    if (mockData.isMock()) {
      setTimeout(() => {
        const list = this.data.type === 'myPublished'
          ? mockData.getMockMyActivities()
          : mockData.getMockMyRegistrations();
        this.setData({ activityList: list, loading: false });
      }, 300);
      return;
    }

    // 正式模式
    const fnType = this.data.type === 'myPublished' ? 'getMyActivities' : 'getMyRegistrations';
    wx.cloud.callFunction({
      name: 'activityFunctions',
      data: { type: fnType }
    }).then(res => {
      this.setData({
        activityList: res.result.data || [],
        loading: false,
      });
    }).catch(err => {
      console.error('加载失败:', err);
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    });
  },

  onActivityTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`,
    });
  },
});
