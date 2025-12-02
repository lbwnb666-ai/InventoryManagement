<template>
  <!-- 添加物品弹窗 -->
  <van-popup
    v-model:show="showPopup"
    position="center"
    round
    class="add-item-popup"
    :close-on-click-overlay="false"
    :style="{ width: '90%', maxWidth: '400px' }"
  >
    <div class="popup-container">
      <!-- 弹窗头部 -->
      <div class="popup-header">
        <div class="popup-title">
          <van-icon name="add-o" class="title-icon" />
          添加新物品
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
        <van-form @submit="onSubmit" ref="formRef" class="add-item-form">
          <!-- 物品名称 -->
          <div class="form-field">
            <label class="field-label">物品名称 <span class="required">*</span></label>
            <van-field
              v-model="form.name"
              name="name"
              placeholder="请输入物品名称"
              :rules="[
                { required: true, message: '请输入物品名称' },
                { validator: validateItemName, message: '物品名称格式不正确' }
              ]"
              clearable
              :disabled="loading"
            />
          </div>

          <!-- 物品编码 -->
          <div class="form-field">
            <label class="field-label">物品编码 <span class="required">*</span></label>
            <van-field
              v-model="form.code"
              name="code"
              placeholder="请输入物品编码"
              :rules="[
                { required: true, message: '请输入物品编码' },
                { validator: validateItemCode, message: '物品编码格式不正确' }
              ]"
              clearable
              :disabled="loading"
            />
          </div>

          <!-- 物品单位 -->
          <div class="form-field">
            <label class="field-label">物品单位 <span class="required">*</span></label>
            <van-field
              v-model="form.unit"
              name="unit"
              placeholder="请输入物品单位，如：件、个、箱"
              :rules="[
                { required: true, message: '请输入物品单位' },
                { validator: validateUnit, message: '单位格式不正确' }
              ]"
              clearable
              :disabled="loading"
            />
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
              :disabled="loading"
              class="submit-btn"
            >
              {{ loading ? '提交中...' : '确认添加' }}
            </van-button>
          </div>
        </van-form>
      </div>
    </div>
  </van-popup>
</template>

<script setup>
import { ref, reactive, watch, nextTick } from 'vue';
import { showToast } from 'vant';
import { itemAPI } from '@/api/item';

// 定义Props和Emits
const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:show', 'success']);

// 响应式数据
const showPopup = ref(false);
const loading = ref(false);
const errorMessage = ref('');
const formRef = ref(null);

// 表单数据
const form = reactive({
  name: '',
  code: '',
  specification:'',
  unit: ''
});

// 监听show属性变化
watch(() => props.show, (newVal) => {
  showPopup.value = newVal;
  if (newVal) {
    // 打开弹窗时重置表单和错误信息
    resetForm();
  }
});

// 监听弹窗显示状态
watch(showPopup, (newVal) => {
  emit('update:show', newVal);
});

// 表单验证方法
const validateItemName = (value) => {
  if (!value) return false;
  // 物品名称验证：2-50个字符，支持中文、英文、数字
  return /^[\u4e00-\u9fa5a-zA-Z0-9\s\-_（）()]{1,50}$/.test(value);
};

const validateItemCode = (value) => {
  if (!value) return false;
  // 物品编码验证：2-20个字符，支持英文、数字、下划线
  return /^[a-zA-Z0-9_\-]{2,20}$/.test(value);
};

const validateUnit = (value) => {
  if (!value) return false;
  // 单位验证：1-10个字符，支持中文、英文
  return /^[\u4e00-\u9fa5a-zA-Z]{1,10}$/.test(value);
};

// 重置表单
const resetForm = () => {
  form.name = '';
  form.code = '';
  form.unit = '';
  errorMessage.value = '';
  loading.value = false;
  
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

// 表单提交
const onSubmit = async () => {
  errorMessage.value = '';
  loading.value = true;

  try {
    // API调用
    const result = await itemAPI.addItem(form);
    
    if (result) {
      showToast('物品添加成功');
      emit('success', result);
      showPopup.value = false;
    } else {
      errorMessage.value = result.message || '添加失败，请稍后重试';
    }
  } catch (error) {
    // 接口报错时不关闭弹窗，显示错误信息
    errorMessage.value = error.message || '网络错误，请检查网络连接';
    console.error('添加物品失败:', error);
  } finally {
    loading.value = false;
  }
};

// 暴露方法给父组件
defineExpose({
  open: () => {
    showPopup.value = true;
    resetForm();
  },
  close: () => {
    showPopup.value = false;
  }
});
</script>

<style scoped>
.add-item-popup {
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
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

.add-item-form {
  width: 100%;
}

.form-field {
  margin-bottom: 20px;
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
  background: linear-gradient(135deg, #4cd964, #34e89e);
  border: none;
  box-shadow: 0 4px 15px rgba(76, 217, 100, 0.3);
  transition: all 0.3s ease;
}

.submit-btn:active:not(:disabled) {
  transform: translateY(1px);
}

.submit-btn:disabled {
  opacity: 0.6;
  transform: none;
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
}

/* 暗色模式支持 */
@media (prefers-color-scheme: dark) {
  .popup-container {
    background: #2c3e50;
  }
  
  .field-label {
    color: #ecf0f1;
  }
  
  :deep(.van-field) {
    background: #34495e;
    border-color: #4a6572;
  }
  
  :deep(.van-field__control) {
    color: #ecf0f1;
  }
  
  :deep(.van-field__control::placeholder) {
    color: #95a5a6;
  }
  
  :deep(.van-field:focus-within) {
    background: #3c4d61;
  }
}
</style>