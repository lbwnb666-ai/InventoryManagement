<template>
  <!-- 出入库操作弹窗 -->
  <van-popup
    v-model:show="showPopup"
    position="center"
    round
    class="in-out-popup"
    :close-on-click-overlay="false"
    :style="{ width: '90%', maxWidth: '420px' }"
  >
    <div class="popup-container">
      <!-- 弹窗头部 -->
      <div class="popup-header" :class="operationTypeClass">
        <div class="popup-title">
          <van-icon :name="operationIcon" class="title-icon" />
          {{ operationTitle }}
        </div>
        <van-button 
          size="small" 
          type="primary" 
          plain 
          @click="handleClose"
          :disabled="loading"
        >
          取消
        </van-button>
      </div>

      <!-- 表单区域 -->
      <div class="form-container">
        <van-form @submit="onSubmit" ref="formRef" class="in-out-form">
          <!-- 物品选择 -->
          <div class="form-field">
            <label class="field-label">选择物品 <span class="required">*</span></label>
            <van-field
              v-model="selectedItemName"
              readonly
              clickable
              name="itemId"
              placeholder="请选择物品"
              :rules="[{ required: true, message: '请选择物品' }]"
              @click="showItemPicker = true"
              :disabled="loading"
            />
            <van-icon name="arrow-down" class="field-suffix" />
          </div>

          <!-- 数量输入 -->
          <div class="form-field">
            <label class="field-label">操作数量 <span class="required">*</span></label>
            <van-field
              v-model="form.quantity"
              type="digit"
              name="quantity"
              placeholder="请输入操作数量"
              :rules="[
                { required: true, message: '请输入操作数量' },
                { validator: validateQuantity, message: '数量必须大于0' }
              ]"
              clearable
              :disabled="loading"
            />
          </div>

          <!-- 备注 -->
          <div class="form-field">
            <label class="field-label">备注信息</label>
            <van-field
              v-model="form.remark"
              name="remark"
              type="textarea"
              placeholder="请输入备注信息（可选）"
              rows="2"
              autosize
              maxlength="200"
              show-word-limit
              :disabled="loading"
            />
          </div>

          <!-- 物品信息预览 -->
          <div v-if="selectedItem" class="item-preview">
            <div class="preview-title">物品信息</div>
            <div class="preview-content">
              <div class="preview-row">
                <span class="preview-label">当前库存：</span>
                <span class="preview-value">{{ selectedItem.quantity }}</span>
              </div>
              <div v-if="showAfterQuantity" class="preview-row">
                <span class="preview-label">操作后库存：</span>
                <span 
                  class="preview-value" 
                  :class="getAfterQuantityClass"
                >
                  {{ afterQuantity }}
                </span>
              </div>
            </div>
          </div>

          <!-- 错误信息显示 -->
          <div v-if="errorMessage" class="error-message">
            <van-icon name="warning" class="error-icon" />
            {{ errorMessage }}
          </div>

          <!-- 提交按钮 -->
          <div class="form-actions">
            <van-button
              round
              block
              type="primary"
              native-type="submit"
              :loading="loading"
              :disabled="loading || !selectedItem"
              class="submit-btn"
              :class="operationTypeClass"
            >
              {{ loading ? '提交中...' : submitButtonText }}
            </van-button>
          </div>
        </van-form>
      </div>
    </div>

    <!-- 物品选择器 - 使用自定义选择器 -->
    <van-popup
      v-model:show="showItemPicker"
      position="bottom"
      round
      :style="{ height: '60%' }"
    >
      <div class="custom-picker">
        <div class="picker-header">
          <div class="picker-title">选择物品</div>
          <van-button size="small" type="primary" plain @click="showItemPicker = false">
            取消
          </van-button>
        </div>
        <div class="picker-content">
          <van-list
            v-model:loading="itemsLoading"
            :finished="!itemsLoading"
            finished-text="没有更多了"
          >
            <van-cell
              v-for="item in itemsList"
              :key="item.id"
              :title="`${item.itemName} (库存: ${item.quantity})`"
              clickable
              @click="onItemSelect(item)"
              :class="{ 'selected-item': selectedItem?.id === item.id }"
            >
              <template #right-icon>
                <van-icon v-if="selectedItem?.id === item.id" name="success" color="#4cd964" />
              </template>
            </van-cell>
          </van-list>
        </div>
      </div>
    </van-popup>
  </van-popup>
</template>

<script setup>
import { ref, reactive, watch, computed, nextTick } from 'vue';
import { useUserStore } from '@/store';
import { showToast } from 'vant';
import { itemAPI } from '@/api/item';

// 定义Props和Emits
const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  type: {
    type: Number,
    default: 1, // 1: 入库, 2: 出库
    validator: (value) => [1, 2].includes(value)
  }
});

const emit = defineEmits(['update:show', 'success']);

// Store
const userStore = useUserStore();

// 响应式数据
const showPopup = ref(false);
const loading = ref(false);
const errorMessage = ref('');
const formRef = ref(null);
const showItemPicker = ref(false);
const itemsLoading = ref(false);

// 物品数据
const itemsList = ref([]);
const selectedItem = ref(null);

// 表单数据
const form = reactive({
  itemId: null,
  quantity: '',
  remark: ''
});

// 计算属性
const operationTitle = computed(() => props.type === 1 ? '物品入库' : '物品出库');
const operationIcon = computed(() => props.type === 1 ? 'logistics' : 'send-gift-o');
const operationTypeClass = computed(() => props.type === 1 ? 'in-operation' : 'out-operation');
const submitButtonText = computed(() => props.type === 1 ? '确认入库' : '确认出库');

const selectedItemName = computed(() => {
  return selectedItem.value ? selectedItem.value.itemName : '';
});

const afterQuantity = computed(() => {
  if (!selectedItem.value || !form.quantity) return null;
  
  const current = selectedItem.value.quantity;
  const change = parseInt(form.quantity) || 0;
  
  return props.type === 1 ? current + change : current - change;
});

const showAfterQuantity = computed(() => {
  return selectedItem.value && form.quantity && afterQuantity.value !== null;
});

const getAfterQuantityClass = computed(() => {
  if (afterQuantity.value === null) return '';
  
  if (afterQuantity.value < 0) {
    return 'negative';
  } else if (afterQuantity.value === 0) {
    return 'zero';
  } else if (afterQuantity.value < 10) {
    return 'low';
  }
  return 'normal';
});

// 监听show属性变化
watch(() => props.show, async (newVal) => {
  showPopup.value = newVal;
  if (newVal) {
    // 打开弹窗时重置表单和错误信息
    resetForm();
    // 加载物品列表
    await loadItems();
  }
});

// 监听弹窗显示状态
watch(showPopup, (newVal) => {
  emit('update:show', newVal);
});

// 监听数量变化，验证出库数量
watch(() => form.quantity, (newVal) => {
  if (props.type === 2 && selectedItem.value && newVal) {
    const quantity = parseInt(newVal) || 0;
    const currentStock = selectedItem.value.quantity;
    
    if (quantity > currentStock) {
      errorMessage.value = `出库数量不能超过当前库存（${currentStock}）`;
    } else {
      errorMessage.value = '';
    }
  }
});

// 加载物品列表
const loadItems = async () => {
  itemsLoading.value = true;
  try {
    const response = await itemAPI.getAllItem();
    // 确保我们获取到的是普通数组而不是Proxy
    itemsList.value = JSON.parse(JSON.stringify(response.data || response));
    console.log('物品列表:', itemsList.value);
  } catch (error) {
    console.error('加载物品列表失败:', error);
    showToast('加载物品列表失败');
    itemsList.value = [];
  } finally {
    itemsLoading.value = false;
  }
};

// 表单验证方法
const validateQuantity = (value) => {
  if (!value) return false;
  const quantity = parseInt(value);
  return quantity > 0;
};

// 重置表单
const resetForm = () => {
  form.itemId = null;
  form.quantity = '';
  form.remark = '';
  selectedItem.value = null;
  errorMessage.value = '';
  loading.value = false;
  showItemPicker.value = false;
  
  // 重置表单验证状态
  nextTick(() => {
    if (formRef.value) {
      formRef.value.resetValidation();
    }
  });
};

// 关闭弹窗
const handleClose = () => {
  if (loading.value) {
    showToast('正在提交，请稍候...');
    return;
  }
  showPopup.value = false;
};

// 物品选择 - 使用自定义选择器
const onItemSelect = (item) => {
  console.log('选择物品:', item);
  selectedItem.value = item;
  form.itemId = item.id;
  showItemPicker.value = false;
  // 清空数量，让用户重新输入
  form.quantity = '';
  errorMessage.value = '';
  
  // 验证表单状态
  nextTick(() => {
    if (formRef.value) {
      formRef.value.validate('itemId');
    }
  });
};

// 表单提交
const onSubmit = async () => {
  errorMessage.value = '';
  
  // 验证物品是否已选择
  if (!selectedItem.value || !form.itemId) {
    errorMessage.value = '请先选择物品';
    return;
  }
  
  // 验证出库数量
  if (props.type === 2 && selectedItem.value) {
    const quantity = parseInt(form.quantity) || 0;
    const currentStock = selectedItem.value.quantity;
    
    if (quantity > currentStock) {
      errorMessage.value = `出库数量不能超过当前库存（${currentStock}）`;
      return;
    }
  }

  loading.value = true;

  try {
    // 获取操作人ID
    const operatorId = userStore.userInfo?.id;
    if (!operatorId) {
      throw new Error('未获取到用户信息，请重新登录');
    }

    // 准备提交数据
    const submitData = {
      itemId: form.itemId,
      type: props.type,
      quantity: parseInt(form.quantity),
      operator: operatorId,
      remark: form.remark || '无'
    };

    console.log('提交数据:', submitData);

    // 调用API
    const result = await itemAPI.inOutItem(submitData);
    
    if (result) {
      showToast(operationTitle.value + '成功');
      emit('success', {
        operation: props.type === 1 ? 'in' : 'out',
        data: result.data,
        item: selectedItem.value,
        quantity: parseInt(form.quantity)
      });
      showPopup.value = false;
    } else {
      errorMessage.value = result.message || operationTitle.value + '失败，请稍后重试';
    }
  } catch (error) {
    // 接口报错时不关闭弹窗，显示错误信息
    errorMessage.value = error.message || '网络错误，请检查网络连接';
    console.error(operationTitle.value + '失败:', error);
  } finally {
    loading.value = false;
  }
};

// 暴露方法给父组件
defineExpose({
  open: (type = 1) => {
    if (type) {
      console.log('设置操作类型:', type);
    }
    showPopup.value = true;
    resetForm();
    loadItems();
  },
  close: () => {
    showPopup.value = false;
  }
});
</script>

<style scoped>
.in-out-popup {
  border-radius: 20px;
  overflow: hidden;
}

.popup-container {
  background: white;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  color: white;
  transition: all 0.3s ease;
}

.popup-header.in-operation {
  background: linear-gradient(135deg, #4cd964, #34e89e);
}

.popup-header.out-operation {
  background: linear-gradient(135deg, #ff6b6b, #ff8e53);
}

.popup-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
}

.title-icon {
  font-size: 20px;
}

.form-container {
  padding: 24px;
}

.in-out-form {
  width: 100%;
}

.form-field {
  margin-bottom: 20px;
  position: relative;
}

.field-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 8px;
}

.required {
  color: #ff6b6b;
}

:deep(.van-field) {
  border-radius: 12px;
  border: 2px solid #f1f3f4;
  transition: all 0.3s ease;
  background: #fafbfc;
  padding-right: 40px;
}

:deep(.van-field--error) {
  border-color: #ff6b6b;
  background: #fff8f8;
}

:deep(.van-field:focus-within) {
  border-color: #667eea;
  background: white;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

:deep(.van-field__control) {
  color: #2c3e50;
  font-size: 14px;
}

:deep(.van-field__control::placeholder) {
  color: #95a5a6;
}

.field-suffix {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #95a5a6;
  font-size: 16px;
  pointer-events: none;
}

.quantity-unit {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #7f8c8d;
  font-size: 14px;
  background: #f8f9fa;
  padding: 2px 6px;
  border-radius: 4px;
}

/* 物品信息预览 */
.item-preview {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 16px;
  margin: 16px 0;
  border-left: 4px solid #667eea;
}

.preview-title {
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 8px;
}

.preview-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.preview-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.preview-label {
  color: #7f8c8d;
}

.preview-value {
  color: #2c3e50;
  font-weight: 500;
}

.preview-value.negative {
  color: #ff6b6b;
  font-weight: 600;
}

.preview-value.zero {
  color: #ffa726;
  font-weight: 600;
}

.preview-value.low {
  color: #ffa726;
}

.preview-value.normal {
  color: #4cd964;
}

/* 错误信息样式 */
.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #fff8f8;
  border: 1px solid #ffcdd2;
  border-radius: 10px;
  color: #e74c3c;
  font-size: 14px;
  margin: 16px 0;
  animation: shake 0.5s ease-in-out;
}

.error-icon {
  font-size: 16px;
  flex-shrink: 0;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

/* 提交按钮区域 */
.form-actions {
  margin-top: 24px;
}

.submit-btn {
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  border: none;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.submit-btn.in-operation {
  background: linear-gradient(135deg, #4cd964, #34e89e);
}

.submit-btn.out-operation {
  background: linear-gradient(135deg, #ff6b6b, #ff8e53);
}

.submit-btn:active:not(:disabled) {
  transform: translateY(1px);
}

.submit-btn:disabled {
  opacity: 0.6;
  transform: none;
}

/* 自定义选择器样式 */
.custom-picker {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f1f3f4;
}

.picker-title {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.picker-content {
  flex: 1;
  overflow-y: auto;
}

.selected-item {
  background-color: #f0f9ff;
}

/* 加载状态样式 */
:deep(.van-loading__spinner) {
  color: white;
}

/* 响应式调整 */
@media (max-width: 480px) {
  .popup-header {
    padding: 16px 20px;
  }
  
  .popup-title {
    font-size: 16px;
  }
  
  .form-container {
    padding: 20px;
  }
  
  .form-field {
    margin-bottom: 16px;
  }
  
  .submit-btn {
    height: 44px;
    font-size: 15px;
  }
  
  .item-preview {
    padding: 12px;
  }
  
  .picker-header {
    padding: 12px 16px;
  }
}
</style>