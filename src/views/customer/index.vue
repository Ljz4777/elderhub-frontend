<template>
  <div class="page-card">
    <el-tabs v-model="tab" @tab-change="onTabChange">
      <!-- ============ Tab1 在住客户 ============ -->
      <el-tab-pane label="在住客户" name="live">
        <div class="table-toolbar">
          <div class="toolbar-filters">
            <el-select v-model="liveQuery.customerType" style="width: 130px" @change="loadLive">
              <el-option label="自理老人" :value="1" />
              <el-option label="护理老人" :value="2" />
              <el-option label="全部" :value="0" />
            </el-select>
            <el-input
              v-model="liveQuery.customerName"
              placeholder="客户姓名"
              clearable
              style="width: 160px"
              @keyup.enter="loadLive"
              @clear="loadLive"
            />
            <el-button type="primary" :icon="Search" @click="loadLive">查询</el-button>
          </div>
          <el-button type="primary" :icon="Plus" @click="tab = 'checkin'">入住登记</el-button>
        </div>
        <el-table v-loading="liveLoading" :data="liveList" border stripe>
          <el-table-column prop="customerId" label="客户ID" width="80" />
          <el-table-column prop="customerName" label="姓名" min-width="100">
            <template #default="{ row }">{{ row.customerName || '—' }}</template>
          </el-table-column>
          <el-table-column prop="bedNo" label="床位" width="100" />
          <el-table-column prop="roomNo" label="房间" width="90" />
          <el-table-column label="入住日期" width="110">
            <template #default="{ row }">{{ fmtDate(row.startDate) }}</template>
          </el-table-column>
          <el-table-column label="到期日期" width="110">
            <template #default="{ row }">{{ fmtDate(row.endDate) }}</template>
          </el-table-column>
          <el-table-column prop="statusMsg" label="状态" width="100" />
          <el-table-column label="操作" width="160" fixed="right">
            <template #default="{ row }">
              <el-button link type="warning" @click="doGoOut(row)">外出</el-button>
              <el-button
                v-if="row.statusMsg === '外出'"
                link
                type="success"
                @click="doComeback(row)"
              >回院</el-button>
              <el-button link type="primary" @click="goRecords(row)">护理记录</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div style="margin-top: 14px; display: flex; justify-content: flex-end">
          <Pagination
            v-model:page="liveQuery.pageNum"
            v-model:size="liveQuery.pageSize"
            :total="liveTotal"
            @change="loadLive"
          />
        </div>
      </el-tab-pane>

      <!-- ============ Tab2 入住登记 ============ -->
      <el-tab-pane label="入住登记" name="checkin">
        <el-form
          ref="formRef"
          :model="form"
          :rules="formRules"
          label-width="110px"
          style="max-width: 680px"
        >
          <el-divider content-position="left">基本信息</el-divider>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="姓名" prop="customer_name">
                <el-input v-model="form.customer_name" placeholder="老人姓名" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="年龄" prop="customer_age">
                <el-input-number v-model="form.customer_age" :min="0" :max="150" style="width: 100%" disabled placeholder="由出生日期自动计算" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="性别" prop="customer_sex">
                <el-radio-group v-model="form.customer_sex">
                  <el-radio :value="0">男</el-radio>
                  <el-radio :value="1">女</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="出生日期" prop="birthday">
                <el-date-picker v-model="form.birthday" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="家属" prop="family_member">
                <el-input v-model="form.family_member" placeholder="家属姓名" maxlength="20" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="身份证号" prop="idcard">
                <el-input v-model="form.idcard" maxlength="18" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="联系电话" prop="contact_tel">
                <el-input v-model="form.contact_tel" maxlength="11" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-divider content-position="left">床位分配</el-divider>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="房间/床位" prop="bed_id" required>
                <RoomBedPicker v-model:room-no="pickerRoom" v-model:bed-id="form.bed_id" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="楼栋">
                <el-input v-model="form.building_no" disabled placeholder="固定 606" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-divider content-position="left">入住信息</el-divider>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="入住日期" prop="checkin_date">
                <el-date-picker v-model="form.checkin_date" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="到期日期" prop="expiration_date">
                <el-date-picker v-model="form.expiration_date" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="身高(cm)">
                <el-input v-model="form.height" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="体重(kg)">
                <el-input v-model="form.weight" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="血型" prop="blood_type">
                <el-select v-model="form.blood_type" clearable style="width: 100%">
                  <el-option v-for="t in ['A', 'B', 'AB', 'O']" :key="t" :label="t + '型'" :value="t" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="身心状况">
                <el-input v-model="form.psychosomatic_state" type="textarea" :rows="2" placeholder="身体健康/心理状况描述" />
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="护理注意">
                <el-input v-model="form.attention" type="textarea" :rows="2" placeholder="护理注意事项" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item>
            <el-button type="primary" :loading="saving" @click="doSave">提交登记</el-button>
            <el-button @click="resetForm">重置</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- ============ Tab3 无床位客户 ============ -->
      <el-tab-pane label="无床位客户" name="nonurse">
        <div class="table-toolbar">
          <span class="tip">以下客户暂未分配床位，可在此编辑信息或删除。</span>
          <el-button :icon="Refresh" @click="loadNoBed">刷新</el-button>
        </div>
        <el-table v-loading="noBedLoading" :data="noBedList" border stripe>
          <el-table-column prop="id" label="ID" width="70" />
          <el-table-column prop="customer_name" label="姓名" min-width="90" />
          <el-table-column label="性别" width="70">
            <template #default="{ row }">
              <StatusTag :value="row.customer_sex" :dict="CUSTOMER_SEX" />
            </template>
          </el-table-column>
          <el-table-column prop="customer_age" label="年龄" width="70" />
          <el-table-column prop="contact_tel" label="联系电话" width="130">
            <template #default="{ row }">{{ fmtOrDash(row.contact_tel) }}</template>
          </el-table-column>
          <el-table-column prop="idcard" label="身份证号" min-width="160" show-overflow-tooltip>
            <template #default="{ row }">{{ fmtOrDash(row.idcard) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="140" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
              <el-popconfirm title="确认删除该客户？" @confirm="doRemove(row)">
                <template #reference>
                  <el-button link type="danger">删除</el-button>
                </template>
              </el-popconfirm>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- ============ Tab4 管家分配 ============ -->
      <el-tab-pane label="管家分配" name="assign">
        <el-row :gutter="16">
          <!-- 左：管家列表 -->
          <el-col :span="9">
            <div class="panel">
              <div class="table-toolbar">
                <b>健康管家</b>
                <el-input
                  v-model="nurseName"
                  placeholder="按姓名搜索"
                  clearable
                  size="small"
                  style="width: 140px"
                  @keyup.enter="loadNurses"
                  @clear="loadNurses"
                />
              </div>
              <el-table
                v-loading="nurseLoading"
                :data="nurseList"
                highlight-current-row
                border
                size="small"
                max-height="460"
                @current-change="onNurseSelect"
              >
                <el-table-column prop="id" label="ID" width="60" />
                <el-table-column prop="nickname" label="姓名" min-width="90" />
                <el-table-column prop="phoneNumber" label="电话" width="120">
                  <template #default="{ row }">{{ fmtOrDash(row.phoneNumber) }}</template>
                </el-table-column>
              </el-table>
              <div class="panel-sub">
                <b>{{ currentNurse ? `${currentNurse.nickname} 服务中的客户` : '请选择左侧管家' }}</b>
                <el-button
                  v-if="currentNurse"
                  size="small"
                  type="danger"
                  plain
                  :disabled="!assignSelection"
                  @click="doRemoveAssign"
                >移除选中</el-button>
              </div>
              <el-table
                :data="nurseCustomers"
                highlight-current-row
                border
                size="small"
                max-height="220"
                @current-change="(row) => (assignSelection = row)"
              >
                <el-table-column prop="id" label="ID" width="60" />
                <el-table-column prop="customer_name" label="客户姓名" min-width="90" />
                <el-table-column prop="room_no" label="房间" width="70">
                  <template #default="{ row }">{{ fmtOrDash(row.room_no) }}</template>
                </el-table-column>
              </el-table>
            </div>
          </el-col>
          <!-- 右：无管家客户池 -->
          <el-col :span="15">
            <div class="panel">
              <div class="table-toolbar">
                <b>未分配管家的客户</b>
                <el-button size="small" type="primary" :disabled="!poolSelection" :loading="assignLoading" @click="doAssign">
                  分配给当前管家
                </el-button>
              </div>
              <el-table
                v-loading="poolLoading"
                :data="poolList"
                highlight-current-row
                border
                size="small"
                max-height="720"
                @current-change="(row) => (poolSelection = row)"
              >
                <el-table-column prop="id" label="ID" width="60" />
                <el-table-column prop="customer_name" label="客户姓名" min-width="90" />
                <el-table-column label="性别" width="70">
                  <template #default="{ row }">
                    <StatusTag :value="row.customer_sex" :dict="CUSTOMER_SEX" />
                  </template>
                </el-table-column>
                <el-table-column prop="customer_age" label="年龄" width="70" />
                <el-table-column prop="contact_tel" label="联系电话" min-width="120">
                  <template #default="{ row }">{{ fmtOrDash(row.contact_tel) }}</template>
                </el-table-column>
              </el-table>
            </div>
          </el-col>
        </el-row>
      </el-tab-pane>
    </el-tabs>

    <!-- 编辑客户弹窗（下划线字段，复用入住表单核心字段） -->
    <el-dialog v-model="editVisible" title="编辑客户" width="560px">
      <el-form :model="editForm" label-width="100px">
        <el-row :gutter="10">
          <el-col :span="12">
            <el-form-item label="姓名">
              <el-input v-model="editForm.customer_name" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="年龄">
              <el-input-number v-model="editForm.customer_age" :min="0" :max="150" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="性别">
              <el-radio-group v-model="editForm.customer_sex">
                <el-radio :value="0">男</el-radio>
                <el-radio :value="1">女</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话">
              <el-input v-model="editForm.contact_tel" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="身份证号">
              <el-input v-model="editForm.idcard" maxlength="18" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="出生日期">
              <el-date-picker v-model="editForm.birthday" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="身心状况">
              <el-input v-model="editForm.psychosomatic_state" type="textarea" :rows="2" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="护理注意">
              <el-input v-model="editForm.attention" type="textarea" :rows="2" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="doUpdate">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Search } from '@element-plus/icons-vue'
import { saveCustomer, updateCustomer, removeCustomer, goOut, comeback, listNoNurse, listNoBed } from '@/api/customer'
import { listDetails } from '@/api/bed'
import { listNurses } from '@/api/user'
import { listNurseCustomers, assignCustomer, removeCustomerAssign } from '@/api/nurseAssign'
import { CUSTOMER_SEX } from '@/utils/constants'
import { fmtDate, fmtOrDash } from '@/utils/format'
import Pagination from '@/components/Pagination.vue'
import StatusTag from '@/components/StatusTag.vue'
import RoomBedPicker from '@/components/RoomBedPicker.vue'

const router = useRouter()
const tab = ref('live')
const saving = ref(false)

/* ---------- Tab1 在住客户 ---------- */
const liveQuery = reactive({ customerName: '', customerType: 1, status: 1, pageNum: 1, pageSize: 10 })
const liveList = ref([])
const liveTotal = ref(0)
const liveLoading = ref(false)

async function loadLive() {
  liveLoading.value = true
  try {
    const page = await listDetails({ ...liveQuery })
    liveList.value = page.list
    liveTotal.value = page.total
  } finally {
    liveLoading.value = false
  }
}

async function doGoOut(row) {
  await ElMessageBox.confirm(`确认登记客户「${row.customerName || row.customerId}」外出？`, '外出登记')
  await goOut(row.customerId)
  ElMessage.success('已登记外出')
  loadLive()
}

async function doComeback(row) {
  await ElMessageBox.confirm(`确认登记客户「${row.customerName || row.customerId}」回院？`, '回院登记')
  await comeback(row.customerId)
  ElMessage.success('已登记回院')
  loadLive()
}

function goRecords(row) {
  router.push({ path: '/records', query: { customerId: row.customerId } })
}

/* ---------- Tab2 入住登记 ---------- */
const formRef = ref()
const pickerRoom = ref(null)
const emptyForm = () => ({
  customer_name: '',
  customer_age: null,
  customer_sex: 0,
  idcard: '',
  room_no: '',
  building_no: '606',
  bed_id: null,
  checkin_date: '',
  expiration_date: '',
  contact_tel: '',
  birthday: '',
  family_member: '',
  height: '',
  weight: '',
  blood_type: '',
  psychosomatic_state: '',
  attention: '',
})
const form = reactive(emptyForm())
const formRules = {
  customer_name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  customer_sex: [{ required: true, message: '请选择性别', trigger: 'change' }],
  birthday: [{ required: true, message: '请选择出生日期', trigger: 'change' }],
  idcard: [
    { required: true, message: '请输入身份证号', trigger: 'blur' },
    { pattern: /^\d{17}[\dXx]$/, message: '请输入正确的18位身份证号', trigger: 'blur' },
  ],
  family_member: [{ required: true, message: '请输入家属姓名', trigger: 'blur' }],
  contact_tel: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1\d{10}$/, message: '请输入正确的11位手机号', trigger: 'blur' },
  ],
  blood_type: [{ required: true, message: '请选择血型', trigger: 'change' }],
  bed_id: [{ required: true, message: '请选择房间和床位', trigger: 'change' }],
  checkin_date: [{ required: true, message: '请选择入住日期', trigger: 'change' }],
  expiration_date: [{ required: true, message: '请选择合同到期日期', trigger: 'change' }],
}

// 年龄根据出生日期自动计算（后端保存时也会兜底重算）
watch(() => form.birthday, (val) => {
  if (!val) { form.customer_age = null; return }
  const birth = new Date(val)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--
  form.customer_age = age
})

async function doSave() {
  await formRef.value.validate()
  saving.value = true
  try {
    // RoomBedPicker 的房间号回填到 room_no（后端为 String）
    form.room_no = pickerRoom.value != null ? String(pickerRoom.value) : ''
    await saveCustomer({ ...form })
    ElMessage.success('入住登记成功')
    resetForm()
    tab.value = 'live'
    loadLive()
  } finally {
    saving.value = false
  }
}

function resetForm() {
  Object.assign(form, emptyForm())
  pickerRoom.value = null
  formRef.value?.clearValidate()
}

/* ---------- Tab3 无床位客户 ---------- */
const noBedList = ref([])
const noBedLoading = ref(false)
const editVisible = ref(false)
const editForm = reactive({})

async function loadNoBed() {
  noBedLoading.value = true
  try {
    noBedList.value = (await listNoBed()) || []
  } finally {
    noBedLoading.value = false
  }
}

function openEdit(row) {
  Object.assign(editForm, row)
  editVisible.value = true
}

async function doUpdate() {
  saving.value = true
  try {
    await updateCustomer({ ...editForm })
    ElMessage.success('保存成功')
    editVisible.value = false
    loadNoBed()
  } finally {
    saving.value = false
  }
}

async function doRemove(row) {
  await removeCustomer(row.id)
  ElMessage.success('已删除')
  loadNoBed()
}

/* ---------- Tab4 管家分配 ---------- */
const nurseName = ref('')
const nurseList = ref([])
const nurseLoading = ref(false)
const currentNurse = ref(null)
const nurseCustomers = ref([])
const assignSelection = ref(null)
const poolList = ref([])
const poolLoading = ref(false)
const poolSelection = ref(null)
const assignLoading = ref(false)

/** 未分配管家的客户池 */
async function loadPool() {
  poolLoading.value = true
  try {
    poolList.value = (await listNoNurse()) || []
  } finally {
    poolLoading.value = false
  }
}

async function loadNurses() {
  nurseLoading.value = true
  try {
    nurseList.value = (await listNurses(nurseName.value || undefined)) || []
  } finally {
    nurseLoading.value = false
  }
}

async function onNurseSelect(row) {
  currentNurse.value = row
  assignSelection.value = null
  nurseCustomers.value = []
  if (!row) return
  nurseCustomers.value = (await listNurseCustomers(row.id)) || []
}

async function doAssign() {
  if (!currentNurse.value || !poolSelection.value) return
  assignLoading.value = true
  try {
    await assignCustomer(currentNurse.value.id, poolSelection.value.id)
    ElMessage.success('分配成功')
    poolSelection.value = null
    loadPool()
    onNurseSelect(currentNurse.value)
  } finally {
    assignLoading.value = false
  }
}

async function doRemoveAssign() {
  if (!assignSelection.value) return
  await removeCustomerAssign(assignSelection.value.id)
  ElMessage.success('已移除管家关系')
  assignSelection.value = null
  loadPool()
  if (currentNurse.value) onNurseSelect(currentNurse.value)
}

function onTabChange(name) {
  if (name === 'live') loadLive()
  if (name === 'nonurse') loadNoBed()
  if (name === 'assign') {
    loadPool()
    if (nurseList.value.length === 0) loadNurses()
  }
}

onMounted(loadLive)
</script>

<style scoped>
.tip {
  color: #909399;
  font-size: 13px;
}
.panel {
  border: 1px solid #eef0f4;
  border-radius: 8px;
  padding: 12px;
  height: 100%;
}
.panel-sub {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 12px 0 8px;
  font-size: 14px;
}
</style>
