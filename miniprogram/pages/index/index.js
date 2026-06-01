// pages/index/index.js
const mockData = require('../../mockData.js');

Page({
  data: {
    categories: [
      { key: 'all', name: '全部' },
      { key: 'square_dance', name: '广场舞' },
      { key: 'instrument', name: '乐器学习' },
      { key: 'taichi', name: '太极养生' },
      { key: 'calligraphy', name: '书法绘画' },
      { key: 'chorus', name: '合唱朗诵' },
      { key: 'chess', name: '棋牌娱乐' },
      { key: 'hiking', name: '户外徒步' },
      { key: 'other', name: '其他' },
    ],
    currentCategory: 'all',
    activityList: [],
    loading: true,
    page: 0,
    pageSize: 10,
    hasMore: true,
    isMock: false,
  },

  onLoad() {
    this.setData({ isMock: mockData.isMock() });
    this.loadActivities();
  },

  onPullDownRefresh() {
    this.setData({ page: 0, hasMore: true, activityList: [] });
    this.loadActivities().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadActivities();
    }
  },

  // 切换分类
  onCategoryTap(e) {
    const key = e.currentTarget.dataset.key;
    if (key === this.data.currentCategory) return;
    this.setData({
      currentCategory: key,
      page: 0,
      hasMore: true,
      activityList: [],
    });
    this.loadActivities();
  },

  // 加载活动列表
  loadActivities() {
    this.setData({ loading: true });
    const { currentCategory, isMock } = this.data;

    // 模拟模式：使用本地数据
    if (isMock) {
      return new Promise(resolve => {
        setTimeout(() => {
          const list = mockData.getMockActivities(currentCategory);
          this.setData({
            activityList: list,
            loading: false,
            hasMore: false,
          });
          resolve();
        }, 300); // 模拟网络延迟
      });
    }

    // 正式模式：调用云函数
    const { page, pageSize } = this.data;
    return wx.cloud.callFunction({
      name: 'activityFunctions',
      data: {
        type: 'getActivityList',
        category: currentCategory === 'all' ? '' : currentCategory,
        page: page,
        pageSize: pageSize,
      }
    }).then(res => {
      const list = res.result.data || [];
      const newList = this.data.activityList.concat(list);
      this.setData({
        activityList: newList,
        loading: false,
        hasMore: list.length === pageSize,
        page: page + 1,
      });
    }).catch(err => {
      console.error('加载活动失败:', err);
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败，请重试', icon: 'none' });
    });
  },

  // 跳转活动详情
  onActivityTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`,
    });
  },

  // 跳转发布页
  onPublishTap() {
    wx.switchTab({
      url: '/pages/publish/publish',
    });
  },
});
