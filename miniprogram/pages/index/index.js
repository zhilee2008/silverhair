// pages/index/index.js
const mockData = require('../../mockData.js');

Page({
  data: {
    banners: [],
    categories: [
      { key: 'all', name: '全部', icon: '🔥' },
      { key: 'square_dance', name: '广场舞', icon: '💃' },
      { key: 'instrument', name: '乐器', icon: '🎵' },
      { key: 'taichi', name: '太极', icon: '🥋' },
      { key: 'calligraphy', name: '书画', icon: '🎨' },
      { key: 'chorus', name: '合唱', icon: '🎤' },
      { key: 'chess', name: '棋牌', icon: '♟️' },
      { key: 'hiking', name: '徒步', icon: '🚶' },
    ],
    currentCategory: 'all',
    hotActivities: [],
    activityList: [],
    loading: true,
    page: 0,
    pageSize: 10,
    hasMore: true,
    isMock: false,
  },

  onLoad() {
    this.setData({ isMock: mockData.isMock() });
    this.loadBanners();
    this.loadHotActivities();
    this.loadActivities();
  },

  onPullDownRefresh() {
    this.setData({ page: 0, hasMore: true, activityList: [] });
    Promise.all([
      this.loadBanners(),
      this.loadHotActivities(),
      this.loadActivities(),
    ]).then(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadActivities();
    }
  },

  loadBanners() {
    if (this.data.isMock) {
      this.setData({ banners: mockData.mockBanners });
      return Promise.resolve();
    }
    // 正式模式可从云数据库加载
    return Promise.resolve();
  },

  loadHotActivities() {
    if (this.data.isMock) {
      const hot = mockData.mockHotActivities.slice(0, 4);
      this.setData({ hotActivities: hot });
      return Promise.resolve();
    }
    return Promise.resolve();
  },

  onCategoryTap(e) {
    const key = e.currentTarget.dataset.key;
    if (key === this.data.currentCategory) return;
    this.setData({ currentCategory: key, page: 0, hasMore: true, activityList: [] });
    this.loadActivities();
  },

  loadActivities() {
    this.setData({ loading: true });
    const { currentCategory, isMock } = this.data;

    if (isMock) {
      return new Promise(resolve => {
        setTimeout(() => {
          const list = mockData.getMockActivities(currentCategory);
          this.setData({ activityList: list, loading: false, hasMore: false });
          resolve();
        }, 300);
      });
    }

    const { page, pageSize } = this.data;
    return wx.cloud.callFunction({
      name: 'activityFunctions',
      data: { type: 'getActivityList', category: currentCategory === 'all' ? '' : currentCategory, page, pageSize }
    }).then(res => {
      const list = res.result.data || [];
      this.setData({
        activityList: this.data.activityList.concat(list),
        loading: false,
        hasMore: list.length === pageSize,
        page: page + 1,
      });
    }).catch(err => {
      console.error('加载活动失败:', err);
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    });
  },

  onActivityTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
  },

  onBannerTap(e) {
    const index = e.currentTarget.dataset.index;
    // 轮播点击可跳转活动详情
    if (this.data.isMock && index < this.data.hotActivities.length) {
      wx.navigateTo({ url: `/pages/detail/detail?id=${this.data.hotActivities[index]._id}` });
    }
  },

  onSearchTap() {
    wx.showToast({ title: '搜索功能开发中', icon: 'none' });
  },
});
