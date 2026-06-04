// pages/publish/publish.js
Page({
  data: {
    categories: [
      { key: 'square_dance', name: '广场舞' },
      { key: 'instrument', name: '乐器学习' },
      { key: 'taichi', name: '太极养生' },
      { key: 'calligraphy', name: '书法绘画' },
      { key: 'chorus', name: '合唱朗诵' },
      { key: 'chess', name: '棋牌娱乐' },
      { key: 'hiking', name: '户外徒步' },
      { key: 'other', name: '其他' },
    ],
    formData: {
      title: '',
      category: '',
      categoryName: '',
      description: '',
      date: '',
      startTime: '',
      endTime: '',
      maxParticipants: 20,
      location: {
        name: '',
        address: '',
        latitude: 0,
        longitude: 0,
      },
      images: [],
    },
    submitting: false,
  },

  // 选择分类
  onCategoryTap(e) {
    const { key, name } = e.currentTarget.dataset;
    this.setData({
      'formData.category': key,
      'formData.categoryName': name,
    });
  },

  // 输入标题
  onTitleInput(e) {
    this.setData({ 'formData.title': e.detail.value });
  },

  // 输入描述
  onDescriptionInput(e) {
    this.setData({ 'formData.description': e.detail.value });
  },

  // 选择日期
  onDateChange(e) {
    this.setData({ 'formData.date': e.detail.value });
  },

  // 选择时间
  onStartTimeChange(e) {
    this.setData({ 'formData.startTime': e.detail.value });
  },

  onEndTimeChange(e) {
    this.setData({ 'formData.endTime': e.detail.value });
  },

  // 输入人数
  onParticipantsInput(e) {
    this.setData({ 'formData.maxParticipants': Number(e.detail.value) || 20 });
  },

  // 增加/减少人数
  onIncrease() {
    const val = Math.min(999, (this.data.formData.maxParticipants || 20) + 5);
    this.setData({ 'formData.maxParticipants': val });
  },

  onDecrease() {
    const val = Math.max(1, (this.data.formData.maxParticipants || 20) - 5);
    this.setData({ 'formData.maxParticipants': val });
  },

  // 选择地点
  onChooseLocation() {
    wx.chooseLocation({
      success: (res) => {
        this.setData({
          'formData.location.name': res.name,
          'formData.location.address': res.address,
          'formData.location.latitude': res.latitude,
          'formData.location.longitude': res.longitude,
        });
      },
      fail: (err) => {
        if (err.errMsg.indexOf('auth deny') !== -1 || err.errMsg.indexOf('authorize') !== -1) {
          wx.showModal({
            title: '提示',
            content: '需要授权位置信息才能选择活动地点',
            confirmText: '去设置',
            success: (modalRes) => {
              if (modalRes.confirm) {
                wx.openSetting();
              }
            }
          });
        }
      }
    });
  },

  // 选择图片
  onChooseImage() {
    const currentImages = this.data.formData.images;
    const remaining = 9 - currentImages.length;
    if (remaining <= 0) {
      wx.showToast({ title: '最多上传9张图片', icon: 'none' });
      return;
    }

    wx.chooseMedia({
      count: remaining,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const newImages = res.tempFiles.map(f => f.tempFilePath);
        this.setData({
          'formData.images': currentImages.concat(newImages),
        });
      }
    });
  },

  // 删除图片
  onDeleteImage(e) {
    const index = e.currentTarget.dataset.index;
    const images = this.data.formData.images;
    images.splice(index, 1);
    this.setData({ 'formData.images': images });
  },

  // 预览图片
  onPreviewImage(e) {
    const current = e.currentTarget.dataset.src;
    wx.previewImage({
      current: current,
      urls: this.data.formData.images,
    });
  },

  // 表单验证
  validateForm() {
    const { formData } = this.data;
    if (!formData.title.trim()) {
      wx.showToast({ title: '请输入活动标题', icon: 'none' });
      return false;
    }
    if (!formData.category) {
      wx.showToast({ title: '请选择活动分类', icon: 'none' });
      return false;
    }
    if (!formData.date) {
      wx.showToast({ title: '请选择活动日期', icon: 'none' });
      return false;
    }
    if (!formData.startTime || !formData.endTime) {
      wx.showToast({ title: '请选择活动时间', icon: 'none' });
      return false;
    }
    if (!formData.location.name) {
      wx.showToast({ title: '请选择活动地点', icon: 'none' });
      return false;
    }
    if (!formData.maxParticipants || formData.maxParticipants < 1) {
      wx.showToast({ title: '请输入参与人数上限', icon: 'none' });
      return false;
    }
    return true;
  },

  // 提交发布
  onSubmit() {
    if (!this.validateForm()) return;
    if (this.data.submitting) return;

    // 模拟模式下提示
    const mockData = require('../../mockData.js');
    if (mockData.isMock()) {
      wx.showModal({
        title: '提示',
        content: '当前为预览模式，开通云开发后即可正常发布活动。\n\n请在 app.js 中填入云环境 ID，并在云开发控制台创建数据库集合。',
        showCancel: false,
      });
      return;
    }

    this.setData({ submitting: true });
    wx.showLoading({ title: '发布中...' });

    const { formData } = this.data;

    // 先上传图片
    this.uploadImages().then(imageFileIds => {
      // 调用云函数创建活动
      return wx.cloud.callFunction({
        name: 'activityFunctions',
        data: {
          type: 'createActivity',
          title: formData.title,
          category: formData.category,
          categoryName: formData.categoryName,
          description: formData.description,
          date: formData.date,
          startTime: formData.startTime,
          endTime: formData.endTime,
          maxParticipants: formData.maxParticipants,
          location: formData.location,
          images: imageFileIds,
        }
      });
    }).then(res => {
      wx.hideLoading();
      this.setData({ submitting: false });
      if (res.result.success) {
        wx.showToast({ title: '发布成功！', icon: 'success' });
        setTimeout(() => {
          wx.switchTab({ url: '/pages/index/index' });
        }, 1500);
      } else {
        wx.showToast({ title: res.result.message || '发布失败', icon: 'none' });
      }
    }).catch(err => {
      wx.hideLoading();
      this.setData({ submitting: false });
      console.error('发布失败:', err);
      wx.showToast({ title: '发布失败，请重试', icon: 'none' });
    });
  },

  // 上传图片到云存储
  uploadImages() {
    const { images } = this.data.formData;
    if (!images || images.length === 0) return Promise.resolve([]);

    const uploadTasks = images.map((filePath, index) => {
      const cloudPath = `activity_images/${Date.now()}_${index}.jpg`;
      return wx.cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: filePath,
      }).then(res => res.fileID);
    });

    return Promise.all(uploadTasks);
  },
});
