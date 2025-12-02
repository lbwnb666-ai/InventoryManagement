<template>
        <!-- 顶部导航栏 -->
    <van-nav-bar 
      title="我的" 
      fixed 
      placeholder 
      class="custom-nav-bar"
    />

  <div class="profile-page">
    <!-- 用户信息卡片 -->
    <div class="user-section">
        <div class="user-card">
        <div class="user-avatar">
            <van-icon name="user-circle" class="avatar-icon" />
        </div>
        <div class="user-info">
            <!-- 添加 v-if 确保数据存在 -->
            <div class="user-name">{{ userInfo?.userName || localUserInfo.userName || '加载中...' }}</div>
            <div class="user-account">账号: {{ userInfo?.account || localUserInfo.account || '-' }}</div>
            <div class="user-role">角色: {{ getRoleText(userInfo?.permissions || localUserInfo.permissions) }}</div>
        </div>
        <van-tag type="primary" class="status-tag" v-if="(userInfo?.status || localUserInfo.status) === 1">
            正常
        </van-tag>
        </div>
    </div>

    <!-- 邀请码模块 -->
    <div class="invite-section">
      <div class="section-header">
        <h3 class="section-title">邀请码管理</h3>
        <van-button 
          size="small" 
          type="primary" 
          @click="generateInviteCode"
          :loading="generating"
        >
          生成新邀请码
        </van-button>
      </div>
      
      <div class="invite-cards">
        <div 
          v-for="code in inviteCodes.slice(0, 5)" 
          :key="code.id" 
          class="invite-card"
        >
          <div class="code-content">
            <div class="code-value">{{ code.inviteCode }}</div>
            <div class="code-info">
              <div class="code-status">
                <van-tag :type="getCodeStatusType(code.status)" size="small">
                  {{ getCodeStatusText(code.status) }}
                </van-tag>
              </div>
              <div class="code-time">
                {{ formatTime(code.start_time) }} 至 {{ formatTime(code.end_time) }}
              </div>
            </div>
          </div>
          <div class="code-actions">
            <van-button 
              size="mini" 
              type="primary" 
              plain 
              @click="copyInviteCode(code.inviteCode)"
            >
              复制
            </van-button>
            <van-button 
              size="mini" 
              type="danger" 
              plain 
              @click="revokeInviteCode(code.id)"
              v-if="code.status === 1"
            >
              撤销
            </van-button>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="inviteCodes.length === 0" class="empty-invite">
          <van-icon name="gift-card" size="48" color="#dcdee0" />
          <p>暂无邀请码</p>
          <p class="empty-desc">点击上方按钮生成邀请码</p>
        </div>
      </div>
    </div>

    <!-- 功能菜单 -->
    <div class="menu-section">
      <van-cell-group inset class="menu-group">
        <van-cell 
          title="系统设置" 
          icon="setting-o"
          is-link
          @click="goToSettings"
        />
        <van-cell 
          title="关于我们" 
          icon="info-o"
          is-link
          @click="showAbout"
        />
        <van-cell 
          title="版本信息" 
          icon="label-o"
          :value="appVersion"
        />
      </van-cell-group>
    </div>

    <!-- 操作按钮 -->
    <div class="action-section">
      <van-button 
        round 
        block 
        type="default" 
        class="logout-btn"
        @click="handleLogout"
      >
        退出登录
      </van-button>
    </div>

    <!-- 新邀请码弹窗 -->
    <van-dialog
      v-model:show="showNewCodeDialog"
      title="新邀请码已生成"
      show-cancel-button
      cancel-button-text="关闭"
      confirm-button-text="复制邀请码"
      @confirm="copyNewInviteCode"
    >
      <div class="new-code-dialog">
        <div class="dialog-icon">
          <van-icon name="certificate" color="#4cd964" size="48" />
        </div>
        <div class="dialog-content">
          <p class="code-title">您的邀请码</p>
          <p class="new-code-value">{{ newInviteCode }}</p>
          <p class="code-tips">请将此邀请码分享给需要注册的用户</p>
        </div>
      </div>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store';
import { showToast, showConfirmDialog } from 'vant';
import { userAPI } from '@/api/user';
import dayjs from 'dayjs';

const router = useRouter();
const userStore = useUserStore();

// 响应式数据
const generating = ref(false);
const showNewCodeDialog = ref(false);
const newInviteCode = ref('');
const loading = ref(true);

// 创建本地用户信息副本
const localUserInfo = reactive({
  id: null,
  userName: '',
  account: '',
  permissions: 0,
  status: 1
});

// 使用 computed 获取用户信息
const userInfo = computed(() => {
  if (userStore.userInfo) {
    // 确保 store 中的数据同步到 localUserInfo
    Object.assign(localUserInfo, userStore.userInfo);
  }
  return userStore.userInfo || localUserInfo;
});

// 邀请码列表
const inviteCodes = ref([]);

// 应用版本
const appVersion = ref('v1.0.0');

// 方法
const getRoleText = (role) => {
  const roleMap = {
    0: '超级管理员',
    1: '管理员',
    2: '普通用户'
  };
  return roleMap[role] || '未知角色';
};

const getCodeStatusType = (status) => {
  const statusMap = {
    1: 'success', // 有效
    2: 'danger',  // 已使用
    3: 'warning'  // 已撤销
  };
  return statusMap[status] || 'default';
};

const getCodeStatusText = (status) => {
  const statusMap = {
    1: '有效',
    2: '已使用', 
    3: '已撤销'
  };
  return statusMap[status] || '未知';
};

const formatTime = (timeStr) => {
  if (!timeStr) return '-';
  return dayjs(timeStr).format('MM月DD日 HH:mm');
};

// 生成邀请码
const generateInviteCode = async () => {
  generating.value = true;
  try {
    // 使用 localUserInfo.id，因为它是确定存在的
    const userId = localUserInfo.id;
    if (!userId) {
      showToast('用户信息不完整，请刷新页面');
      return;
    }
    
    const result = await userAPI.AddInviteCode(userId);
    if (result!==null) {
      newInviteCode.value = result;
      showNewCodeDialog.value = true;
      // 刷新邀请码列表
      loadInviteCodes();
    } else {
      showToast(result.message || '生成邀请码失败');
    }
  } catch (error) {
    console.error('生成邀请码失败:', error);
    showToast('生成失败，请稍后重试');
  } finally {
    generating.value = false;
  }
};

// 复制邀请码
const copyInviteCode = (code) => {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(code).then(() => {
      showToast('邀请码已复制');
    }).catch(() => {
      fallbackCopyText(code);
    });
  } else {
    fallbackCopyText(code);
  }
};

// 复制新生成的邀请码
const copyNewInviteCode = () => {
  copyInviteCode(newInviteCode.value);
  showNewCodeDialog.value = false;
};

// 备用复制方法
const fallbackCopyText = (text) => {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand('copy');
    showToast('邀请码已复制');
  } catch (err) {
    showToast('复制失败，请手动复制');
  }
  document.body.removeChild(textArea);
};

// 撤销邀请码
const revokeInviteCode = async (codeId) => {
  try {
    await showConfirmDialog({
      title: '确认撤销',
      message: '撤销后该邀请码将无法使用，确定要撤销吗？'
    });
    
    const result = await userAPI.revokeInviteCode(codeId);
    if (result.success) {
      showToast('邀请码已撤销');
      loadInviteCodes();
    } else {
      showToast(result.message || '撤销失败');
    }
  } catch (error) {
    // 用户取消操作
    console.log('用户取消撤销操作');
  }
};

// 加载邀请码列表
const loadInviteCodes = async () => {
  const userId = localUserInfo.id;
  if (!userId) {
    setTimeout(loadInviteCodes, 500);
    return;
  }
  
  try {
    const result = await userAPI.GetInviteCode(userId);
    if (result) {
      inviteCodes.value = result || [];
    }
  } catch (error) {
    console.error('加载邀请码列表失败:', error);
  }
};

// 加载用户信息
const loadUserInfo = async () => {
  try {
    // 如果 store 中有用户信息，使用它
    if (userStore.userInfo) {
      Object.assign(localUserInfo, userStore.userInfo);
      return;
    }
    
    // 从 localStorage 获取
    const localUserInfoStr = localStorage.getItem('userInfo');
    if (localUserInfoStr) {
      const parsedInfo = JSON.parse(localUserInfoStr);
      Object.assign(localUserInfo, parsedInfo);
      // 同时更新到 store
      userStore.setUserInfo(parsedInfo);
    } else if (userStore.token) {
      // 如果 localStorage 也没有，但有 token，则从 API 获取
      await userStore.fetchUserInfo(userStore.token);
      // 等待 store 更新后，再更新 localUserInfo
      if (userStore.userInfo) {
        Object.assign(localUserInfo, userStore.userInfo);
      }
    }
  } catch (error) {
    console.error('加载用户信息失败:', error);
  } finally {
    loading.value = false;
  }
};

// 监听 store 中的用户信息变化
watch(
  () => userStore.userInfo,
  (newUserInfo) => {
    if (newUserInfo) {
      Object.assign(localUserInfo, newUserInfo);
    }
  },
  { immediate: true }
);

// 导航方法
const goToSettings = () => {
  showToast('暂无系统设置');
};

const showAbout = () => {
  showToast('关于我们:\n本应用前后端均为个人开发\n前端：vue+vant4\n后端：ASP.Net\n作者: 匡子涵\n微信: 1371543264\n手机同号');
};

const handleLogout = async () => {
  try {
    await showConfirmDialog({
      title: '确认退出',
      message: '确定要退出登录吗？'
    });
    
    // 清除用户信息
    //userStore.clearUserInfo();
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    
    showToast('已退出登录');
    
    setTimeout(() => {
      router.replace('/login');
    }, 1000);
    
  } catch (error) {
    console.log('用户取消退出登录');
  }
};

// 初始化
onMounted(async () => {
  loading.value = true;
  await loadUserInfo();
  await loadInviteCodes();
  loading.value = false;
});

// 添加路由守卫或监听路由变化
import { onBeforeRouteUpdate } from 'vue-router';

onBeforeRouteUpdate(async (to, from) => {
  if (to.name === 'profile') {
    loading.value = true;
    await loadUserInfo();
    await loadInviteCodes();
    loading.value = false;
  }
});
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f7f9fc 0%, #f1f5f9 100%);
  padding-bottom: 70px;
}

/* 导航栏样式 */
:deep(.custom-nav-bar) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

:deep(.custom-nav-bar .van-nav-bar__title) {
  color: white;
  font-weight: 600;
}

/* 用户信息区域 */
.user-section {
  padding: 20px 16px;
}

.user-card {
  background: white;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 16px;
  position: relative;
  overflow: hidden;
}

.user-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.avatar-icon {
  font-size: 64px;
  color: #667eea;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: 20px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 4px;
}

.user-account {
  font-size: 14px;
  color: #7f8c8d;
  margin-bottom: 2px;
}

.user-role {
  font-size: 13px;
  color: #95a5a6;
}

.status-tag {
  align-self: flex-start;
}

/* 邀请码区域 */
.invite-section {
  padding: 0 16px 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: #2c3e50;
  margin: 0;
}

.invite-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.invite-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s ease;
  border-left: 4px solid #4cd964;
}

.invite-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.code-content {
  flex: 1;
}

.code-value {
  font-size: 18px;
  font-weight: 700;
  color: #2c3e50;
  font-family: 'Courier New', monospace;
  letter-spacing: 1px;
  margin-bottom: 8px;
}

.code-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.code-time {
  font-size: 12px;
  color: #95a5a6;
}

.code-actions {
  display: flex;
  gap: 8px;
}

.empty-invite {
  background: white;
  border-radius: 16px;
  padding: 40px 20px;
  text-align: center;
  color: #95a5a6;
}

.empty-invite p {
  margin: 8px 0 0;
}

.empty-desc {
  font-size: 13px;
  color: #bdc3c7;
}

/* 菜单区域 */
.menu-section {
  padding: 0 16px 20px;
}

.menu-group {
  border-radius: 16px;
  overflow: hidden;
}

:deep(.van-cell) {
  padding: 16px;
}

:deep(.van-cell__title) {
  font-size: 15px;
  font-weight: 500;
}

:deep(.van-cell__value) {
  font-size: 14px;
  color: #7f8c8d;
}

/* 操作区域 */
.action-section {
  padding: 0 16px;
}

.logout-btn {
  height: 44px;
  font-size: 16px;
  color: #e74c3c;
  border-color: #ffcdd2;
}

.logout-btn:active {
  background: #ffebee;
}

/* 新邀请码弹窗 */
.new-code-dialog {
  padding: 20px;
  text-align: center;
}

.dialog-icon {
  margin-bottom: 16px;
}

.dialog-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.code-title {
  font-size: 16px;
  color: #2c3e50;
  margin: 0;
}

.new-code-value {
  font-size: 24px;
  font-weight: 700;
  color: #4cd964;
  background: #f8fff8;
  padding: 12px;
  border-radius: 8px;
  border: 2px dashed #4cd964;
  font-family: 'Courier New', monospace;
  letter-spacing: 2px;
  margin: 0;
}

.code-tips {
  font-size: 13px;
  color: #7f8c8d;
  margin: 0;
}

/* 响应式调整 */
@media (max-width: 480px) {
  .user-section {
    padding: 16px 12px;
  }
  
  .user-card {
    padding: 20px;
  }
  
  .avatar-icon {
    font-size: 56px;
  }
  
  .user-name {
    font-size: 18px;
  }
  
  .invite-section {
    padding: 0 12px 16px;
  }
  
  .invite-card {
    padding: 16px;
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .code-actions {
    justify-content: flex-end;
  }
  
  .menu-section {
    padding: 0 12px 16px;
  }
  
  .action-section {
    padding: 0 12px;
  }
  
  .new-code-value {
    font-size: 20px;
    padding: 10px;
  }
}

@media (max-width: 360px) {
  .user-card {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }
  
  .status-tag {
    align-self: center;
  }
  
  .code-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>