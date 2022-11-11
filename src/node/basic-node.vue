<template>
  <div :class="['flow-editor-node', nodeData.nodeType]">
    <div
      :class="{
        'flow-editor-node-container': true,
        warning: isWarning,
      }"
      @click="clickNode"
    >
      <div class="node-title">
        <div class="node-title-name">
          {{
            nodeData.nodeType === "condition" && nodeData.isOther
              ? "默认"
              : nodeData.name
          }}
          {{
            nodeData.nodeType === "condition" && !nodeData.isOther
              ? this.sort
              : ""
          }}
          <!-- {{nodeData.id}} -->
        </div>
        <div
          class="node-btns"
          v-if="
            nodeData.nodeType === 'condition' && !nodeData.isOther && !readonly
          "
        >
          <div @click.stop>
            <el-popconfirm title="确定删除吗？" @confirm="deleteNode">
              <el-button
                slot="reference"
                class="delete-btn"
                icon="el-icon-close"
              />
            </el-popconfirm>
          </div>
        </div>
        <span v-if="nodeData.nodeType === 'condition'" class="sort-text">
          优先级{{ sort }}
        </span>
      </div>
      <div class="node-content">
        <div class="node-detail">
          <div class="node-detail-item" v-if="nodeContent">
            <!-- {{analyzeContent(item.content)}} -->
            <span :title="nodeContent">{{ nodeContent }}</span>
          </div>
          <div class="node-detail-item node-item-placeholder" v-else>
            {{ nodePlaceholder(nodeData.nodeType) }}
          </div>
        </div>
        <i
          class="el-icon-arrow-right icon-arrow"
          v-if="
            !['start', 'end'].includes(nodeData.nodeType) &&
            !nodeData.isOther &&
            !readonly
          "
        />
      </div>
      <div @click.stop>
        <el-popconfirm
          title="确定删除吗？"
          @confirm="deleteNode"
          v-if="
            !['start', 'end', 'condition'].includes(nodeData.nodeType) &&
            !readonly
          "
        >
          <i slot="reference" class="el-icon-close delete-btn" />
        </el-popconfirm>
      </div>
    </div>
    <div class="bottom-v-line" v-if="nodeData.nodeType !== 'end'" />
    <div class="add-node-btn" v-if="nodeData.nodeType !== 'end' && !readonly">
      <div
        :class="{ 'add-btn': true, active: showNodeType }"
        @click="toggleAppend"
        v-click-outside="hideAppend"
      >
        <i class="el-icon-plus icon-plus" />
      </div>
      <transition>
        <div class="add-node-types" v-show="showNodeType">
          <div
            class="node-type"
            v-for="item in nodeTypeList"
            :key="item.name"
            @click="appendNode(item.name)"
          >
            <i :class="['iconfont', 'node-type-icon', item.icon, item.name]" />
            <div class="node-type-name">{{ item.label || "-" }}</div>
          </div>
        </div>
      </transition>
    </div>
    <el-tooltip
      v-show="isWarning"
      class="warning-tips"
      :key="nodeData.warningText"
      effect="dark"
      :content="nodeData.warningText"
      placement="top"
    >
      <i class="el-icon-warning icon-warning" />
    </el-tooltip>
  </div>
</template>

<script>
export default {
  props: {
    data: {
      type: Object,
      default () {
        return {
          id: 'basicNode' + Date.now(),
          nodeType: 'approval',
          name: ''
        }
      }
    },
    branchNum: {
      type: Number,
      default: 0
    },
    sort: {
      type: Number,
      default: 0
    },
    readonly: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      showNodeType: false,
      nodeTypeList: [
        {
          name: 'approval',
          label: '审批人',
          icon: 'iconshenpi'
        },
        {
          name: 'copy',
          label: '抄送人',
          icon: 'iconchaosong'
        },
        {
          name: 'route',
          label: '分支',
          icon: 'icon24gf-branches'
        }
      ],
      nodeData: {},
      nodeContent: '',
      isWarning: false
    }
  },
  methods: {
    toggleAppend () {
      this.showNodeType = !this.showNodeType
    },
    hideAppend () {
      this.showNodeType = false
    },
    appendNode (nodeType) {
      this.$emit('transmit', {
        type: 'append',
        isStart: this.nodeData.nodeType === 'start',
        nodeType,
        nodeIds: [this.nodeData.id]
      })
    },
    deleteNode () {
      this.$emit('transmit', {
        type: 'delete',
        nodeType: this.nodeData.nodeType,
        nodeIds: [this.nodeData.id]
      })
    },
    clickNode () {
      if (
        ['start', 'end'].includes(this.nodeData.nodeType) ||
        this.nodeData.isOther
      ) { return }
      let transmitObj = {
        type: 'click',
        nodeType: this.nodeData.nodeType,
        nodeIds: [this.nodeData.id]
      }
      if (this.nodeData.nodeType === 'condition' && this.branchNum > 0) {
        transmitObj.sort = this.sort
        transmitObj.branchNum = this.branchNum
      }
      this.$emit('transmit', transmitObj)
    },
    formatNodeContent () {
      let str = ''
      // console.log("this.nodeData", this.nodeData);
      switch (this.nodeData.nodeType) {
        case 'condition':
          if (this.nodeData.conditionGroup.length) {
            this.nodeData.conditionGroup.forEach((item, index) => {
              str += index > 0 ? '或 ' : '当 '
              item.forEach((im, ix) => {
                str += ix
                  ? `，且 ${im.mainBody.label} 是 `
                  : `${im.mainBody.label} 是 `
                if (Array.isArray(im.value)) {
                  im.value.forEach((tag, tagIndex) => {
                    str += tagIndex ? '，' : ''
                    str += `${tag.name}`
                  })
                } else {
                  str += im.label
                }
              })
            })
          }
          break
        case 'approval':
          switch (this.nodeData.auditType) {
            case '1':
              if (this.nodeData.userList.length) {
                str += `审批人：`
                this.nodeData.userList.forEach((item, index) => {
                  str += index ? '，' : ''
                  str += `${item.name}`
                })
              } else {
                if (this.nodeData.mainBody.value === '2') {
                  str += '发起人自选'
                }
              }

              break
            case '2':
              str += '自动通过'
              break
            case '3':
              str += '自动拒绝'
              break
          }
          break
        case 'copy':
          if (this.nodeData.userList.length) {
            str += `抄送人：`
            this.nodeData.userList.forEach((item, index) => {
              str += index ? '，' : ''
              str += `${item.name}`
            })
          } else if (this.nodeData.mainBody.value === '2') {
            str += '发起人自选'
          }
      }
      return str
    },
    nodePlaceholder (type) {
      switch (type) {
        case 'start':
          return '流程开始'
        case 'phantom':
          return '不应该看到此节点'
        case 'approval':
          return '请设置审批人'
        case 'copy':
          return '请设置抄送人'
        case 'condition':
          return this.nodeData.isOther ? '其它条件进入此流程' : '请设置条件'
        case 'end':
          return '流程结束'
        default:
          return '-'
      }
    }
  },
  mounted () {},
  computed: {},
  watch: {
    data: {
      handler (newV) {
        if (newV) {
          // console.log("newV", newV);
          this.isWarning = !!newV.warningText
          Object.assign(this.nodeData, newV)
          this.nodeContent = this.formatNodeContent(this.nodeData)
        }
      },
      deep: true,
      immediate: true
    }
  }
}
</script>

<style lang="scss" scoped>
.flow-editor-node {
  position: relative;
  // prettier-ignore
  width: 200PX;
  // prettier-ignore
  height: 150PX;
  .flow-editor-node-container {
    background-color: rgb(123, 123, 123);
    position: absolute;
    top: 0;
    left: 0;
    // prettier-ignore
    width: 200PX;
    // prettier-ignore
    max-height: 92PX;
    z-index: 2;
    display: flex;
    flex-direction: column;
    border-radius: 8px;
    overflow: hidden;
    transition: all 0.2s ease;
    animation: firstSet 5s ease-out normal;
    .node-title {
      color: #fff;
      display: flex;
      justify-content: space-between;
      // prettier-ignore
      font-size: 12PX;
      // prettier-ignore
      padding: 3PX 13PX;
      box-sizing: border-box;
      user-select: none;
      .node-title-name {
        // prettier-ignore
        min-height: 18PX;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
      .node-btns {
        .delete-btn {
          padding: 4px;
          color: #a1a5ad;
          border-radius: 6px;
          font-weight: 700;
          border: none;
          font-size: 15px;
        }
      }
      .sort-text {
        display: block;
        user-select: none;
      }
    }
    .node-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-grow: 1;
      // prettier-ignore
      margin: 0 4PX 4PX;
      // prettier-ignore
      padding: 7PX 6PX 7PX 7PX;
      background: #fff;
      border-radius: 4px;
      // prettier-ignore
      min-height: 38PX;
      // prettier-ignore
      font-size: 14PX;
      color: #3e4759;
      user-select: none;
      cursor: pointer;
      .node-detail {
        overflow: hidden;
        .node-detail-item {
          white-space: normal;
          word-break: break-all;
          display: -webkit-box;
          overflow: hidden;
          text-overflow: ellipsis;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          &.node-item-placeholder {
            color: #a1a5ad;
          }
        }
      }
    }
    .delete-btn {
      display: none;
      position: absolute;
      // prettier-ignore
      top: 3PX;
      // prettier-ignore
      right: 5PX;
      // prettier-ignore
      font-size: 14PX;
      color: #fff;
      cursor: pointer;
    }
    &:hover {
      box-shadow: 0 0 6px #999;
      .delete-btn {
        display: block;
      }
      .sort-text {
        display: none;
      }
    }
    &.warning {
      border: 1px solid #ff5b4c;
      box-shadow: 0 0 3px 0 #ff5b4c;
      &:hover {
        box-shadow: 0 0 6px #ff5b4c;
      }
    }
  }
  &.start,
  .end {
    .flow-editor-node-container {
      background-color: #a9b4cd;
    }
  }
  &.approval {
    .flow-editor-node-container {
      background-color: #f80;
    }
  }
  &.condition {
    .flow-editor-node-container {
      background-color: #fff;
      .node-title {
        color: #2eb795;
        border-bottom: 1px solid #f6f6f7;
      }
    }
  }
  &.copy {
    .flow-editor-node-container {
      background-color: #3370ff;
    }
  }
  .bottom-v-line {
    position: absolute;
    bottom: 0;
    // prettier-ignore
    left: calc(50% - 2px / 2 );
    // prettier-ignore
    height: 150PX;
    // prettier-ignore
    width: 2px;
    background-color: #c2c5cc;
  }
  .add-node-btn {
    position: absolute;
    // prettier-ignore
    bottom: 26PX;
    // prettier-ignore
    width: 23PX;
    // prettier-ignore
    height: 23PX;
    border-radius: 50%;
    // prettier-ignore
    left: calc(50% - 23PX / 2);
    .add-btn {
      display: flex;
      justify-content: center;
      align-items: center;
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      border: 2px solid #c1d6ff;
      background-color: #fff;
      color: #37f;
      outline: none;
      cursor: pointer;
      transition: all 0.3s ease-out;
      .icon-plus {
        // prettier-ignore
        font-size: 10PX;
        font-weight: 700;
      }
      &.active {
        border: 2px solid #37f;
        box-shadow: 0 0 3px 0 #37f;
      }
      &:hover {
        border: 2px solid #37f;
        box-shadow: 0 0 3px 0 #37f;
      }
    }
    .add-node-types {
      pointer-events: auto;
      display: flex;
      position: absolute;
      // prettier-ignore
      top: -2px;
      // prettier-ignore
      left: 25PX;
      // prettier-ignore
      min-width: 200px;
      background-color: #fff;
      padding: 8px;
      z-index: 5;
      border-radius: 8px;
      user-select: none;
      // prettier-ignore
      box-shadow: 0 4PX 16PX 0 rgba(56, 73, 69, 0.11);

      .node-type {
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        align-items: center;
        margin: 0 8px;
        cursor: pointer;
        padding: 8px;
        border-radius: 4px;
        transition: background-color 0.2s ease-out;
        &:hover {
          background-color: rgba(31, 35, 41, 0.08);
        }
        .node-type-icon {
          line-height: 1;
          border-radius: 50%;
          font-size: 48px;
          box-sizing: border-box;
          padding: 8px;
          color: #fff;
          &.approval {
            background-color: #f80;
          }
          &.copy {
            background-color: #3370ff;
          }
          &.route {
            background-color: #7bddc4;
          }
        }
        .node-type-name {
          margin-top: 5px;
          white-space: nowrap;
          color: #3e4759;
          box-sizing: border-box;
        }
      }
    }
  }
  .warning-tips {
    position: absolute;
    right: -40px;
    top: 5px;
    font-size: 35px;
    color: #ff5b4c;
  }
}
@keyframes firstSet {
  // 0% {
  //   outline: 3px solid transparent;
  // }
  // 3% {
  //   outline: 3px solid #409eff;
  // }
  // 100% {
  //   outline: 3px solid transparent;
  // }
  0% {
    outline: 2px solid transparent;
    box-shadow: 0 0 10px transparent;
  }
  3% {
    outline: 2px solid #409eff;
    box-shadow: 0 0 10px #409eff;
  }
  100% {
    outline: 2px solid transparent;
    box-shadow: 0 0 10px transparent;
  }
}
</style>
