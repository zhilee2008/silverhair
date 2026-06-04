// pages/discover/discover.js
const mockData = require('../../mockData.js');

Page({
  data: {
    categories: [
      { key: 'square_dance', name: '广场舞', icon: '💃', color: '#D4515E', gradient: 'linear-gradient(135deg, #FFE8E3, #FFD4CC)', count: 0 },
      { key: 'instrument', name: '乐器学习', icon: '🎵', color: '#4285F4', gradient: 'linear-gradient(135deg, #E3F0FF, #CCE5FF)', count: 0 },
      { key: 'taichi', name: '太极养生', icon: '🥋', color: '#4CAF50', gradient: 'linear-gradient(135deg, #E8F5E9, #C8E6C9)', count: 0 },
      { key: 'calligraphy', name: '书法绘画', icon: '🎨', color: '#9C27B0', gradient: 'linear-gradient(135deg, #F3E5F5, #E1BEE7)', count: 0 },
      { key: 'chorus', name: '合唱朗诵', icon: '🎤', color: '#FF9800', gradient: 'linear-gradient(135deg, #FFF3E0, #FFE0B2)', count: 0 },
      { key: 'chess', name: '棋牌娱乐', icon: '♟️', color: '#795548', gradient: 'linear-gradient(135deg, #EFEBE9, #D7CCC8)', count: 0 },
      { key: 'hiking', name: '户外徒步', icon: '🚶', color: '#009688', gradient: 'linear-gradient(135deg, #E0F2F1, #B2DFDB)', count: 0 },
      { key: 'other', name: '更多精彩', icon: '🎯', color: '#607D8B', gradient: 'linear-gradient(135deg, #ECEFF1, #CFD8DC)', count: 0 },
    ],
    recommendList: [],
  },

  onLoad() {
    this.loadRecommend();
    this.loadCategoryCounts();
  },

  loadRecommend() {
    if (mockData.isMock()) {
      const list = mockData.mockHotActivities.slice(0, 3);
      this.setData({ recommendList: list });
    }
  },

  loadCategoryCounts() {
    if (mockData.isMock()) {
      const categories = this.data.categories.map(cat => {
        const count = mockData.mockActivities.filter(a => a.category === cat.key).length;
        return { ...cat, count };
      });
      this.setData({ categories });
    }
  },

  onCategoryTap(e) {
    const { key } = e.currentTarget.dataset;
    // 跳转到首页并筛选该分类
    wx.switchTab({
      url: '/pages/index/index',
    });
  },

  onActivityTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
  },
});
