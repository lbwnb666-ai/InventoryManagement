<template>
        <!-- 顶部导航栏 -->
    <van-nav-bar 
      title="流水记录" 
      fixed 
      placeholder 
      class="custom-nav-bar"
      left-arrow
      @click-left="$router.back()"
    />
  <div class="transaction-page">
    <!-- 搜索筛选区域 -->
    <div class="filter-section">
      <div class="filter-card">
        <!-- 搜索框 -->
        <div class="search-field">
          <van-field
            v-model="searchForm.name"
            placeholder="搜索物品名称"
            clearable
            left-icon="search"
          >
            <template #button>
              <van-button size="small" type="primary" @click="onSearch">搜索</van-button>
            </template>
          </van-field>
        </div>

        <!-- 操作类型和时间筛选 -->
        <div class="filter-row">
          <div class="filter-item">
            <label class="filter-label">操作类型</label>
            <van-radio-group v-model="searchForm.type" direction="horizontal" @change="onFilterChange">
              <van-radio name="0">全部</van-radio>
              <van-radio name="1">入库</van-radio>
              <van-radio name="2">出库</van-radio>
            </van-radio-group>
          </div>

          <div class="filter-item">
            <label class="filter-label">时间范围</label>
            <div class="time-picker">
              <van-field
                v-model="dateRangeText"
                readonly
                placeholder="选择时间范围"
                @click="showCalendar = true"
                clearable
                @clear="clearDateRange"
              />
            </div>
          </div>
        </div>

        <!-- 统计信息 -->
        <div class="stats-row">
          <div class="stat-item">
            <div class="stat-value">{{ totalCount }}</div>
            <div class="stat-label">总记录</div>
          </div>
          <div class="stat-item">
            <div class="stat-value in-count">{{ inCount }}</div>
            <div class="stat-label">入库</div>
          </div>
          <div class="stat-item">
            <div class="stat-value out-count">{{ outCount }}</div>
            <div class="stat-label">出库</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 流水列表 -->
    <div class="transaction-list-section">
      <van-pull-refresh v-model="refreshing" @refresh="onRefresh" class="refresh-container">
        <van-list
          v-model:loading="loading"
          :finished="finished"
          finished-text="没有更多了"
          @load="onLoad"
          class="transaction-list"
        >
          <div class="list-container">
            <div 
              v-for="record in transactionList" 
              :key="record.id" 
              class="transaction-card"
              :class="getRecordTypeClass(record.type)"
            >
              <div class="card-header">
                <div class="item-info">
                  <div class="item-name">{{ record.itmeName || '未知物品' }}</div>
                  <van-tag :type="getRecordTagType(record.type)" size="small">
                    {{ record.type === 1 ? '入库' : '出库' }}
                  </van-tag>
                </div>
                <div class="record-time">{{ formatTime(record.operateTime) }}</div>
              </div>

              <div class="card-content">
                <div class="quantity-section">
                  <div class="quantity-change">
                    <span class="change-label">数量变更：</span>
                    <span class="change-value" :class="getQuantityClass(record.type)">
                      {{ record.type === 1 ? '+' : '-' }}{{ record.quantity }}
                    </span>
                    <span class="quantity-unit">{{ record.unit || '件' }}</span>
                  </div>
                  <div class="quantity-stats">
                    <span class="stat-item">
                      <span class="stat-label">前：</span>
                      <span class="stat-value">{{ record.beforeQuantity }}</span>
                    </span>
                    <van-icon name="arrow" class="arrow-icon" />
                    <span class="stat-item">
                      <span class="stat-label">后：</span>
                      <span class="stat-value">{{ record.afterQuantity }}</span>
                    </span>
                  </div>
                </div>

                <!-- <div v-if="record.orderNumber" class="order-info">
                  <span class="info-label">订单号：</span>
                  <span class="info-value">{{ record.orderNumber }}</span>
                </div> -->

                <div v-if="record.operatorName" class="operator-info">
                  <span class="info-label">操作人：</span>
                  <span class="info-value">{{ record.operatorName }}</span>
                </div>

                <div v-if="record.remark" class="remark-info">
                  <span class="info-label">备注：</span>
                  <span class="info-value">{{ record.remark }}</span>
                </div>
              </div>

              <div class="card-footer">
                <div class="record-id">记录ID: {{ record.orderNumber }}</div>
                <!-- <div class="item-code" v-if="record.itemCode">编码: {{ record.itemCode }}</div> -->
              </div>
            </div>
          </div>
        </van-list>
      </van-pull-refresh>
    </div>

    <!-- 空状态 -->
    <div v-if="!loading && transactionList.length === 0" class="empty-state">
      <van-icon name="description" size="64" color="#dcdee0" />
      <p class="empty-text">暂无流水记录</p>
      <van-button type="primary" @click="resetFilters">重置筛选条件</van-button>
    </div>

    <!-- 日历选择器 -->   
    <van-calendar
        v-model:show="showCalendar"
        type="range"
        :min-date="minDate"
        :max-date="maxDate"
        :formatter="formatter"
        :show-confirm="false"
        @confirm="onCalendarConfirm"
        @select="onCalendarSelect"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { showToast } from 'vant';
import { itemAPI } from '@/api/item';
import dayjs from 'dayjs';

const router = useRouter();

// 响应式数据
const loading = ref(false);
const finished = ref(false);
const refreshing = ref(false);
const showCalendar = ref(false);
const selectedRange = reactive({
  start: null,
  end: null
});

// 日期范围
const currentDate = ref(new Date());
const currentEndDate = ref(new Date());
const minDate = new Date(2020, 0, 1);
const maxDate = new Date();

// 分页数据
const pagination = reactive({
  pageIndex: 1,
  pageSize: 20,
  totalCount: 0
});

// 搜索表单
const searchForm = reactive({
  name: '',
  type: '0', // 0: 全部, 1: 入库, 2: 出库
  startTime: null,
  endTime: null,
  orderNumber: '',
  pageIndex: 1,
  pageSize: 20
});

// 数据列表
const transactionList = ref([]);

// 计算属性
const dateRangeText = computed(() => {
  if (!searchForm.startTime && !searchForm.endTime) {
    return '';
  }
  const start = searchForm.startTime ? dayjs(searchForm.startTime).format('YYYY-MM-DD') : '';
  const end = searchForm.endTime ? dayjs(searchForm.endTime).format('YYYY-MM-DD') : '';
  
  if (start && end) {
    return `${start} 至 ${end}`;
  } else if (start) {
    return `${start} 至今`;
  } else if (end) {
    return `至 ${end}`;
  }
  return '';
});

const totalCount = computed(() => pagination.totalCount);
const inCount = computed(() => {
  return transactionList.value.filter(record => record.type === 1).length;
});
const outCount = computed(() => {
  return transactionList.value.filter(record => record.type === 2).length;
});

// 方法
const getRecordTypeClass = (type) => {
  return type === 1 ? 'in-record' : 'out-record';
};

const getRecordTagType = (type) => {
  return type === 1 ? 'success' : 'danger';
};

const getQuantityClass = (type) => {
  return type === 1 ? 'quantity-in' : 'quantity-out';
};

const formatTime = (timeStr) => {
  if (!timeStr) return '-';
  return dayjs(timeStr).format('YYYY-MM-DD HH:mm:ss');
};

const formatCalendarDate = (date) => {
  return dayjs(date).format('YYYY年MM月DD日');
};
// 日历格式化器 - 限制只能选择过去日期
const formatter = (day) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // 如果是未来日期，禁用选择
  if (day.date > today) {
    day.type = 'disabled';
  }
  
  // 如果是今天，添加标识
  if (day.date.getTime() === today.getTime()) {
    day.topInfo = '今天';
  }
  
  return day;
};

// 日历选择事件
const onCalendarSelect = (values) => {
  if (values.length === 2) {
    selectedRange.start = values[0];
    selectedRange.end = values[1];
  } else if (values.length === 1) {
    selectedRange.start = values[0];
    selectedRange.end = null;
  }
};

// 日历确认事件
const onCalendarConfirm = (values) => {
  if (values.length === 2) {
    selectedRange.start = values[0];
    selectedRange.end = values[1];
    confirmDateRange();
  }
};

// 确认日期范围
const confirmDateRange = () => {
  if (selectedRange.start && selectedRange.end) {
    searchForm.startTime = dayjs(selectedRange.start).format('YYYY-MM-DD');
    searchForm.endTime = dayjs(selectedRange.end).format('YYYY-MM-DD');
    showCalendar.value = false;
    onRefresh();
  } else {
    showToast('请选择完整的日期范围');
  }
};

// 清除日历选择
const clearCalendar = () => {
  selectedRange.start = null;
  selectedRange.end = null;
};

// 数据加载
const loadTransactions = async (isRefresh = false) => {
  if (isRefresh) {
    pagination.pageIndex = 1;
    transactionList.value = [];
  }

  try {
    // 准备查询参数
    const params = {
      ...searchForm,
      pageIndex: pagination.pageIndex,
      pageSize: pagination.pageSize
    };

    // 转换类型为数字
    params.type = parseInt(params.type);

    const response = await itemAPI.queryInOutRecords(params);
    const newRecords = response.data || [];
    
    
    if (isRefresh) {
      transactionList.value = newRecords;
      console.log('流水记录:', transactionList.value);
    } else {
      transactionList.value = [...transactionList.value, ...newRecords];
    }

    // 更新分页信息
    pagination.totalCount = response.totalCount || 0;
    pagination.pageIndex = response.pageIndex || 1;

    // 检查是否加载完毕
    finished.value = transactionList.value.length >= pagination.totalCount;
  } catch (error) {
    console.error('加载流水记录失败:', error);
    showToast('加载失败');
  }
};

const onLoad = () => {
  if (refreshing.value) {
    transactionList.value = [];
    refreshing.value = false;
  }
  
  pagination.pageIndex++;
  searchForm.pageIndex = pagination.pageIndex;
  loadTransactions();
};

const onRefresh = () => {
  refreshing.value = true;
  finished.value = false;
  loading.value = true;
  searchForm.pageIndex = 1;
  pagination.pageIndex = 1;
  loadTransactions(true).finally(() => {
    refreshing.value = false;
    loading.value = false;
  });
};

const onSearch = () => {
  onRefresh();
};

const onFilterChange = () => {
  onRefresh();
};

// 日期选择
const onStartDateConfirm = (date) => {
  searchForm.startTime = dayjs(date).format('YYYY-MM-DD');
  showDatePicker.value = false;
  showEndDatePicker.value = true;
};

const onEndDateConfirm = (date) => {
  searchForm.endTime = dayjs(date).format('YYYY-MM-DD');
  showEndDatePicker.value = false;
  // 自动搜索
  onRefresh();
};

const clearDateRange = () => {
  searchForm.startTime = null;
  searchForm.endTime = null;
  clearCalendar();
  onRefresh();
};

const resetFilters = () => {
  searchForm.name = '';
  searchForm.type = '0';
  searchForm.startTime = null;
  searchForm.endTime = null;
  searchForm.orderNumber = '';
  onRefresh();
};

// 初始化
onMounted(() => {
  onRefresh();
});
</script>

<style scoped>
.transaction-page {
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

/* 筛选区域 */
.filter-section {
  padding: 16px;
}

.filter-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
}

.filter-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.search-field {
  margin-bottom: 20px;
}

:deep(.van-field) {
  border-radius: 12px;
  border: 2px solid #f1f3f4;
  background: #fafbfc;
}

:deep(.van-field:focus-within) {
  border-color: #667eea;
  background: white;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.filter-row {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-label {
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
}

:deep(.van-radio-group) {
  display: flex;
  gap: 16px;
}

:deep(.van-radio) {
  margin-right: 0;
}

:deep(.van-radio__label) {
  color: #2c3e50;
  font-size: 14px;
}

.time-picker :deep(.van-field) {
  background: white;
}

/* 统计信息 */
.stats-row {
  display: flex;
  justify-content: space-around;
  padding: 16px 0;
  border-top: 1px solid #f1f3f4;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #2c3e50;
}

.stat-value.in-count {
  color: #4cd964;
}

.stat-value.out-count {
  color: #ff6b6b;
}

.stat-label {
  font-size: 12px;
  color: #7f8c8d;
  font-weight: 500;
}

/* 日历容器 */
.calendar-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
}

/* 流水列表 */
.transaction-list-section {
  margin: 0 16px;
}

.refresh-container {
  min-height: 400px;
}

.list-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.transaction-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  border-left: 4px solid;
}

.transaction-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.transaction-card.in-record {
  border-left-color: #4cd964;
}

.transaction-card.out-record {
  border-left-color: #ff6b6b;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f1f3f4;
}

.item-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.item-name {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  flex: 1;
}

.record-time {
  font-size: 12px;
  color: #95a5a6;
  white-space: nowrap;
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.quantity-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.quantity-change {
  display: flex;
  align-items: center;
  gap: 4px;
}

.change-label {
  font-size: 13px;
  color: #7f8c8d;
}

.change-value {
  font-size: 16px;
  font-weight: 700;
}

.quantity-in {
  color: #4cd964;
}

.quantity-out {
  color: #ff6b6b;
}

.quantity-unit {
  font-size: 12px;
  color: #95a5a6;
  background: white;
  padding: 2px 6px;
  border-radius: 4px;
}

.quantity-stats {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 2px;
}

.stat-label {
  color: #7f8c8d;
  font-size: 12px;
}

.stat-value {
  font-size: 13px;
  font-weight: 600;
  color: #2c3e50;
}

.arrow-icon {
  color: #95a5a6;
  font-size: 12px;
}

.order-info,
.operator-info,
.remark-info {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
}

.info-label {
  color: #7f8c8d;
  min-width: 60px;
  flex-shrink: 0;
}

.info-value {
  color: #2c3e50;
  flex: 1;
  word-break: break-all;
}

.remark-info .info-value {
  color: #667eea;
  font-style: italic;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f1f3f4;
  font-size: 11px;
  color: #95a5a6;
}

.record-id,
.item-code {
  background: #f8f9fa;
  padding: 2px 6px;
  border-radius: 4px;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
}

.empty-text {
  margin: 16px 0 20px;
  color: #95a5a6;
  font-size: 16px;
}

/* 响应式调整 */
@media (max-width: 480px) {
  .filter-section {
    padding: 12px;
  }
  
  .filter-card {
    padding: 16px;
  }
  
  .transaction-list-section {
    margin: 0 12px;
  }
  
  .transaction-card {
    padding: 16px;
  }
  
  .card-header {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
  
  .record-time {
    align-self: flex-end;
  }
  
  .quantity-section {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
  
  .card-footer {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
  
  .stats-row {
    padding: 12px 0;
  }
  
  .stat-value {
    font-size: 20px;
  }
}

@media (max-width: 360px) {
  .filter-row {
    gap: 12px;
  }
  
  :deep(.van-radio-group) {
    gap: 12px;
  }
  
  .transaction-card {
    padding: 12px;
  }
  
  .item-name {
    font-size: 15px;
  }
}
</style>