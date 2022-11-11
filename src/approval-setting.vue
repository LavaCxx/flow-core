<template>
  <el-drawer
    title="我是标题"
    :visible="visible"
    direction="rtl"
    :show-close="false"
    @close="handleCloseDrawer"
    class="drawer"
    :wrapperClosable="readonly"
    size="400px"
  >
    <div class="drawer-header" slot="title">
      <div class="title-box">
        <el-input
          v-model="nodeData.name"
          @keypress.native.enter="toggleTitleEdit(false)"
          @blur="toggleTitleEdit(false)"
          v-if="isTitleEdit"
          ref="titleInput"
          :maxlength="15"
        />
        <h1 v-else @click="toggleTitleEdit(true)">{{ nodeData.name }}</h1>
      </div>
      <!-- <h1>{{ nodeData.name }}</h1> -->
      <aside
        class="priority-select"
        v-if="nodeData.nodeType === 'condition' && !nodeData.isOther"
      >
        <el-select v-model="sort" :disabled="readonly">
          <el-option
            v-for="index of sortInfo.branchNum - 1"
            :key="index"
            :value="index"
            :label="'优先级' + index"
          />
        </el-select>
      </aside>
    </div>
    <div class="drawer-content">
      <div class="form-content">
        <!-- 审批Start -->
        <el-form
          v-if="nodeData.nodeType === 'approval'"
          :model="nodeData"
          ref="approvalForm"
          label-position="top"
          :disabled="readonly"
        >
          <el-form-item label="审批类型">
            <el-radio-group v-model="nodeData.auditType">
              <el-radio
                v-for="item in approvalTypeOptions"
                :key="item.value"
                :label="item.value"
                >{{ item.label }}</el-radio
              >
            </el-radio-group>
          </el-form-item>

          <el-card shadow="none" v-if="nodeData.auditType === '1'">
            <div slot="header" class="card-header">
              <span>审批人</span>
            </div>
            <div class="card-content">
              <el-form-item
                class="approval-form-item"
                prop="mainBody.value"
                :rules="[
                  {
                    required: true,
                    trigger: ['blur', 'change'],
                    message: '请选择审批角色',
                  },
                ]"
              >
                <!-- <el-select
                  v-model="nodeData.mainBody.value"
                  @change="changeMainBody(nodeData, $event)"
                >
                  <el-option
                    v-for="item in approvalMainOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select> -->
                <el-radio-group
                  v-model="nodeData.mainBody.value"
                  @change="changeMainBody(nodeData, $event)"
                >
                  <el-radio
                    v-for="item in approvalMainOptions"
                    :key="item.value"
                    :label="item.value"
                    >{{ item.label }}</el-radio
                  >
                </el-radio-group>
              </el-form-item>
              <el-form-item
                v-if="nodeData.mainBody.value === '1'"
                class="approval-form-item"
                prop="userList"
                :key="nodeData.userList.length"
                :rules="[
                  {
                    required: true,
                    trigger: ['blur', 'change'],
                    validator: userListCheck,
                  },
                ]"
              >
                <div class="scope-box">
                  <div
                    class="current-selected"
                    :style="{
                      visibility: nodeData.userList.length ? 'visible' : 'hidden',
                    }"
                    @click="handleOpenSelectedDialog(nodeData)"
                  >
                    <span v-for="(tag, tagIndex) in nodeData.userList" :key="tag.id"
                      >{{ tagIndex ? "、" : "" }}{{ tag.name }}</span
                    >
                  </div>

                  <el-button
                    v-show="!readonly"
                    type="primary"
                    @click="handleOpenPersonnelDialog(nodeData.userList)"
                    >+ 新增</el-button
                  >
                </div>
              </el-form-item>
            </div>
          </el-card>
          <el-form-item
            label="多人审批时采用的审批方式"
            v-if="nodeData.auditType === '1'"
          >
            <el-radio-group v-model="nodeData.auditMode">
              <el-radio
                v-for="item in approvalModeOptions"
                :key="item.value"
                :label="item.value"
                >{{ item.label }}</el-radio
              >
            </el-radio-group>
          </el-form-item>
          <el-form-item
            label="审批人与发起人为同一人时"
            v-if="nodeData.auditType === '1'"
          >
            <el-radio-group v-model="nodeData.creatorAuditConfig">
              <el-radio
                v-for="item in approvalByOptions"
                :key="item.value"
                :label="item.value"
                >{{ item.label }}
                <el-tooltip class="form-tooltip" placement="top" v-if="item.remark">
                  <div slot="content">
                    <p
                      :class="{ 'h-tip': index === 0 }"
                      v-for="(text, index) in item.remark"
                      :key="index"
                    >
                      {{ text }} <br v-if="index < item.remark.length - 1" />
                    </p>
                  </div>
                  <i class="el-icon-question" />
                </el-tooltip>
              </el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item
            label="审批通过的意见"
            v-if="nodeData.auditType === '1'"
          >
            <el-radio-group v-model="nodeData.approved">
              <el-radio
                v-for="item in requireOptions"
                :key="item.value"
                :label="item.value"
                >{{ item.label }}
                <el-tooltip class="form-tooltip" placement="top" v-if="item.remark">
                  <div slot="content">
                    <p
                      :class="{ 'h-tip': index === 0 }"
                      v-for="(text, index) in item.remark"
                      :key="index"
                    >
                      {{ text }} <br v-if="index < item.remark.length - 1" />
                    </p>
                  </div>
                  <i class="el-icon-question" />
                </el-tooltip>
              </el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item
            label="审批不通过的意见"
            v-if="nodeData.auditType === '1'"
          >
            <el-radio-group v-model="nodeData.approvalFailed">
              <el-radio
                v-for="item in requireOptions"
                :key="item.value"
                :label="item.value"
                >{{ item.label }}
                <el-tooltip class="form-tooltip" placement="top" v-if="item.remark">
                  <div slot="content">
                    <p
                      :class="{ 'h-tip': index === 0 }"
                      v-for="(text, index) in item.remark"
                      :key="index"
                    >
                      {{ text }} <br v-if="index < item.remark.length - 1" />
                    </p>
                  </div>
                  <i class="el-icon-question" />
                </el-tooltip>
              </el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
        <!-- 审批End -->

        <!-- 条件Start -->
        <el-form
          v-else-if="nodeData.nodeType === 'condition'"
          :model="nodeData"
          ref="conditionForm"
          :disabled="readonly"
        >
          <div
            class="condition-group"
            v-for="(item, index) in nodeData.conditionGroup"
            :key="index"
          >
            <div class="condition-header">
              <p class="header-text">条件组</p>
              <i
                v-show="!readonly"
                class="el-icon-delete"
                @click="removeCondition(nodeData.conditionGroup, index)"
              />
            </div>
            <div class="condition-item" v-for="(im, ix) in item" :key="ix">
              <div class="condition-relation">
                <span>{{ ix ? "且" : "当" }}</span>
                <i
                  class="el-icon-delete"
                  v-show="!readonly"
                  @click="removeCondition(item, ix)"
                />
              </div>
              <el-form-item
                class="condition-body"
                :prop="'conditionGroup.' + index + '.' + ix + '.mainBody.value'"
                :rules="[
                  {
                    required: true,
                    trigger: ['blur', 'change'],
                    message: '请选择条件',
                  },
                ]"
              >
                <el-select
                  v-model="im.mainBody.value"
                  @change="changeMainBody(im, $event)"
                >
                  <el-option
                    v-for="option in conditionMainOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                    :disabled="
                      !!~item.findIndex(
                        (checkVal) => checkVal.mainBody.value === option.value
                      )
                    "
                  />
                </el-select>
              </el-form-item>
              <el-form-item
                :prop="'conditionGroup.' + index + '.' + ix + '.value'"
                :key="nodeData.conditionGroup[index][ix].value.length"
                :rules="[
                  {
                    required: true,
                    trigger: ['blur', 'change'],
                    message: '请选择条件值',
                  },
                ]"
                v-if="
                  !~conditionMainOptions.findIndex(
                    (fi) => im.mainBody.value === fi.value && fi.rangeOptions === 0
                  )
                "
              >
                <div class="condition-dict">
                  <el-select
                    v-model="im.value"
                    :loading="dictDetailLoading"
                    @change="changeDictValue(im, $event)"
                  >
                    <el-option
                      v-for="option in dictOptions[im.mainBody.value]"
                      :key="option.value"
                      :label="option.label"
                      :value="option.value"
                    />
                  </el-select>
                </div>
              </el-form-item>
              <el-form-item
                v-else
                :prop="'conditionGroup.' + index + '.' + ix + '.value'"
                :key="nodeData.conditionGroup[index][ix].value.length"
                :rules="[
                  {
                    required: true,
                    trigger: ['blur', 'change'],
                    validator: conditionUserCheck,
                  },
                ]"
              >
                <div class="condition-personnel">
                  <div
                    class="current-selected"
                    :style="{
                      visibility: im.value.length ? 'visible' : 'hidden',
                    }"
                    @click="handleOpenSelectedDialog(im)"
                  >
                    <span v-for="(tag, tagIndex) in im.value" :key="tag.id"
                      >{{ tagIndex ? "、" : "" }}{{ tag.name }}</span
                    >
                  </div>

                  <el-button
                    type="primary"
                    v-show="!readonly"
                    @click="handleOpenPersonnelDialog(im.value)"
                    >+ 新增</el-button
                  >
                </div>
              </el-form-item>
            </div>
            <div class="append-condition" v-show="!readonly">
              <el-button type="text" @click="appendCondition(item)">+ 添加条件</el-button>
            </div>
          </div>
          <el-button
            type="text"
            class="append-condition-group"
            v-show="nodeData.conditionGroup.length === 0 && !readonly"
            @click="appendConditionGroup"
            >添加条件组</el-button
          >
        </el-form>
        <!-- 条件End -->

        <!-- 抄送Start -->
        <el-form
          v-if="nodeData.nodeType === 'copy'"
          :model="nodeData"
          ref="copyForm"
          label-position="top"
          :disabled="readonly"
        >
          <el-card shadow="none">
            <div slot="header" class="card-header">
              <span>抄送人</span>
            </div>
            <div class="card-content">
              <el-form-item
                class="approval-form-item"
                prop="mainBody.value"
                :rules="[
                  {
                    required: true,
                    trigger: 'blur',
                    message: '请选择抄送角色',
                  },
                ]"
              >
                <!-- <el-select
                  v-model="nodeData.mainBody.value"
                  @change="changeMainBody(nodeData, $event)"
                >
                  <el-option
                    v-for="item in approvalMainOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select> -->
                <el-radio-group
                  v-model="nodeData.mainBody.value"
                  @change="changeMainBody(nodeData, $event)"
                >
                  <el-radio
                    v-for="item in approvalMainOptions"
                    :key="item.value"
                    :label="item.value"
                    >{{ item.label }}</el-radio
                  >
                </el-radio-group>
              </el-form-item>
              <el-form-item
                v-if="nodeData.mainBody.value === '1'"
                class="approval-form-item"
                prop="userList"
                :key="nodeData.userList.length"
                :rules="[
                  {
                    required: true,

                    trigger: ['blur', 'change'],
                    validator: userListCheck,
                  },
                ]"
              >
                <div class="scope-box">
                  <div
                    class="current-selected"
                    :style="{
                      visibility: nodeData.userList.length ? 'visible' : 'hidden',
                    }"
                    @click="handleOpenSelectedDialog(nodeData)"
                  >
                    <span v-for="(tag, tagIndex) in nodeData.userList" :key="tag.id"
                      >{{ tagIndex ? "、" : "" }}{{ tag.name }}</span
                    >
                  </div>

                  <el-button
                    type="primary"
                    v-show="!readonly"
                    @click="handleOpenPersonnelDialog(nodeData.userList)"
                    >+ 新增</el-button
                  >
                </div>
              </el-form-item>
            </div>
          </el-card>
        </el-form>
        <!-- 抄送End -->
      </div>
      <div class="bottom-bar">
        <el-button @click="handleCloseDrawer">取消</el-button>
        <el-button type="primary" @click="submitForm" v-show="!readonly">保存</el-button>
      </div>
    </div>
    <PersonnelDialog
      :visible="personnelDialogVisible"
      @confirm="confirmPersonnelDialog"
      @close="closePersonnelDialog"
      alwayNew
    />
    <SelectedDialog
      :data="currentSelectedData.userList || currentSelectedData.value"
      :visible="selectedDialogVisible"
      @confirm="confirmSelectedDialog"
      @close="closeSelectedDialog"
      :readonly="readonly"
    />
  </el-drawer>
</template>

<script>
import PersonnelDialog from '@/components/personnel-dialog'
import SelectedDialog from './selected-dialog'
export default {
  components: { PersonnelDialog, SelectedDialog },
  props: {
    readonly: {
      type: Boolean,
      default: false
    },
    visible: {
      type: Boolean,
      default: false
    },
    data: {
      type: Object,
      default () {
        return {
          name: '标题',
          nodeType: ''
        }
      }
    },
    sortInfo: {
      type: Object,
      default () {
        return {
          sort: 1,
          branchNum: 1
        }
      }
    }
  },
  data () {
    return {
      isTitleEdit: false,
      // 字典详情下拉框加载
      dictDetailLoading: false,
      sort: 0,
      personnelDialogVisible: false,
      selectedDialogVisible: false,
      nodeData: {
        name: '标题'
      },
      // 暂时保存选择的人员
      currentConditionValue: [],
      // 已选角色暂存数据
      currentSelectedData: {},
      // 审批流程字典
      processDict: [],
      approvalTypeOptions: [
        {
          label: '人工审核',
          value: '1'
        },
        {
          label: '自动通过',
          value: '2'
        },
        {
          label: '自动拒绝',
          value: '3'
        }
      ],
      approvalModeOptions: [
        {
          label: '或签（一名审批人同意即可）',
          value: '1'
        },
        {
          label: '会签（需所有审批人同意）',
          value: '2'
        }
      ],
      approvalByOptions: [
        {
          label: '自动跳过',
          value: '1',
          remark: [
            '什么是自动跳过？',
            '如果当前节点还有其他审批人，则交由其他审批人进行审批',
            '如果当前节点没有其他审批人，则由节点自动通过'
          ]
        },
        {
          label: '由发起人对自己审批',
          value: '2'
        }
      ],
      requireOptions: [
        {
          label: '非必填',
          value: '1'
        },
        {
          label: '必填',
          value: '2'
        }
      ],
      // 审批选择
      approvalMainOptions: [
        {
          label: '指定成员',
          value: '1'
        }
      ],
      // 条件选择
      conditionMainOptions: [],
      dictOptions: {},
      userListCheck: (rule, value, callback) => {
        if (!value || value.length < 1) {
          return callback(new Error('请选择角色/组织机构/标签/人员'))
        } else {
          callback()
        }
      },
      conditionUserCheck: (rule, value, callback) => {
        if (!value || value.length < 1) {
          return callback(new Error('请选择条件值'))
        } else {
          callback()
        }
      }
    }
  },
  methods: {
    toggleTitleEdit (status = false) {
      this.isTitleEdit = status
      if (this.isTitleEdit) {
        this.$nextTick(() => {
          this.$refs.titleInput.focus()
        })
      }
    },
    getProcessDictList () {
      let params = { pageIndex: 1, pageSize: 9999, available: 1 }
      this.$api.getProcessDictList(params).then((res) => {
        if (res?.data?.code === 200) {
          this.processDict =
            res.data.list.map((item) => {
              return {
                label: item.name,
                value: item.id,
                sourceId: item.sourceId,
                rangeOptions: item.rangeOptions,
                type: item.type
              }
            }) || []
          this.conditionMainOptions = this.processDict
        }
      })
    },
    getDictDetail (id, saveProp) {
      let params = {
        parentId: id,
        index: 1,
        size: 999
      }
      if (Reflect.has(this.dictOptions, saveProp)) {
        return
      }
      this.dictDetailLoading = true
      this.$api
        .DICT_ALL(params)
        .then((res) => {
          if (res?.data?.code === 200) {
            this.dictOptions[saveProp.toString()] =
              res.data.data.map((item) => {
                return {
                  label: item.value,
                  value: item.id
                }
              }) || []
            this.$forceUpdate()
          }
        })
        .finally(() => {
          this.dictDetailLoading = false
        })
    },
    // 更改选择主体，切换下一个选项是否是下拉框还是选人框
    changeMainBody (source, value) {
      let optionObj = {}
      switch (this.nodeData.nodeType) {
        case 'condition':
          optionObj = this.conditionMainOptions.find((item) => item.value === value)
          if (optionObj.rangeOptions === 0) {
            source.value = []
            source.label = ''
          } else {
            source.value = ''
            source.label = ''
            this.getDictDetail(optionObj.sourceId, optionObj.value)
          }
          break
        case 'approval':
          optionObj = this.approvalMainOptions.find((item) => item.value === value)
          if (optionObj.value === '2') {
            this.nodeData.userList = []
          }
          break
        case 'copy':
          optionObj = this.approvalMainOptions.find((item) => item.value === value)
          if (optionObj.value === '2') {
            this.nodeData.userList = []
          }
      }
      Object.assign(source.mainBody, optionObj)
    },
    // 条件模块更改字典值
    changeDictValue (source, value) {
      let optionObj = {}
      optionObj = this.dictOptions[source.mainBody.value].find(
        (item) => item.value === value
      )
      source.label = optionObj.label
    },
    submitForm () {
      this.$refs[`${this.nodeData.nodeType}Form`].validate((valid) => {
        if (valid) {
          // alert("submit!");
          this.handleConfirmDrawer()
        }
      })
    },
    handleConfirmDrawer () {
      this.nodeData.warningText = ''
      this.$emit('confirm', { data: this.nodeData, sort: this.sort })
    },
    handleCloseDrawer () {
      this.$emit('close')
    },
    handleOpenPersonnelDialog (list) {
      this.currentConditionValue = list
      this.personnelDialogVisible = true
    },
    confirmPersonnelDialog (arr) {
      console.log(arr, this.currentConditionValue)
      this.currentConditionValue.push(...arr)
      for (let i = 0; i < this.currentConditionValue.length; i++) {
        if (
          this.currentConditionValue.filter((item) => {
            if (item.id === this.currentConditionValue[i].id) {
              return item
            }
          }).length > 1
        ) {
          this.currentConditionValue.splice(i, 1)
          i--
        }
      }
      this.personnelDialogVisible = false
    },
    closePersonnelDialog () {
      this.personnelDialogVisible = false
    },
    // 打开人员编辑弹窗
    handleOpenSelectedDialog (data) {
      this.selectedDialogVisible = true
      this.currentSelectedData = data
    },
    confirmSelectedDialog (data) {
      // console.log("data", data);
      if (Reflect.has(this.currentSelectedData, 'userList')) {
        this.currentSelectedData.userList = data
      } else if (Reflect.has(this.currentSelectedData, 'value')) {
        this.currentSelectedData.value = data
      }
      this.closeSelectedDialog()
    },
    closeSelectedDialog () {
      this.selectedDialogVisible = false
    },
    // 新增条件组
    appendConditionGroup () {
      this.nodeData.conditionGroup.push([
        {
          mainBody: {
            label: '',
            value: ''
          },
          value: [],
          label: ''
        }
      ])
    },
    // 新增条件
    appendCondition (source) {
      let pushObj = {
        mainBody: {
          label: '',
          value: ''
        },
        value: [],
        label: ''
      }
      // pushObj.mainBody.label = this.conditionMainOptions[0].label;
      // pushObj.mainBody.value = this.conditionMainOptions[0].value;
      source.push(pushObj)
    },
    // 删除条件/条件组
    removeCondition (list, index) {
      this.$confirm('是否确定删除?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        list.splice(index, 1)
      })
    },

    // 初始化数据
    initData () {
      switch (this.nodeData.nodeType) {
        case 'condition':
          if (!this.nodeData.conditionGroup.length) {
            this.appendConditionGroup()
          } else {
            // 获取已有的下拉框的数据
            this.nodeData.conditionGroup.forEach((item) => {
              if (item.length) {
                item.forEach((im) => {
                  if (!Array.isArray(im.value)) {
                    this.getDictDetail(im.mainBody.sourceId, im.mainBody.value)
                  }
                })
              }
            })
          }
      }
    }
  },
  created () {
    this.getProcessDictList()
  },
  watch: {
    data: {
      handler (newV) {
        this.nodeData = JSON.parse(JSON.stringify(newV))
        this.sort = this.sortInfo.sort
        this.initData()
      },
      deep: true,
      immediate: true
    },
    sortInfo: {
      handler (newV) {
        // console.log("newV", newV);
        this.sort = newV.sort
      },
      deep: true
    }
  }
}
</script>

<style lang="scss" scoped>
.drawer {
  .drawer-header {
    border-bottom: 1px solid #dcdfe6;
    height: 60px;
    line-height: 60px;
    display: flex;
    justify-content: space-between;
    .title-box {
      ::v-deep .el-input {
        font-size: 22px;
      }
    }
  }
  .drawer-content {
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    padding: 0 20px;
    display: flex;
    flex-direction: column;
    .form-content {
      flex: 1;
      ::v-deep .el-form-item {
        .el-form-item__label {
          color: #1f2329;
          font-weight: bold;
          font-size: 20px;
        }
      }
      .form-tooltip {
      }
      .card-header {
        color: #1f2329;
        font-weight: bold;
        font-size: 18px;
      }
      .card-content {
        font-size: 18px;
        .approval-form-item {
          margin-top: 10px;
        }
        ::v-deep .el-select {
          width: 100%;
        }
        .scope-box {
          height: 40px;
          // padding: 0px 15px;
          border: 1px solid #dcdfe6;
          border-radius: 5px;

          display: flex;
          justify-content: space-between;
          align-items: center;
          .scope-placeholder {
            user-select: none;
            color: #c0c4cc;
          }
          .current-selected {
            height: 25px;
            line-height: 23px;
            border-radius: 10px;
            font-size: 16px;
            max-width: 75%;
            padding: 0 10px;
            margin-left: 5px;
            box-sizing: border-box;
            border: 2px solid #dfdfdf;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            cursor: pointer;
            transition: all 0.4s ease;
            box-shadow: 0 0 4px #c0c4cc;
            span {
              user-select: none;
            }
            &:hover {
              box-shadow: 0 0 2px #c0c4cc;
            }
            &:active {
              filter: brightness(98%);
            }
          }
          ::v-deep .el-button {
            padding: 0 20px;
            line-height: 40px;
          }
        }
      }
      .condition-group {
        margin-bottom: 10px;
        border: 1px solid #e4e5e7;
        padding: 15px;
        padding-top: 50px;
        border-radius: 4px;
        position: relative;
        .condition-header {
          width: 100%;
          height: 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background-color: #f4f6f8;
          padding: 12px;
          font-size: 14px;
          color: #171e31;
          box-sizing: border-box;
          position: absolute;
          top: 0;
          left: 0;
          .header-text {
            font-size: 16px;
          }
          .el-icon-delete {
            font-size: 20px;
            cursor: pointer;
          }
        }
        .condition-item {
          padding: 6px;
          box-sizing: border-box;
          .condition-relation {
            font-size: 16px;
            margin-bottom: 5px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            .el-icon-delete {
              font-size: 20px;
              cursor: pointer;
            }
          }
          .condition-body {
            ::v-deep .el-input__inner {
              width: 100%;
              border-color: #ededf0;
            }
            ::v-deep .el-select {
              width: 100%;
            }
          }
          .condition-dict {
            ::v-deep .el-input__inner {
              width: 100%;
              border-color: #ededf0;
            }
            ::v-deep .el-select {
              width: 100%;
            }
          }
          .condition-personnel {
            width: 100%;
            margin-top: 10px;
            height: 35px;
            border: 1px solid #ededf0;
            border-radius: 2px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            .current-selected {
              height: 25px;
              line-height: 23px;
              border-radius: 10px;
              font-size: 16px;
              max-width: 75%;
              padding: 0 10px;
              margin-left: 5px;
              box-sizing: border-box;
              border: 2px solid #dfdfdf;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              cursor: pointer;
              transition: all 0.3s ease-out;
              box-shadow: 0 0 4px #c0c4cc;
              span {
                user-select: none;
              }
              &:hover {
                box-shadow: 0 0 2px #c0c4cc;
              }
              &:active {
                filter: brightness(98%);
              }
            }
            ::v-deep .el-button {
              padding: 0 20px;
              line-height: 40px;
            }
          }
        }
        .append-condition {
          margin-top: 5px;
        }
      }
    }
    .bottom-bar {
      display: flex;
      justify-content: flex-end;
      height: 60px;
      align-items: center;
      border-top: 1px solid #dcdfe6;
    }
  }
  ::v-deep .h-tips {
    font-size: 18px;
  }
}
</style>
