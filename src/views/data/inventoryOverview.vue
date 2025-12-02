<template>
    <!-- 顶部导航栏 -->
    <van-nav-bar 
      title="库存总览" 
      fixed 
      placeholder 
      class="custom-nav-bar"
      left-arrow
      @click-left="$router.back()"
    >
      <template #right>
        <van-icon name="search" size="18" @click="showSearch = true" />
      </template>
    </van-nav-bar>
  <div class="inventory-overview">
    <!-- 搜索区域 -->
    <div class="search-section" v-if="showSearch">
      <van-search
        v-model="searchForm.name"
        placeholder="搜索物品名称"
        show-action
        @search="onSearch"
        @cancel="showSearch = false"
      >
        <template #action>
          <div @click="onSearch">搜索</div>
        </template>
      </van-search>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-section">
      <div class="stats-cards">
        <van-row gutter="12">
          <van-col span="8">
            <div class="stat-card" @click="filterByStock('all')">
              <div class="card-bg total"></div>
              <div class="stat-content">
                <div class="stat-icon total">
                  <van-icon name="box" />
                </div>
                <div class="stat-number">{{ totalItems }}</div>
                <div class="stat-label">总物品数</div>
              </div>
            </div>
          </van-col>
          <van-col span="8">
            <div class="stat-card" @click="filterByStock('inStock')">
              <div class="card-bg in-stock"></div>
              <div class="stat-content">
                <div class="stat-icon in-stock">
                  <van-icon name="passed" />
                </div>
                <div class="stat-number">{{ inStockItems }}</div>
                <div class="stat-label">在库物品</div>
              </div>
            </div>
          </van-col>
          <van-col span="8">
            <div class="stat-card" @click="filterByStock('outOfStock')">
              <div class="card-bg out-stock"></div>
              <div class="stat-content">
                <div class="stat-icon out-stock">
                  <van-icon name="warning" />
                </div>
                <div class="stat-number">{{ outOfStockItems }}</div>
                <div class="stat-label">缺货物品</div>
              </div>
            </div>
          </van-col>
        </van-row>
      </div>
    </div>

    <!-- 筛选工具栏 -->
    <div class="filter-section">
      <div class="sort-controls">
        <van-dropdown-menu>
          <van-dropdown-item v-model="sortField" :options="sortOptions" @change="onSortChange" />
        </van-dropdown-menu>
      </div>
    </div>

    <!-- 库存列表 -->
    <div class="inventory-list-section">
      <van-pull-refresh v-model="refreshing" @refresh="onRefresh" class="refresh-container">
        <van-list
          v-model:loading="loading"
          :finished="finished"
          finished-text="没有更多了"
          @load="onLoad"
          class="inventory-list"
        >
          <div class="list-container">
            <van-cell-group inset class="custom-cell-group">
              <van-cell
                v-for="item in displayedItems"
                :key="item.id"
                :class="['inventory-item', getStockLevelClass(item.quantity)]"
                @click="showItemDetail(item)"
              >
                <template #icon>
                  <div 
                    class="color-block-icon"
                    :style="{ backgroundColor: getItemColor(item.itemName, item.id) }"
                  >
                    <van-icon :name="getItemIcon(item.itemName)" />
                  </div>
                </template>
                
                <template #title>
                  <div class="item-header">
                    <div class="item-title">{{ item.itemName }}</div>
                    <van-tag :type="getStockTagType(item.quantity)" size="small">
                      {{ getStockStatus(item.quantity) }}
                    </van-tag>
                  </div>
                </template>
                
                <template #label>
                  <div class="item-details">
                    <div class="detail-row">
                      <span class="detail-label">编码：</span>
                      <span class="detail-value">{{ item.itemCode }}</span>
                    </div>
                    <!-- <div class="detail-row">
                      <span class="detail-label">规格：</span>
                      <span class="detail-value">{{ item.specification || '无' }}</span>
                    </div> -->
                    <div class="detail-row">
                      <span class="detail-label">单位：</span>
                      <span class="detail-value">{{ item.unit }}</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">更新时间：</span>
                      <span class="detail-value time">{{ formatTime(item.updatedAt) }}</span>
                    </div>
                  </div>
                </template>
                
                <template #value>
                  <div class="item-quantity">
                    <div class="quantity-number">{{ item.quantity }}</div>
                    <div class="quantity-unit">{{ item.unit }}</div>
                  </div>
                </template>
              </van-cell>
            </van-cell-group>
          </div>
        </van-list>
      </van-pull-refresh>
    </div>

    <!-- 空状态 -->
    <div v-if="!loading && displayedItems.length === 0" class="empty-state">
      <van-icon name="box-o" size="64" color="#dcdee0" />
      <p class="empty-text">暂无库存物品</p>
      <van-button type="primary" @click="resetFilters">重置筛选条件</van-button>
    </div>

    <!-- 物品详情弹窗 -->
    <van-popup 
      v-model:show="showDetailPopup" 
      position="bottom" 
      class="detail-popup"
      :style="{ height: '70%' }"
      round
    >
      <div class="popup-container">
        <div class="popup-header">
          <div class="popup-title">
            <span class="item-name">"{{ currentItem?.itemName }}"</span>
            <span class="popup-subtitle">的入/出库记录</span>
          </div>
          <van-button size="small" type="primary" @click="showDetailPopup=false" class="close-btn">
            关闭
          </van-button>
        </div>
        
        <div class="record-list">
          <div 
            v-for="record in inOutRecords" 
            :key="record.id" 
            class="record-card"
            :style="{ borderLeftColor: getRecordColor(record.type) }"
          >
            <div class="record-header">
              <div class="record-type">
                <van-tag :color="getRecordColor(record.type)" plain>
                  {{ record.type === 1 ? '入库' : '出库' }}
                </van-tag>
              </div>
              <div class="record-time">{{ formatOperateTime(record.operateTime) }}</div>
            </div>
            
            <div class="record-content">
              <div class="record-row">
                <span class="record-label">数量：</span>
                <span class="record-value">{{ record.quantity }} {{ currentItem?.unit }}</span>
              </div>
              <div class="record-row">
                <span class="record-label">变更前：</span>
                <span class="record-value">{{ record.beforeQuantity }} {{ currentItem?.unit }}</span>
              </div>
              <div class="record-row">
                <span class="record-label">变更后：</span>
                <span class="record-value">{{ record.afterQuantity }} {{ currentItem?.unit }}</span>
              </div>
              <div class="record-row">
                <span class="record-label">订单号：</span>
                <span class="record-value record-order">{{ record.orderNumber || '无' }}</span>
              </div>
              <div v-if="record.remark" class="record-row">
                <span class="record-label">备注：</span>
                <span class="record-value record-remark">{{ record.remark }}</span>
              </div>
            </div>
          </div>
          
          <div v-if="inOutRecords.length === 0" class="no-data">
            <van-icon name="description" size="48" color="#dcdee0" />
            <p>暂无记录</p>
          </div>
        </div>
      </div>
    </van-popup>
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
const showSearch = ref(false);
const loading = ref(false);
const finished = ref(false);
const refreshing = ref(false);
const showDetailPopup = ref(false);
const activeFilter = ref('all');
const sortField = ref('updatedAt');

// 分页数据
const pagination = reactive({
  pageIndex: 1,
  pageSize: 10,
  totalCount: 0,
  totalPages: 0
});

// 表单数据
const searchForm = reactive({
  name: '',
  code: '',
  specification: '',
  unit: '',
  startTime: null,
  endTime: null
});

// 物品数据
const itemsList = ref([]);
const currentItem = ref(null);
const inOutRecords = ref([]);

// 排序选项
const sortOptions = [
  { text: '按更新时间', value: 'updatedAt' },
  { text: '按库存数量', value: 'quantity' },
  { text: '按物品名称', value: 'itemName' }
];

// 颜色配置
const colorPalette = [
  "#5470C6", "#91CC75", "#EE6666", "#73C0DE", "#FAC858",
  "#9A60B4", "#EA7CCC", "#3BA272", "#FC8452", "#6E7074"
];

// 计算属性
const totalItems = computed(() => itemsList.value.length);
const inStockItems = computed(() => itemsList.value.filter(item => item.quantity > 0).length);
const outOfStockItems = computed(() => itemsList.value.filter(item => item.quantity === 0).length);
const lowStockItems = computed(() => itemsList.value.filter(item => item.quantity > 0 && item.quantity < 10).length);

const displayedItems = computed(() => {
  let filtered = [...itemsList.value];

  // 应用筛选条件
  switch (activeFilter.value) {
    case 'inStock':
      filtered = filtered.filter(item => item.quantity > 0);
      break;
    case 'outOfStock':
      filtered = filtered.filter(item => item.quantity === 0);
      break;
    case 'lowStock':
      filtered = filtered.filter(item => item.quantity > 0 && item.quantity < 10);
      break;
  }

  // 应用搜索条件
  if (searchForm.name) {
    filtered = filtered.filter(item => 
      item.itemName.toLowerCase().includes(searchForm.name.toLowerCase())
    );
  }

  // 应用排序
  filtered.sort((a, b) => {
    switch (sortField.value) {
      case 'quantity':
        return b.quantity - a.quantity;
      case 'itemName':
        return a.itemName.localeCompare(b.itemName);
      case 'updatedAt':
      default:
        return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
    }
  });

  return filtered;
});

// 方法
const getItemColor = (itemName, id) => {
  const colorMap = {
  };
  
  for (const [key, color] of Object.entries(colorMap)) {
    if (itemName.includes(key)) return color;
  }
  
  return colorPalette[id % colorPalette.length];
};

const getItemIcon = (itemName) => {
  const iconMap = {
    '笔记本': 'laptop-o',
    '鼠标': 'aim',
    '键盘': 'key-o',
    '显示器': 'tv-o',
    '数据线': 'link-o',
    '耳机': 'music-o',
    '电源': 'bolt-o',
    '平板': 'phone-o'
  };
  
  for (const [key, icon] of Object.entries(iconMap)) {
    if (itemName.includes(key)) return icon;
  }
  return 'box-o';
};

const getStockStatus = (quantity) => {
  if (quantity === 0) return '缺货';
  if (quantity < 10) return '库存紧张';
  return '库存充足';
};

const getStockTagType = (quantity) => {
  if (quantity === 0) return 'danger';
  if (quantity < 10) return 'warning';
  return 'success';
};

const getStockLevelClass = (quantity) => {
  if (quantity === 0) return 'out-of-stock';
  if (quantity < 10) return 'low-stock';
  return 'in-stock';
};

const formatTime = (timeStr) => {
  if (!timeStr) return '-';
  return dayjs(timeStr).format('MM/DD HH:mm');
};

const formatOperateTime = (timeStr) => {
  if (!timeStr) return '-';
  return dayjs(timeStr).format('YYYY年MM月DD HH:mm');
};

const getRecordColor = (type) => {
  if (type === 1) return '#4cd964'; // 入库绿
  if (type === 2) return '#ff6b6b'; // 出库红
  return '#ccc';
};

// 数据加载
const loadItems = async (isRefresh = false) => {
  if (isRefresh) {
    pagination.pageIndex = 1;
    itemsList.value = [];
  }

  try {
    const params = {
      ...searchForm,
      pageIndex: pagination.pageIndex,
      pageSize: pagination.pageSize
    };

    const response = await itemAPI.getItem(params);
    
    const newItems = response.data || [];
    
    if (isRefresh) {
      itemsList.value = newItems;
    } else {
      itemsList.value = [...itemsList.value, ...newItems];
    }

    // 更新分页信息
    pagination.totalCount = response.totalCount || 0;
    pagination.totalPages = response.totalPages || 1;
    pagination.pageIndex = response.pageIndex || 1;

    // 检查是否加载完毕
    finished.value = itemsList.value.length >= pagination.totalCount;
  } catch (error) {
    console.error('加载物品列表失败:', error);
    showToast('加载失败');
  }
};

const onLoad = () => {
  if (refreshing.value) {
    itemsList.value = [];
    refreshing.value = false;
  }
  
  pagination.pageIndex++;
  loadItems();
};

const onRefresh = () => {
  refreshing.value = true;
  finished.value = false;
  loading.value = true;
  loadItems(true).finally(() => {
    refreshing.value = false;
    loading.value = false;
  });
};

const onSearch = () => {
  showSearch.value = false;
  onRefresh();
};

const onFilterChange = () => {
  // 筛选改变时不需要重新加载数据，因为我们在computed中处理
};

const onSortChange = () => {
  // 排序改变时也不需要重新加载数据
};

const filterByStock = (type) => {
  activeFilter.value = type;
};

const resetFilters = () => {
  searchForm.name = '';
  activeFilter.value = 'all';
  sortField.value = 'updatedAt';
  onRefresh();
};

// 查看物品详情
const showItemDetail = async (item) => {
  currentItem.value = item;
  showDetailPopup.value = true;
  try {
    const res = await itemAPI.queryInOutRecords({
      id: item.itemId,
      type: 0,
      nume: '',
      orderNumber: '',
      startTime: null,
      endTime: null,
      pageIndex: 1,
      pageSize: 10,
    });
    
    if (res && res.data) {
      inOutRecords.value = res.data;
    } else {
      inOutRecords.value = [];
    }
  } catch (error) {
    showToast('获取记录失败');
    inOutRecords.value = [];
  }
};

// 初始化
onMounted(() => {
  onRefresh();
});
</script>

<style scoped>
.inventory-overview {
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

/* 搜索区域 */
.search-section {
  background: white;
  padding: 0 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

/* 统计卡片 */
.stats-section {
  padding: 20px 16px 0;
}

.stats-cards {
  margin-top: 8px;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 20px 12px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  cursor: pointer;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.12);
}

.card-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
}

.card-bg.total {
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.card-bg.in-stock {
  background: linear-gradient(135deg, #4cd964, #34e89e);
}

.card-bg.out-stock {
  background: linear-gradient(135deg, #ff6b6b, #ff8e53);
}

.stat-content {
  text-align: center;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
  font-size: 20px;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stat-icon.total {
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.stat-icon.in-stock {
  background: linear-gradient(135deg, #4cd964, #34e89e);
}

.stat-icon.out-stock {
  background: linear-gradient(135deg, #ff6b6b, #ff8e53);
}

.stat-number {
  font-size: 24px;
  font-weight: 800;
  color: #2c3e50;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 13px;
  color: #7f8c8d;
  margin-bottom: 8px;
  font-weight: 500;
}

/* 筛选工具栏 */
.filter-section {
  background: white;
  margin: 16px;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 16px;
}

.filter-tabs {
  flex: 1;
}

:deep(.van-tabs__line) {
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.sort-controls {
  flex-shrink: 0;
}

:deep(.van-dropdown-menu__bar) {
  background: transparent;
  box-shadow: none;
}

:deep(.van-dropdown-menu__title) {
  color: #667eea;
  font-size: 14px;
}

/* 库存列表 */
.inventory-list-section {
  margin: 0 16px;
}

.refresh-container {
  min-height: 400px;
}

.list-container {
  border-radius: 16px;
  overflow: hidden;
}

:deep(.custom-cell-group) {
  border-radius: 16px;
  overflow: hidden;
}

.inventory-item {
  transition: all 0.3s ease;
  border-bottom: 1px solid #f8f9fa;
  padding: 16px;
}

.inventory-item:last-child {
  border-bottom: none;
}

.inventory-item:hover {
  background: #f8f9fa;
}

/* 纯色块图标样式 */
.color-block-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  color: white;
  font-size: 20px;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.inventory-item:hover .color-block-icon {
  transform: scale(1.05);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.item-title {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  flex: 1;
  margin-right: 8px;
}

.item-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-row {
  display: flex;
  align-items: center;
  font-size: 13px;
}

.detail-label {
  color: #7f8c8d;
  min-width: 60px;
}

.detail-value {
  color: #2c3e50;
  flex: 1;
}

.detail-value.time {
  color: #95a5a6;
  font-size: 12px;
}

.item-quantity {
  text-align: right;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.quantity-number {
  font-size: 20px;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 2px;
}

.quantity-unit {
  font-size: 12px;
  color: #95a5a6;
  background: #f8f9fa;
  padding: 2px 6px;
  border-radius: 4px;
}

/* 库存状态样式 */
.in-stock .quantity-number {
  color: #4cd964;
}

.low-stock .quantity-number {
  color: #ffa726;
}

.out-of-stock .quantity-number {
  color: #ff6b6b;
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

/* 详情弹窗样式 */
:deep(.detail-popup) {
  border-radius: 20px 20px 0 0;
  overflow: hidden;
}

.popup-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f7f9fc;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 16px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.popup-title {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-name {
  font-size: 18px;
  font-weight: 700;
  color: #2c3e50;
}

.popup-subtitle {
  font-size: 14px;
  color: #7f8c8d;
}

.close-btn {
  min-width: 60px;
}

.record-list {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.record-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border-left: 4px solid;
  transition: transform 0.2s ease;
}

.record-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f1f3f4;
}

.record-time {
  font-size: 12px;
  color: #95a5a6;
}

.record-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.record-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.record-label {
  color: #7f8c8d;
  min-width: 60px;
}

.record-value {
  color: #2c3e50;
  font-weight: 500;
  text-align: right;
  flex: 1;
}

.record-order {
  font-family: monospace;
  background: #f8f9fa;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.record-remark {
  color: #667eea;
  font-style: italic;
}

.no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #95a5a6;
  text-align: center;
}

.no-data p {
  margin-top: 12px;
  font-size: 14px;
}

/* 响应式调整 */
@media (max-width: 480px) {
  .stats-section {
    padding: 16px 12px 0;
  }
  
  .filter-section {
    margin: 12px;
    padding: 12px;
    flex-direction: column;
    gap: 12px;
  }
  
  .inventory-list-section {
    margin: 0 12px;
  }
  
  .inventory-item {
    padding: 12px;
  }
  
  .color-block-icon {
    width: 40px;
    height: 40px;
    font-size: 18px;
    margin-right: 12px;
  }
  
  .item-title {
    font-size: 15px;
  }
  
  .quantity-number {
    font-size: 18px;
  }
  
  .popup-header {
    padding: 16px 12px;
  }
  
  .item-name {
    font-size: 16px;
  }
}
</style>