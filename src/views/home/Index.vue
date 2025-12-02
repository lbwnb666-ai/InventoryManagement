<template>
  <!-- 顶部导航栏 -->
  <van-nav-bar title="库存概览" fixed placeholder class="custom-nav-bar"></van-nav-bar>
  <div class="home-container">
    <!-- 数据概览卡片 -->
    <div class="stats-section">
      <div class="section-title">数据总览</div>
      <div class="stats-cards">
        <van-row gutter="16">
          <van-col span="8">
            <div class="stat-card" @click="filterByStatus('all')">
              <div class="card-bg total"></div>
              <div class="stat-content">
                <div class="stat-icon total">
                  <van-icon name="send-gift-o" />
                </div>
                <div class="stat-number">{{ totalItems }}</div>
                <div class="stat-label">总物品数</div>
                <div class="stat-trend">
                  <van-icon name="arrow-up" color="#4cd964" />
                  <span class="trend-text">较上月</span>
                </div>
              </div>
            </div>
          </van-col>
          <van-col span="8">
            <div class="stat-card" @click="filterByStatus('inStock')">
              <div class="card-bg in-stock"></div>
              <div class="stat-content">
                <div class="stat-icon in-stock">
                  <van-icon name="passed" />
                </div>
                <div class="stat-number">{{ inStockItems }}</div>
                <div class="stat-label">在库物品</div>
                <div class="stat-trend">
                  <van-icon name="arrow-up" color="#4cd964" />
                  <span class="trend-text">库存充足</span>
                </div>
              </div>
            </div>
          </van-col>
          <van-col span="8">
            <div class="stat-card" @click="filterByStatus('outOfStock')">
              <div class="card-bg out-stock"></div>
              <div class="stat-content">
                <div class="stat-icon out-stock">
                  <van-icon name="warning" />
                </div>
                <div class="stat-number">{{ outOfStockItems }}</div>
                <div class="stat-label">缺货物品</div>
                <div class="stat-trend">
                  <van-icon name="arrow-down" color="#ff6b6b" />
                  <span class="trend-text">需补货</span>
                </div>
              </div>
            </div>
          </van-col>
        </van-row>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="chart-section">
      <div class="section-header">
        <div class="section-title-with-icon">
          <van-icon name="chart-trending-o" class="section-icon" />
          <h3 class="section-title">库存分布</h3>
        </div>
        <div class="chart-controls">
          <van-button size="mini" round @click="refreshChart">
            <van-icon name="replay" size="12" />
            刷新
          </van-button>
        </div>
      </div>
      <div class="chart-container">
        <div ref="chartRef" class="chart"></div>
      </div>
      <div class="chart-legend">
        <div class="legend-item" v-for="(item, index) in chartLegend" :key="index">
          <div class="legend-color" :style="{ backgroundColor: item.color }"></div>
          <span class="legend-text">{{ item.name }}</span>
        </div>
      </div>
    </div>

    <!-- 库存列表 -->
    <div class="inventory-section">
      <div class="section-header">
        <div class="section-title-with-icon">
          <van-icon name="orders-o" class="section-icon" />
          <h3 class="section-title">最近库存</h3>
        </div>
        <span class="see-all" @click="goToInventory">
          查看全部
          <van-icon name="arrow" size="12" />
        </span>
      </div>
      <div class="inventory-list">
        <van-cell-group inset class="custom-cell-group">
          <van-cell
            v-for="(item, index) in displayedInventory"
            :key="item.id"
            :class="['inventory-item', getStockLevelClass(item.quantity)]"
            @click="showItemDetail(item)"
          >
            <template #icon>
              <div 
                class="color-block-icon"
                :style="{ backgroundColor: getItemColor(item.itemName, index) }"
              >
              </div>
            </template>
            <template #title>
              <div class="item-title">{{ item.itemName }}</div>
            </template>
            <template #label>
              <div class="item-label">
                <van-tag :type="getStockTagType(item.quantity)" size="small">
                  {{ getStockStatus(item.quantity) }}
                </van-tag>
              </div>
            </template>
            <template #value>
              <div class="item-quantity">
                <div class="quantity-number">{{ item.quantity }}</div>
                <div class="quantity-unit">件</div>
              </div>
            </template>
          </van-cell>
        </van-cell-group>
      </div>
    </div>

    <!-- 操作悬浮按钮 -->
    <van-floating-bubble
      v-model:offset="offset"
      axis="xy"
      magnetic="x"
      :gap="20"
      icon="plus"
      class="custom-floating-btn"
      @click="showActionSheet = true"
    />

    <!-- 操作动作面板 -->
    <van-action-sheet
      v-model:show="showActionSheet"
      :actions="actions"
      cancel-text="取消"
      close-on-click-action
      class="custom-action-sheet"
      @select="onActionSelect"
    />
  </div>

  <!-- 优化后的弹窗 -->
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
              <span class="record-value">{{ record.quantity }} 件</span>
            </div>
            <div class="record-row">
              <span class="record-label">变更前：</span>
              <span class="record-value">{{ record.beforeQuantity }} 件</span>
            </div>
            <div class="record-row">
              <span class="record-label">变更后：</span>
              <span class="record-value">{{ record.afterQuantity }} 件</span>
            </div>
            <div class="record-row">
              <span class="record-label">操作流水号：</span>
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
</template>

<script setup>
import { ref, reactive, onMounted, computed, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { showToast } from 'vant';
import * as echarts from 'echarts';
import { itemAPI } from '@/api/item';
import dayjs from 'dayjs'
import AddItemPopup from '@/components/AddItemPopup.vue';
import  InOutRecords from '@/components/InOutRecords.vue';

const router = useRouter();

// 响应式数据
const inventoryList = ref([]);
const showActionSheet = ref(false);
const offset = reactive({ x: 20, y: 80 });
const chartRef = ref(null);
const chartLegend = ref([]);

//出入库
const showInOutPopup = ref(false);
const operationType = ref(1); // 1: 入库, 2: 出库

//浮动按钮
const showAddItemPopup = ref(false);
const openAddItemPopup = () => {
  showAddItemPopup.value = true;
};

//入库
const handleStockIn = () => {
  operationType.value = 1;
  showInOutPopup.value = true;
};

//出库
const handleStockOut = () => {
  operationType.value = 2;
  showInOutPopup.value = true;
};

const handleAddItem = () => {
  showToast(`物品添加成功`);
};

//查看物品详细数据
const showDetailPopup = ref(false)
const inOutRecords = ref([])
const currentItem = ref(null)

// 颜色配置 - 与饼图颜色保持一致
const colorPalette = [
  "#5470C6", "#91CC75", "#EE6666", "#73C0DE", "#FAC858",
  "#9A60B4", "#EA7CCC", "#3BA272", "#FC8452", "#6E7074",
  "#61A0A8", "#D48265", "#749F83", "#CA8622", "#BDA29A",
  "#FF9F7F", "#FFDD55", "#55D8C1", "#B15EFF", "#FFA1CF"
];

// 模拟数据
const mockData = ref([]);

// 计算属性
const totalItems = computed(() => inventoryList.value.length);
const inStockItems = computed(() => inventoryList.value.filter(item => item.quantity > 0).length);
const outOfStockItems = computed(() => inventoryList.value.filter(item => item.quantity === 0).length);
const displayedInventory = computed(() => inventoryList.value.slice(0, 4));

// 操作按钮列表
const actions = [
  { id:1,name: '添加物品', icon: 'add-o', color: '#3498db' },
  { id:2,name: '物品入库', icon: 'logistics', color: '#4cd964' },
  { id:3,name: '物品出库', icon: 'send-gift-o', color: '#ff6b6b' },
  { id:4,name: '流水总览', icon: 'notes-o', color: '#ffa726' }
];

// 方法 - 获取物品颜色
const getItemColor = (itemName, index) => {
  
  // 如果没有匹配，使用索引对应的颜色
  return colorPalette[index % colorPalette.length];
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

const onActionSelect = (action) => {
  showActionSheet.value = false;
  if (action.id === 1) {
    openAddItemPopup();
  } else if (action.id === 2) {
    handleStockIn();
  }else if (action.id === 3) {
    handleStockOut();
  }
  else if (action.id === 4) {
    router.push('/serial');
  }
  
};

const goToInventory = () => {
  router.push('/inventoryOverview');
};

// 点击查看物品详情
const showItemDetail = async (item) => {
  currentItem.value = item
  showDetailPopup.value = true
  try {
    const res = await itemAPI.queryInOutRecords({
         id: item.id,
         type: 0,
         nume:'',
         orderNumber: '',
         startTime:null,
         endTime:null,
         pageIndex: 1,
         pageSize: 10,
        })
    
    if (res && res.data) {
      inOutRecords.value = res.data
    console.log(inOutRecords.value)
    } else {
      inOutRecords.value = []
    }
  } catch (error) {
    showToast('获取记录失败')
    inOutRecords.value = []
  }
}

// 根据 type 获取卡片颜色
const getRecordColor = (type) => {
  if (type === 1) return '#4cd964' // 入库绿
  if (type === 2) return '#ff6b6b' // 出库红
  return '#ccc'
}

// 格式化时间
const formatOperateTime = (timeStr) => {
  if (!timeStr) return '-'
  return dayjs(timeStr).format('YYYY年MM月DD HH:mm')
}

const filterByStatus = (status) => {
  showToast(`筛选: ${status}`);
};

const refreshChart = async() => {
  showToast('图表已刷新');
  await getItem();
  initChart();
};

// 初始化图表
const initChart = () => {
  nextTick(() => {
    if (!chartRef.value) return;

    const chart = echarts.init(chartRef.value);

    const chartData = inventoryList.value
      .filter(item => item.quantity > 0)
      .slice(0, 6)
      .map((item, index) => ({
        name: item.itemName,
        value: item.quantity,
        itemStyle: {
          color: getItemColor(item.itemName, index)
        }
      }));

    // 图例数据
    chartLegend.value = chartData.map(item => ({
      name: item.name,
      color: item.itemStyle.color
    }));

    const option = {
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e8e8e8',
        borderWidth: 1,
        textStyle: {
          color: '#2c3e50'
        },
        formatter: '{a}<br/>{b}: {c} 件 ({d}%)'
      },
      series: [
        {
          name: '库存分布',
          type: 'pie',
          radius: ['55%', '75%'],
          center: ['50%', '45%'],
          itemStyle: {
            borderRadius: 8,
            borderColor: '#fff',
            borderWidth: 3
          },
          label: { show: false },
          labelLine: { show: false },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0,0,0,0.25)'
            }
          },
          data: chartData
        }
      ]
    };

    chart.setOption(option);

    window.addEventListener('resize', () => chart.resize());
  });
};
const getItem = async () => {
   mockData.value = await itemAPI.getAllItem();
}
// 生命周期
onMounted(async() => {
   await getItem()
  // 模拟API调用
  setTimeout(() => {
    inventoryList.value = mockData.value;
    initChart();
  }, 800);
});
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f7f9fc 0%, #f1f5f9 100%);
  padding-bottom: 50px;
}

/* 导航栏样式 */
:deep(.custom-nav-bar) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

:deep(.custom-nav-bar .van-nav-bar__title) {
  color: white;
  font-weight: 600;
}

/* 数据概览区域 */
.stats-section {
  padding: 20px 16px 0;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 16px;
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

.stat-trend {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 11px;
  color: #95a5a6;
}

/* 图表区域 */
.chart-section {
  background: white;
  margin: 24px 16px;
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
}

.chart-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-title-with-icon {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-icon {
  color: #667eea;
  font-size: 18px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

.chart-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chart-container {
  width: 100%;
  height: 220px;
  margin-bottom: 16px;
}

.chart {
  width: 100%;
  height: 100%;
}

.chart-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  padding-top: 16px;
  border-top: 1px solid #f1f3f4;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #7f8c8d;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.legend-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 60px;
}

/* 库存列表区域 */
.inventory-section {
  background: white;
  margin: 0 16px;
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
}

.inventory-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(135deg, #4cd964, #34e89e);
}

.see-all {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #3498db;
  cursor: pointer;
  font-weight: 500;
}

.inventory-list {
  margin-top: 8px;
}

:deep(.custom-cell-group) {
  border-radius: 12px;
  overflow: hidden;
}

.inventory-item {
  transition: all 0.3s ease;
  border-bottom: 1px solid #f8f9fa;
}

.inventory-item:last-child {
  border-bottom: none;
}

.inventory-item:hover {
  background: #f8f9fa;
}

/* 纯色块图标样式 */
.color-block-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  color: white;
  font-size: 18px;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.inventory-item:hover .color-block-icon {
  transform: scale(1.05);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.item-title {
  font-size: 15px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
}

.item-label {
  display: flex;
  align-items: center;
  gap: 8px;
}

.item-quantity {
  text-align: right;
}

.quantity-number {
  font-size: 18px;
  font-weight: 700;
  color: #2c3e50;
  line-height: 1;
}

.quantity-unit {
  font-size: 11px;
  color: #95a5a6;
  margin-top: 2px;
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

/* 悬浮按钮 */
:deep(.custom-floating-btn) {
  --van-floating-bubble-size: 60px;
  --van-floating-bubble-background: linear-gradient(135deg, #667eea, #764ba2);
  --van-floating-bubble-icon-size: 24px;
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

/* 操作面板 */
:deep(.custom-action-sheet .van-action-sheet__item) {
  font-size: 16px;
  font-weight: 500;
}

:deep(.custom-action-sheet .van-action-sheet__cancel) {
  color: #7f8c8d;
}

/* 优化后的弹窗样式 */
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
  
  .chart-section,
  .inventory-section {
    margin: 16px 12px;
    padding: 16px;
  }
  
  .stat-number {
    font-size: 20px;
  }
  
  .chart-container {
    height: 200px;
  }
  
  .color-block-icon {
    width: 36px;
    height: 36px;
  }
  
  .popup-header {
    padding: 16px 12px;
  }
  
  .item-name {
    font-size: 16px;
  }
  
  .record-card {
    padding: 12px;
  }
}
</style>