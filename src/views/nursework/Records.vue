<template>
  <div class="page-card">
    <div class="table-toolbar">
      <span class="tip">默认展示自己服务客户的全部护理记录，选择客户可只看该客户的记录</span>
      <CustomerPicker v-model="customerId" source="mine" clearable style="width: 240px" @update:model-value="load" />
    </div>

    <el-table v-loading="loading" :data="list" border stripe>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="nursingName" label="护理项目" min-width="120">
        <template #default="{ row }">{{ row.nursingName || '—' }}</template>
      </el-table-column>
      <el-table-column prop="nursingContent" label="护理内容" min-width="180" show-overflow-tooltip>
        <template #default="{ row }">{{ fmtOrDash(row.nursingContent) }}</template>
      </el-table-column>
      <el-table-column label="执行时间" width="160">
        <template #default="{ row }">{{ fmtDateTime(row.nursingTime) }}</template>
      </el-table-column>
      <el-table-column prop="nursingCount" label="次数" width="80" />
      <el-table-column prop="customerId" label="客户ID" width="90" />
    </el-table>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { butlerListRecords } from '@/api/nurseRecord'
import { useUserStore } from '@/stores/user'
import { fmtDateTime, fmtOrDash } from '@/utils/format'
import CustomerPicker from '@/components/CustomerPicker.vue'

const userStore = useUserStore()
// null 表示不筛选客户，展示管家名下全部记录；后端同时按 userId 过滤
const customerId = ref(null)
const list = ref([])
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    list.value = (await butlerListRecords(customerId.value, userStore.userId)) || []
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.tip {
  color: #909399;
  font-size: 13px;
}
</style>
