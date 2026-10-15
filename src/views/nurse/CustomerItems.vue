<template>
  <div class="page-card">
    <div class="table-toolbar">
      <div class="toolbar-filters">
        <el-select
          v-model="customerId"
          placeholder="请选择客户"
          filterable
          clearable
          style="width: 220px"
          @change="onCustomerChange"
        >
          <el-option
            v-for="c in customerOptions"
            :key="c.customerId"
            :label="`${c.customerName}（${c.roomNo || '无房间'}）`"
            :value="c.customerId"
          />
        </el-select>
        <span v-if="hasLevel" class="tip">当前已设置护理级别</span>
      </div>
      <div v-if="customerId">
        <el-button v-if="!hasLevel" type="primary" @click="openLevel">设置护理级别</el-button>
        <el-popconfirm v-else title="移除级别将同时移除级别绑定的项目，确认？" @confirm="doRemoveLevel">
          <template #reference>
            <el-button type="danger" plain>移除护理级别</el-button>
          </template>
        </el-popconfirm>
        <el-button type="primary" plain :icon="Plus" @click="openBuy">购买项目</el-button>
      </div>
    </div>

    <el-empty v-if="!customerId" description="请先选择客户" />
    <el-table v-else v-loading="loading" :data="list" border stripe>
      <el-table-column prop="nursingName" label="项目名称" min-width="120" />
      <el-table-column prop="serialNumber" label="编号" width="100">
        <template #default="{ row }">{{ row.serialNumber || '—' }}</template>
      </el-table-column>
      <el-table-column label="来源" width="90">
        <template #default="{ row }">
          <el-tag :type="row.levelId ? 'warning' : 'info'" size="small">
            {{ row.levelId ? '级别绑定' : '单独购买' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="servicePrice" label="价格(元)" width="90">
        <template #default="{ row }">{{ row.servicePrice ?? '—' }}</template>
      </el-table-column>
      <el-table-column prop="nurseNumber" label="剩余次数" width="90" />
      <el-table-column label="购买日期" width="110">
        <template #default="{ row }">{{ fmtDate(row.buyTime) }}</template>
      </el-table-column>
      <el-table-column label="到期日期" width="110">
        <template #default="{ row }">{{ fmtDate(row.maturityTime) }}</template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <StatusTag :value="row.status" :dict="ITEM_STATUS" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="140" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openRenew(row)">续费</el-button>
          <el-popconfirm title="确认移除该项目？" @confirm="doRemoveItem(row)">
            <template #reference>
              <el-button link type="danger">移除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <!-- 设置护理级别弹窗 -->
    <el-dialog v-model="levelVisible" title="设置护理级别" width="420px">
      <el-form label-width="90px">
        <el-form-item label="护理级别" required>
          <el-select v-model="levelId" placeholder="请选择级别" style="width: 100%">
            <el-option v-for="l in levelOptions" :key="l.id" :label="l.level_name" :value="l.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <span class="tip">设置后将自动绑定该级别下全部护理项目（各 1 次，有效期 3 个月）</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="levelVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="doSetLevel">确定</el-button>
      </template>
    </el-dialog>

    <!-- 购买项目弹窗 -->
    <el-dialog v-model="buyVisible" title="购买护理项目" width="460px">
      <el-form ref="buyFormRef" :model="buyForm" :rules="buyRules" label-width="90px">
        <el-form-item label="护理项目" prop="itemId">
          <el-select v-model="buyForm.itemId" placeholder="请选择项目" style="width: 100%">
            <el-option
              v-for="c in contentOptions"
              :key="c.id"
              :label="`${c.nursing_name}（${c.service_price}元）`"
              :value="c.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="购买次数" prop="addCount">
          <el-input-number v-model="buyForm.addCount" :min="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="到期日期" prop="maturityTime">
          <el-date-picker
            v-model="buyForm.maturityTime"
            type="date"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="buyVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="doBuy">购买</el-button>
      </template>
    </el-dialog>

    <!-- 续费弹窗 -->
    <el-dialog v-model="renewVisible" :title="`续费 - ${current.nursingName || ''}`" width="420px">
      <el-form label-width="90px">
        <el-form-item label="增加次数" required>
          <el-input-number v-model="renewCount" :min="1" style="width: 100%" />
        </el-form-item>
        <el-form-item>
          <span class="tip">续费将同时延长有效期 3 个月</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="renewVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="doRenew">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { listDetails } from '@/api/bed'
import { listLevels } from '@/api/nurseLevel'
import { listContents } from '@/api/nurseContent'
import {
  listCustomerItemsAdmin,
  setCustomerLevel,
  removeCustomerLevel,
  buyItem,
  renewItem,
  removeCustomerItem,
} from '@/api/customerItem'
import { ITEM_STATUS } from '@/utils/constants'
import { fmtDate } from '@/utils/format'
import StatusTag from '@/components/StatusTag.vue'

const customerOptions = ref([])
const customerId = ref(null)
const list = ref([])
const loading = ref(false)
const saving = ref(false)

const hasLevel = computed(() => list.value.some((i) => i.levelId != null))

async function loadCustomers() {
  const page = await listDetails({ status: 1, customerType: 0, pageNum: 1, pageSize: 100 })
  // 同一客户可能有多条在住记录，按客户去重
  const map = new Map()
  for (const row of page.list) {
    if (!map.has(row.customerId)) map.set(row.customerId, row)
  }
  customerOptions.value = [...map.values()]
}

async function load() {
  if (!customerId.value) return
  loading.value = true
  try {
    list.value = (await listCustomerItemsAdmin(customerId.value)) || []
  } finally {
    loading.value = false
  }
}

function onCustomerChange() {
  list.value = []
  load()
}

/* ---------- 设置/移除护理级别 ---------- */
const levelVisible = ref(false)
const levelId = ref(null)
const levelOptions = ref([])

async function openLevel() {
  levelId.value = null
  const page = await listLevels({ pageNum: 1, pageSize: 100, levelStatus: 1 })
  levelOptions.value = page.list
  levelVisible.value = true
}

async function doSetLevel() {
  if (!levelId.value) {
    ElMessage.warning('请选择护理级别')
    return
  }
  saving.value = true
  try {
    await setCustomerLevel(customerId.value, levelId.value)
    ElMessage.success('设置成功')
    levelVisible.value = false
    load()
  } finally {
    saving.value = false
  }
}

async function doRemoveLevel() {
  await removeCustomerLevel(customerId.value)
  ElMessage.success('已移除护理级别')
  load()
}

/* ---------- 购买项目 ---------- */
const buyVisible = ref(false)
const buyFormRef = ref()
const buyForm = reactive({ itemId: null, addCount: 1, maturityTime: '' })
const buyRules = {
  itemId: [{ required: true, message: '请选择护理项目', trigger: 'change' }],
  addCount: [{ required: true, message: '请填写购买次数', trigger: 'blur' }],
}
const contentOptions = ref([])

async function openBuy() {
  Object.assign(buyForm, { itemId: null, addCount: 1, maturityTime: '' })
  const page = await listContents({ pageNum: 1, pageSize: 100, status: 1 })
  contentOptions.value = page.list
  buyVisible.value = true
}

async function doBuy() {
  await buyFormRef.value.validate()
  saving.value = true
  try {
    await buyItem({
      customerId: customerId.value,
      itemId: buyForm.itemId,
      addCount: buyForm.addCount,
      maturityTime: buyForm.maturityTime || null,
    })
    ElMessage.success('购买成功')
    buyVisible.value = false
    load()
  } finally {
    saving.value = false
  }
}

/* ---------- 续费/移除项目 ---------- */
const renewVisible = ref(false)
const renewCount = ref(1)
const current = ref({})

function openRenew(row) {
  current.value = row
  renewCount.value = 1
  renewVisible.value = true
}

async function doRenew() {
  saving.value = true
  try {
    await renewItem(current.value.id, renewCount.value)
    ElMessage.success('续费成功')
    renewVisible.value = false
    load()
  } finally {
    saving.value = false
  }
}

async function doRemoveItem(row) {
  await removeCustomerItem(row.id)
  ElMessage.success('已移除')
  load()
}

onMounted(loadCustomers)
</script>

<style scoped>
.tip {
  color: #909399;
  font-size: 13px;
}
</style>
