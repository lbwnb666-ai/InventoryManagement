<template>
  <div class="login-container">
    
    <!-- 顶部区域 -->
    <div class="login-header">
      <div class="logo-area">
        <div class="lottie-box">
        <DotLottieVue
            style="height: 30%; width: 90%;"
            autoplay
            loop
            src="https://lottie.host/f92f6b6d-a5a1-4ba0-9c21-54deacbed398/D0BkfQ6C4N.lottie"
        />
        </div>
        <!-- <div class="system-logo">
          <span class="logo-icon">📦</span>
        </div> -->
        <h1 class="main-title">库存管理系统</h1>
        <p class="sub-title">高效管理 · 精准掌控</p>
      </div>
    </div>

    <!-- 登录表单 -->
    <div class="login-card">
      <div class="form-header">
        <h2 class="form-title">账号登录</h2>
        <p class="form-desc">请输入您的账号和密码</p>
      </div>

      <van-form @submit="onSubmit" class="login-form">
        <van-cell-group inset>
          <van-field
            v-model="form.userName"
            name="userName"
            label="账号"
            placeholder="请输入登录账号"
            :rules="[{ required: true, message: '请填写账号' }]"
            left-icon="user-o"
            clearable
          />
          <van-field
            v-model="form.password"
            type="password"
            name="password"
            label="密码"
            placeholder="请输入登录密码"
            :rules="[
              { required: true, message: '请填写密码' },
              { min: 6, message: '密码至少6位' }
            ]"
            left-icon="lock"
            clearable
          />
        </van-cell-group>

        <div class="btn-area">
          <van-button
            round
            block
            type="primary"
            native-type="submit"
            :loading="loading"
            class="login-btn"
            size="large"
          >
            {{ loading ? '登录中...' : '登录系统' }}
          </van-button>

          <div class="register-link">
            <span>没有账号？</span>
            <a href="javascript:void(0)" @click="showRegister = true">申请注册</a>
          </div>
        </div>

        <div v-if="errorMessage" class="error-message">
          <van-icon name="warning" class="error-icon" />
          {{ errorMessage }}
        </div>
      </van-form>
    </div>

    <!-- 注册模态框 -->
    <van-dialog
      v-model:show="showRegister"
      title="账号注册"
      show-cancel-button
      cancel-button-text="取消"
      confirm-button-text="注册"
      @confirm="onRegisterSubmit"
      class="register-dialog"
    >
      <div class="dialog-content">
        <p class="dialog-desc">请联系管理员获取邀请码完成注册</p>
        
        <van-cell-group inset>
          <van-field
            v-model="registerForm.nickname"
            label="用户昵称"
            placeholder="请输入您的昵称"
            :rules="[{ required: true, message: '请输入昵称' }]"
            left-icon="friends-o"
          />
          <van-field
            v-model="registerForm.account"
            label="登录账号"
            placeholder="设置登录账号"
            :rules="[{ required: true, message: '请输入账号' }]"
            left-icon="user-o"
          />
          <van-field
            v-model="registerForm.password"
            type="password"
            label="登录密码"
            placeholder="设置登录密码（至少6位）"
            :rules="[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6位' }
            ]"
            left-icon="lock"
          />
          <van-field
            v-model="registerForm.inviteCode"
            label="邀请码"
            placeholder="请输入管理员提供的邀请码"
            :rules="[{ required: true, message: '邀请码为必填项' }]"
            left-icon="shield-o"
          />
        </van-cell-group>
      </div>
    </van-dialog>

    <!-- 底部信息 -->
    <div class="login-footer">
      <p class="footer-text">© 2025 美奥库存管理系统 v1.0</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store';
import { userAPI } from '@/api/user';
import { showToast } from 'vant';
import { DotLottieVue } from '@lottiefiles/dotlottie-vue'

const router = useRouter();
const userStore = useUserStore();

const form = reactive({
  userName: '',
  password: '',
});

const showRegister = ref(false);
const registerForm = reactive({
  nickname: '',
  account: '',
  password: '',
  inviteCode: '',
});

const loading = ref(false);
const errorMessage = ref('');

// 自动填充测试账号（开发环境）
onMounted(() => {
  if (import.meta.env.MODE === 'development') {
    form.userName = 'kzh66612';
    form.password = '123456';
  }
});

// 登录提交
const onSubmit = async () => {
  errorMessage.value = '';
  loading.value = true;

  try {
    const result = await userAPI.login({
      account: form.userName,
      password: form.password,
    });

    if (result && result.token) {
      userStore.setToken(result.token);
      localStorage.setItem('token', result.token);
      if (result.userInfo) {
        userStore.setUserInfo(result.userInfo);
      }
      
      showToast({ message: '登录成功',type: 'success'});
      await router.push('/home');
    } else {
      errorMessage.value = '登录失败：未获取到token';
    }
  } catch (error) {
    errorMessage.value = error.message || '登录失败，请检查账号密码';
  } finally {
    loading.value = false;
  }
};

// 注册提交
const onRegisterSubmit = async () => {
    errorMessage.value = '';
  try {
    
    // 表单验证
    if (!registerForm.nickname || !registerForm.account || !registerForm.password || !registerForm.inviteCode) {
      showToast({message: '请填写完整信息',type: 'fail'})
      return;
    }

    if (registerForm.password.length < 6) {
      showToast({ message: '密码至少6位',type: 'fail'})
      return;
    }

    loading.value = true;
    const res = await userAPI.register({
      userName: registerForm.nickname,
      account: registerForm.account,
      password: registerForm.password,
      inviteCode: registerForm.inviteCode,
    });
    showToast({ message: '注册成功，使用新账号登录',type: 'success'})
    showRegister.value = false;
    // 清空注册表单
    Object.keys(registerForm).forEach(key => {
    registerForm[key] = '';
    });

  } catch (error) {
    errorMessage.value = error.message || '注册失败';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.lottie-box {
  display: flex;
  justify-content: center; /* 水平居中 */
  align-items: center;     /* 垂直居中 */
  height: 100%;            /* 父级要有高度，或写固定值 */
}
.login-header {
  padding: 40px 20px 20px;
  text-align: center;
}

.logo-area {
  margin-bottom: 20px;
}

.system-logo {
  width: 80px;
  height: 80px;
  margin: 0 auto 16px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.logo-icon {
  font-size: 40px;
}

.main-title {
  font-size: 28px;
  font-weight: 700;
  color: white;
  margin: 0 0 8px 0;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.sub-title {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  font-weight: 400;
}

.login-card {
  margin: 0 auto;
  width: 85%;
  max-width: 400px;
  background: white;
  padding: 30px 25px;
  border-radius: 20px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
  position: relative;
  z-index: 1;
}

.form-header {
  text-align: center;
  margin-bottom: 30px;
}

.form-title {
  font-size: 22px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 8px 0;
}

.form-desc {
  font-size: 14px;
  color: #7f8c8d;
  margin: 0;
}

.login-form {
  margin-top: 10px;
}

:deep(.van-field__label) {
  width: 70px;
  color: #34495e;
  font-weight: 500;
}

:deep(.van-field__control) {
  color: #2c3e50;
}

:deep(.van-field__left-icon) {
  margin-right: 8px;
  color: #3498db;
}

.btn-area {
  margin-top: 30px;
}

.login-btn {
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #3498db, #2980b9);
  border: none;
  box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
}

.login-btn:active {
  transform: translateY(1px);
}

.register-link {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: #7f8c8d;
}

.register-link a {
  color: #3498db;
  text-decoration: none;
  margin-left: 5px;
  font-weight: 500;
}

.register-link a:hover {
  text-decoration: underline;
}

/* 错误提示 */
.error-message {
  margin-top: 16px;
  padding: 12px;
  background: #ffeef0;
  border: 1px solid #ffcdd2;
  border-radius: 10px;
  color: #e74c3c;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 14px;
}

.error-icon {
  font-size: 16px;
}

.login-footer {
  padding: 20px;
  text-align: center;
}

.footer-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
}

/* 注册对话框样式 */
:deep(.register-dialog .van-dialog__header) {
  padding-top: 30px;
  font-weight: 600;
  font-size: 18px;
}

.dialog-content {
  padding: 10px 0;
}

.dialog-desc {
  text-align: center;
  color: #e74c3c;
  font-size: 13px;
  margin: 0 20px 15px;
  padding: 8px;
  background: #fff8e1;
  border-radius: 6px;
}

/* 移动端适配 */
@media (max-width: 480px) {
  .login-header {
    padding: 30px 20px 15px;
  }
  
  .system-logo {
    width: 70px;
    height: 70px;
  }
  
  .logo-icon {
    font-size: 35px;
  }
  
  .main-title {
    font-size: 24px;
  }
  
  .login-card {
    width: 90%;
    padding: 25px 20px;
  }
  
  .form-title {
    font-size: 20px;
  }
  
  :deep(.van-dialog) {
    width: 90% !important;
  }
}
</style>