// app.js
App({
  onLaunch: function () {
    // 云开发环境 ID（填入你的云环境 ID 后可正常使用全部功能）
    // 留空则使用模拟数据模式，可以预览界面效果
    this.globalData = {
      env: "",
    };

    if (!wx.cloud) {
      console.warn("当前基础库版本不支持云开发，将使用模拟数据");
      return;
    }

    try {
      wx.cloud.init({
        env: this.globalData.env || undefined,
        traceUser: true,
      });

      // 只有配置了 env 才获取 openid
      if (this.globalData.env) {
        this.getOpenId();
      } else {
        console.log("📝 未配置云环境，运行在预览模式");
      }
    } catch (e) {
      console.warn("云开发初始化失败，将使用模拟数据:", e);
    }
  },

  // 获取用户 openid
  getOpenId() {
    if (this.globalData.openid) {
      return Promise.resolve(this.globalData.openid);
    }
    return wx.cloud.callFunction({
      name: 'activityFunctions',
      data: { type: 'getOpenId' }
    }).then(res => {
      this.globalData.openid = res.result.openid;
      return res.result.openid;
    }).catch(err => {
      console.error('获取 openid 失败:', err);
      return null;
    });
  },

  globalData: {
    openid: null,
    userInfo: null,
  }
});
