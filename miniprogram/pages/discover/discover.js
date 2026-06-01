// pages/discover/discover.js
Page({
  data: {
    categories: [
      { key: 'square_dance', name: '广场舞', icon: '💃', desc: '热门广场舞活动' },
      { key: 'instrument', name: '乐器学习', icon: '🎵', desc: '二胡、葫芦丝、手风琴...' },
      { key: 'taichi', name: '太极养生', icon: '🥋', desc: '太极拳、八段锦、气功' },
      { key: 'calligraphy', name: '书法绘画', icon: '🎨', desc: '书法、国画、水彩' },
      { key: 'chorus', name: '合唱朗诵', icon: '🎤', desc: '合唱团、诗歌朗诵' },
      { key: 'chess', name: '棋牌娱乐', icon: '♟️', desc: '象棋、围棋、扑克' },
      { key: 'hiking', name: '户外徒步', icon: '🚶', desc: '近郊游、公园散步' },
      { key: 'other', name: '更多活动', icon: '🎯', desc: '更多精彩活动等你来' },
    ],
  },

  onCategoryTap(e) {
    const { key, name } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/index/index?category=${key}&categoryName=${name}`,
    });
  },
});
