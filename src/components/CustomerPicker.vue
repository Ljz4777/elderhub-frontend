<template>
  <el-select
    :model-value="modelValue"
    placeholder="请选择客户"
    filterable
    :clearable="clearable"
    :loading="loading"
    style="width: 100%"
    @change="emit('update:modelValue', $event)"
  >
    <el-option v-for="c in options" :key="c.id" :label="c.label" :value="c.id" />
  </el-select>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { listNoNurse } from '@/api/customer'
import { listDetails } from '@/api/bed'
import { listMyCustomers } from '@/api/nurseDaily'
import { useUserStore } from '@/stores/user'

/**
 * 客户下拉选择器
 * source: 'no-nurse' 无管家客户池（默认）| 'live' 在住客户（床位使用详情）| 'mine' 当前管家自己的客户
 * applyType: 1-退住申请候选人（排除床位空闲）| 2-外出申请候选人（再排除有待审核退住申请的客户）
 * v-model:modelValue 始终绑定客户ID（customerId），不是入住记录ID
 */
const props = defineProps({
  modelValue: { type: [Number, String], default: null },
  source: { type: String, default: 'no-nurse' },
  applyType: { type: [String, Number], default: '' },
  clearable: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

const userStore = useUserStore()
const options = ref([])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    if (props.source === 'mine') {
      // 只列当前管家名下的客户，避免选了别人的客户被后端拦截
      const page = await listMyCustomers({ pageNum: 1, pageSize: 500, userId: userStore.userId })
      options.value = (page.list || []).map((c) => ({
        id: c.id,
        label: `${c.customer_name || `客户${c.id}`}（ID:${c.id}${c.room_no ? ' · ' + c.room_no : ''}）`,
      }))
    } else if (props.source === 'live') {
      // customerType=0：避免后端默认只筛“自理老人”，申请时需看到全部在住老人
      const page = await listDetails({
        status: 1,
        customerType: 0,
        pageNum: 1,
        pageSize: 500,
        applyType: props.applyType === '' ? undefined : props.applyType,
      })
      options.value = (page.list || []).map((b) => ({
        id: b.customerId,
        label: `${b.customerName || `客户${b.customerId}`}（ID:${b.customerId}${b.bedNo ? ' · ' + b.bedNo : ''}）`,
      }))
    } else {
      const list = (await listNoNurse()) || []
      options.value = list.map((c) => ({
        id: c.id,
        label: `${c.customer_name || `客户${c.id}`}（ID:${c.id}）`,
      }))
    }
  } finally {
    loading.value = false
  }
})
</script>
