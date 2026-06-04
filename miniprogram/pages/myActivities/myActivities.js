// pages/myActivities/myActivities.js
const mockData = require('../../mockData.js');

Page({
  data: {
    tabs: [
      { key: 'myPublished', name: '我发布的' },
      { key: 'myRegistered', name: '我参与的' },
    ],
    currentTab: 'myPublished',
    activityList: [],
    loading: true,
  },

  onLoad(options) {
    const currentTab = options.type || 'myPublished';
    this.setData({ currentTab });
    this.loadActivities();
  },

  onTabTap(e) {
    const key = e.currentTarget.dataset.key;
    if (key === this.data.currentTab) return;
    this.setData({ currentTab: key, activityList: [], loading: true });
    this.loadActivities();
  },

  loadActivities() {
    this.setData({ loading: true });
    if (mockData.isMock()) {
      setTimeout(() => {
        const list = this.data.currentTab === 'myPublished'
          ? mockData.getMockMyActivities()
          : mockData.getMockMyRegistrations();
        this.setData({ activityList: list, loading: false });
      }, 300);
      return;
    }

    const fnType = this.data.currentTab === 'myPublished' ? 'getMyActivities' : 'getMyRegistrations';
    wx.cloud.callFunction({
      name: 'activityFunctions',
      data: { type: fnType }
    }).then(res => {
      this.setData({ activityList: res.result.data || [], loading: false });
    }).catch(err => {
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    });
  },

  onActivityTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
  },
});
