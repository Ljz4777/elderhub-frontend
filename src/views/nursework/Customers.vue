<template>
  <div class="page-card">
    <div class="table-toolbar">
      <div class="toolbar-filters">
        <el-input
          v-model="query.customerName"
          placeholder="客户姓名"
          clearable
          style="width: 160px"
          @keyup.enter="search"
          @clear="search"
        />
        <el-button type="primary" :icon="Search" @click="search">查询</el-button>
      </div>
    </div>

    <el-table v-loading="loading" :data="list" border stripe>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="customer_name" label="姓名" min-width="100" />
      <el-table-column label="性别" width="80">
        <template #default="{ row }">
          <StatusTag :value="row.customer_sex" :dict="CUSTOMER_SEX" />
        </template>
      </el-table-column>
      <el-table-column prop="customer_age" label="年龄" width="80" />
      <el-table-column prop="room_no" label="房间" width="90">
        <template #default="{ row }">{{ fmtOrDash(row.room_no) }}</template>
      </el-table-column>
      <el-table-column prop="contact_tel" label="联系电话" width="130">
        <template #default="{ row }">{{ fmtOrDash(row.contact_tel) }}</template>
      </el-table-column>
      <el-table-column prop="psychosomatic_state" label="身心状况" min-width="140" show-overflow-tooltip>
        <template #default="{ row }">{{ fmtOrDash(row.psychosomatic_state) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openItems(row)">护理项目</el-button>
          <el-button link type="success" @click="openRecord(row)">录入记录</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div style="margin-top: 14px; display: flex; justify-content: flex-end">
      <Pagination v-model:page="query.pageNum" v-model:size="query.pageSize" :total="total" @change="load" />
    </div>

    <!-- 客户护理项目弹窗（含剩余次数进度） -->
    <el-dialog v-model="itemsVisible" :title="`护理项目 - ${current.customer_name || ''}`" width="640px">
      <el-table :data="items" border size="small" v-loading="itemsLoading">
        <el-table-column prop="nursingName" label="项目" min-width="110" />
        <el-table-column prop="serialNumber" label="编号" width="90">
          <template #default="{ row }">{{ row.serialNumber || '—' }}</template>
        </el-table-column>
        <el-table-column label="剩余次数" min-width="150">
          <template #default="{ row }">
            <div class="num-row">
              <el-progress
                :percentage="itemPct(row)"
                :stroke-width="14"
                :text-inside="true"
                :status="row.nurseNumber <= 0 ? 'exception' : 'success'"
              />
              <span class="num-text">{{ row.nurseNumber ?? '—' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="到期日" width="100">
          <template #default="{ row }">{{ fmtDate(row.maturityTime) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <StatusTag :value="row.status" :dict="ITEM_STATUS" />
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 录入护理记录弹窗 -->
    <el-dialog v-model="recordVisible" title="录入护理记录" width="480px">
      <el-form ref="recordFormRef" :model="recordForm" :rules="recordRules" label-width="90px">
        <el-form-item label="护理项目" prop="itemId">
          <el-select v-model="recordForm.itemId" style="width: 100%">
            <el-option
              v-for="item in items"
              :key="item.id"
              :label="`${item.nursingName}（剩余 ${item.nurseNumber ?? 0} 次）`"
              :value="item.itemId"
              :disabled="item.status !== 1"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="执行时间" prop="nursingTime">
          <el-date-picker
            v-model="recordForm.nursingTime"
            type="datetime"
            value-format="YYYY-MM-DDTHH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="执行次数" prop="nursingCount">
          <el-input-number v-model="recordForm.nursingCount" :min="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="护理内容" prop="nursingContent">
          <el-input v-model="recordForm.nursingContent" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="recordVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="doSaveRecord">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { listMyCustomers, listCustomerItems } from '@/api/nurseDaily'
import { butlerSaveRecord } from '@/api/nurseRecord'
import { useUserStore } from '@/stores/user'
import { CUSTOMER_SEX, ITEM_STATUS } from '@/utils/constants'
import { fmtDate, fmtOrDash } from '@/utils/format'
import Pagination from '@/components/Pagination.vue'
import StatusTag from '@/components/StatusTag.vue'

const userStore = useUserStore()
const query = reactive({ customerName: '', pageNum: 1, pageSize: 10, userId: null })
const list = ref([])
const total = ref(0)
const loading = ref(false)
const saving = ref(false)

const itemsVisible = ref(false)
const itemsLoading = ref(false)
const current = ref({})
const items = ref([])

const recordVisible = ref(false)
const recordFormRef = ref()
const recordForm = reactive({ itemId: null, nursingTime: '', nursingCount: 1, nursingContent: '' })
const recordRules = {
  itemId: [{ required: true, message: '请选择护理项目', trigger: 'change' }],
  nursingTime: [{ required: true, message: '请选择执行时间', trigger: 'change' }],
  nursingCount: [{ required: true, message: '请填写执行次数', trigger: 'blur' }],
  nursingContent: [{ required: true, message: '请填写护理内容', trigger: 'blur' }],
}

async function load() {
  loading.value = true
  try {
    const page = await listMyCustomers({ ...query, userId: userStore.userId })
    list.value = page.list
    total.value = page.total
  } finally {
    loading.value = false
  }
}

function search() {
  query.pageNum = 1
  load()
}

async function openItems(row) {
  current.value = row
  itemsVisible.value = true
  itemsLoading.value = true
  try {
    items.value = (await listCustomerItems(row.id, userStore.userId)) || []
  } finally {
    itemsLoading.value = false
  }
}

function itemPct(row) {
  // 假设项目总次数约 30 为满（后端未返回总次数，进度仅作参考）
  return Math.max(0, Math.min(100, Math.round(((row.nurseNumber || 0) / 30) * 100)))
}

function openRecord(row) {
  current.value = row
  Object.assign(recordForm, { itemId: null, nursingTime: '', nursingCount: 1, nursingContent: '' })
  recordVisible.value = true
  // 预载项目供选择
  listCustomerItems(row.id, userStore.userId)
    .then((data) => {
      items.value = data || []
    })
    .catch(() => {})
}

async function doSaveRecord() {
  await recordFormRef.value.validate()
  saving.value = true
  try {
    await butlerSaveRecord(
      {
        customerId: current.value.id,
        itemId: recordForm.itemId,
        nursingTime: recordForm.nursingTime,
        nursingContent: recordForm.nursingContent,
        nursingCount: recordForm.nursingCount,
        userId: userStore.userId,
      },
      userStore.userId
    )
    ElMessage.success('录入成功')
    recordVisible.value = false
    if (itemsVisible.value) {
      items.value = (await listCustomerItems(current.value.id, userStore.userId)) || []
    }
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.num-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.num-row :deep(.el-progress) {
  flex: 1;
}
.num-text {
  width: 34px;
  text-align: right;
  font-size: 13px;
  color: #606266;
}
</style>
