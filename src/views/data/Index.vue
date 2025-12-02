<template>
    <!-- 顶部导航栏 -->
     <van-nav-bar title="数据操作" fixed placeholder class="custom-nav-bar"></van-nav-bar>
    <!-- <van-nav-bar 
      title="数据操作" 
      fixed 
      placeholder 
      class="custom-nav-bar"
      left-arrow
      @click-left="$router.back()"
    ></van-nav-bar> -->
  <div class="operation-container">
    <!-- 操作卡片区域 -->
    <div class="operation-content">
        <!-- 快捷统计卡片 -->
      <div class="quick-stats">
            <div class="section-title">快捷统计</div>
                <div class="stats-grid">
                <div class="stat-item" @click="handleLowStock">
                    <div class="stat-icon low">
                    <van-icon name="warning-o" />
                    </div>
                    <div class="stat-content">
                    <div class="stat-number">{{ lowStockCount }}</div>
                    <div class="stat-label">低库存物品</div>
                    </div>
                </div>

                <div class="stat-item" @click="handleOutOfStock">
                    <div class="stat-icon out">
                    <van-icon name="close" />
                    </div>
                    <div class="stat-content">
                    <div class="stat-number">{{ outOfStockCount }}</div>
                    <div class="stat-label">缺货物品</div>
                    </div>
                </div>

                <div class="stat-item" @click="handleRecentActivity">
                    <div class="stat-icon activity">
                    <van-icon name="clock-o" />
                    </div>
                    <div class="stat-content">
                    <div class="stat-number">{{ todayTransactions }}</div>
                    <div class="stat-label">今日操作</div>
                    </div>
                </div>
            </div>
        </div>
      <!-- 第一排操作按钮 -->
      <div class="operation-section">
        <div class="section-title">库存操作</div>
        <div class="button-grid">
          <div class="operation-button" @click="openAddItemPopup">
            <div class="button-icon add">
              <van-icon name="add-o" />
            </div>
            <div class="button-text">添加物品</div>
            <div class="button-desc">新增库存物品</div>
          </div>
          <div class="operation-button" @click="handleInventoryCheck">
            <div class="button-icon check">
              <van-icon name="notes-o" />
            </div>
            <div class="button-text">库存盘点</div>
            <div class="button-desc">库存数量核对</div>
          </div>

          <div class="operation-button" @click="handleStockIn">
            <div class="button-icon in">
              <van-icon name="logistics" />
            </div>
            <div class="button-text">物品入库</div>
            <div class="button-desc">库存入库操作</div>
          </div>

          <div class="operation-button" @click="handleStockOut">
            <div class="button-icon out">
              <van-icon name="send-gift-o" />
            </div>
            <div class="button-text">物品出库</div>
            <div class="button-desc">库存出库操作</div>
          </div>
        </div>
      </div>

      <!-- 第二排操作按钮 -->
      <div class="operation-section">
        <div class="section-title">数据查询</div>
        <div class="button-grid">
          <div class="operation-button" @click="handleInventoryOverview">
            <div class="button-icon overview">
              <van-icon name="chart-trending-o" />
            </div>
            <div class="button-text">库存总览</div>
            <div class="button-desc">查看库存统计</div>
          </div>

          <div class="operation-button" @click="handleTransactionQuery">
            <div class="button-icon transaction">
              <van-icon name="description" />
            </div>
            <div class="button-text">流水查询</div>
            <div class="button-desc">出入库记录</div>
          </div>

          <div class="operation-button" @click="handleReportExport">
            <div class="button-icon export">
              <van-icon name="down" />
            </div>
            <div class="button-text">报表导出</div>
            <div class="button-desc">导出库存数据</div>
          </div>

          <div class="operation-button" @click="handleSettings">
            <div class="button-icon settings">
              <van-icon name="setting-o" />
            </div>
            <div class="button-text">系统设置</div>
            <div class="button-desc">系统参数配置</div>
          </div>
        </div>
      </div>
      <!--添加物品-->
    <AddItemPopup 
      v-model:show="showAddItemPopup" 
      @success="handleAddItem"
    />
    <!-- 出入库操作弹窗 -->
    <InOutRecords 
      v-model:show="showInOutPopup" 
      :type="operationType"
      @success="handleOperationSuccess"
    />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { showToast } from 'vant';
import AddItemPopup from '@/components/AddItemPopup.vue';
import  InOutRecords from '@/components/InOutRecords.vue';

const router = useRouter();

// 响应式数据
const showQuickActions = ref(false);
const lowStockCount = ref(5);
const outOfStockCount = ref(2);
const todayTransactions = ref(12);

//添加物品组件
const showAddItemPopup = ref(false);
const openAddItemPopup = () => {
  showAddItemPopup.value = true;
};

//出入库
const showInOutPopup = ref(false);
const operationType = ref(1); // 1: 入库, 2: 出库


const handleAddItem = () => {
  showToast(`物品添加成功`);
};

//出库
const handleStockOut = () => {
  operationType.value = 2;
  showInOutPopup.value = true;
};

//入库
const handleStockIn = () => {
  operationType.value = 1;
  showInOutPopup.value = true;
};

const handleInventoryCheck = () => {
  showToast('没做库存盘点页面');
  // router.push('/inventory-check');
};

const handleInventoryOverview = () => {
  router.push('/inventoryOverview');
};

const handleTransactionQuery = () => {
  router.push('/serial');
};

const handleReportExport = () => {
  showToast('开始导出报表');
  // 导出逻辑
};

const handleSettings = () => {
  showToast('没做系统设置页面');
  // router.push('/settings');
};

const handleLowStock = () => {
  showToast('查看低库存物品');
  // router.push('/low-stock');
};

const handleOutOfStock = () => {
  showToast('查看缺货物品');
  // router.push('/out-of-stock');
};

const handleRecentActivity = () => {
  showToast('查看今日操作记录');
  // router.push('/recent-activity');
};

const onQuickActionSelect = (action) => {
  showQuickActions.value = false;
  showToast(`执行: ${action.name}`);
};

//更新库存方法体
const handleOperationSuccess = (result) => {
  const operationText = result.operation === 'in' ? '入库' : '出库';
  showToast(`物品${operationText}成功`);
  console.log('操作结果:', result);
  
  // 这里可以更新库存列表等操作
};

onMounted(() => {
  setTimeout(() => {
    lowStockCount.value = 8;
    outOfStockCount.value = 3;
    todayTransactions.value = 15;
  }, 1000);
});
</script>

<style scoped>
.operation-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f7f9fc 0%, #f1f5f9 100%);
  padding-bottom: 40px;
}

/* 导航栏样式 */
:deep(.custom-nav-bar) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

:deep(.custom-nav-bar .van-nav-bar__title) {
  color: white;
  font-weight: 600;
}

:deep(.custom-nav-bar .van-icon) {
  color: white;
}

.operation-content {
  padding: 20px 16px;
}

.operation-section {
  background: white;
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
}

.operation-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 20px;
  position: relative;
  padding-left: 12px;
}

.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 16px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 2px;
}

.button-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.operation-button {
  background: white;
  border: 2px solid #f8f9fa;
  border-radius: 16px;
  padding: 20px 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.operation-button:hover {
  transform: translateY(-2px);
  border-color: #667eea;
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.15);
}

.operation-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.operation-button:hover::before {
  opacity: 1;
}

.button-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
  font-size: 24px;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.button-icon.add {
  background: linear-gradient(135deg, #4cd964, #34e89e);
}

.button-icon.out {
  background: linear-gradient(135deg, #ff6b6b, #ff8e53);
}

.button-icon.in {
  background: linear-gradient(135deg, #3498db, #2980b9);
}

.button-icon.check {
  background: linear-gradient(135deg, #ffa726, #ff9800);
}

.button-icon.overview {
  background: linear-gradient(135deg, #9b59b6, #8e44ad);
}

.button-icon.transaction {
  background: linear-gradient(135deg, #34495e, #2c3e50);
}

.button-icon.export {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
}

.button-icon.settings {
  background: linear-gradient(135deg, #95a5a6, #7f8c8d);
}

.button-text {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
}

.button-desc {
  font-size: 12px;
  color: #7f8c8d;
  line-height: 1.4;
}

/* 快捷统计样式 */
.quick-stats {
  background: white;
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
}

.quick-stats::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(135deg, #4cd964, #34e89e);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.stat-item {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 16px 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.stat-item:hover {
  background: white;
  border-color: #667eea;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 8px;
  font-size: 18px;
  color: white;
}

.stat-icon.low {
  background: linear-gradient(135deg, #ffa726, #ff9800);
}

.stat-icon.out {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
}

.stat-icon.activity {
  background: linear-gradient(135deg, #3498db, #2980b9);
}

.stat-number {
  font-size: 20px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 2px;
}

.stat-label {
  font-size: 12px;
  color: #7f8c8d;
  font-weight: 500;
}

/* 底部操作栏 */
.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  background: rgba(247, 249, 252, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid #e8e8e8;
}

.quick-action-btn {
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.quick-action-btn:active {
  transform: translateY(1px);
}

/* 操作面板样式 */
:deep(.van-action-sheet__item) {
  font-size: 16px;
  font-weight: 500;
}

:deep(.van-action-sheet__cancel) {
  color: #7f8c8d;
}

/* 响应式调整 */
@media (max-width: 480px) {
  .operation-content {
    padding: 16px 12px;
  }
  
  .operation-section {
    padding: 16px;
    border-radius: 16px;
  }
  
  .button-grid {
    gap: 12px;
  }
  
  .operation-button {
    padding: 16px 8px;
  }
  
  .button-icon {
    width: 48px;
    height: 48px;
    font-size: 20px;
  }
  
  .button-text {
    font-size: 14px;
  }
  
  .stats-grid {
    gap: 8px;
  }
  
  .stat-item {
    padding: 12px 8px;
  }
  
  .stat-number {
    font-size: 18px;
  }
}

@media (min-width: 768px) {
  .button-grid {
    grid-template-columns: repeat(4, 1fr);
  }
  
  .operation-button {
    padding: 24px 16px;
  }
}
</style>