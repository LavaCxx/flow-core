<template>
  <div :class="{ 'flow-editor-node': true, route: true, hide: readonly }">
    <div class="top-h-line" />
    <div :class="{ 'add-branch': true, hide: readonly }" @click="appendBranch">
      <div class="add-branch-inner">
        添加条件
        <i class="el-icon-arrow-right icon-arrow" />
      </div>
      <!-- {{routeData.id}} -->
    </div>
    <div class="branches">
      <div
        class="flow-editor-node branch"
        v-for="(item, index) in routeData.data"
        :key="item.id"
      >
        <div class="top-line-mask" />
        <div class="top-v-line" />
        <div class="nodes">
          <component
            v-for="subItem in item.nodeList"
            :key="subItem.id"
            :is="subItem.type || 'RouteNode'"
            :data="subItem"
            :readonly="readonly"
            v-show="subItem.nodeType !== 'phantom'"
            :branchNum="routeData.data.length"
            :sort="index + 1"
            @transmit="transmitToParent($event, item.id)"
          />
        </div>
        <div class="bottom-v-line" />
        <div class="bottom-line-mask" />
      </div>
    </div>
    <div class="bottom-h-line" />
    <div class="bottom-v-line" />
    <div class="add-node-btn" v-if="!readonly">
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
  </div>
</template>

<script>
import BasicNode from './basic-node.vue'
export default {
  name: 'RouteNode',
  components: { BasicNode },
  props: {
    data: {
      type: Object,
      default () {
        return {}
      }
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
      routeData: {},
      branchList: []
    }
  },
  methods: {
    toggleAppend () {
      // console.log("showNodeType", this.showNodeType);
      this.showNodeType = !this.showNodeType
    },
    hideAppend () {
      this.showNodeType = false
    },
    // 接收子组件数据，向上传递
    transmitToParent (data, branchId) {
      data.nodeIds.unshift(this.routeData.id, branchId)
      this.$emit('transmit', data)
    },
    appendNode (nodeType) {
      this.$emit('transmit', {
        type: 'append',
        nodeType,
        nodeIds: [this.routeData.id]
      })
    },
    appendBranch () {
      // console.log("click");
      this.$emit('transmit', {
        type: 'appendBranch',
        nodeIds: [this.routeData.id]
      })
    }
  },
  watch: {
    data: {
      handler (newV) {
        if (newV) {
          this.routeData = JSON.parse(JSON.stringify(newV))
        }
      },
      deep: true,
      immediate: true
    }
  }
}
</script>

<style lang="scss" scoped>
.flow-editor-node.route {
  display: flex;
  flex-direction: column;
  &.hide {
    // prettier-ignore
    margin-top: -10PX;
  }
  .top-h-line {
    height: 2px;
    background-color: #c2c5cc;
    margin-top: 13px;
    margin-bottom: -15px;
  }
  .add-branch {
    position: relative;
    // prettier-ignore
    height: 28px;
    margin-bottom: 16px;
    border-radius: 14px;
    border: 1px solid transparent;
    align-self: center;
    color: #37f;
    font-size: 12px;
    cursor: pointer;
    z-index: 1;
    &.hide {
      visibility: hidden;
      pointer-events: none;
    }
    .add-branch-inner {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      padding: 10px 14px;
      border: 2px solid #c1d6ff;
      // prettier-ignore
      border-radius: 14PX;
      transition: all 0.3s ease-out;
      background-color: #fff;
      user-select: none;
      .icon-arrow {
        font-size: 16px;
      }
      &:hover {
        border: 2px solid #37f;
        box-shadow: 0 0 2px 0 #37f;
      }
    }
  }
  .branches {
    display: flex;
    justify-content: center;
    .flow-editor-node.branch {
      position: relative;
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      padding: 0 50px;
      min-height: 100%;
      .top-line-mask {
        top: -31px;
        display: none;
        position: absolute;
        width: 50%;
        height: 2px;
        z-index: 2;
        background-color: #f0f0f2;
      }
      .top-v-line {
        display: block;
        position: absolute;
        top: -31px;
        left: calc(50% - 1px);
        width: 2px;
        height: 31px;
        background-color: #c2c5cc;
      }
      .nodes {
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .bottom-v-line {
        display: block;
        width: 2px;
        background-color: #c2c5cc;
        flex-grow: 1;
      }
      .bottom-line-mask {
        display: none;
        position: absolute;
        width: 50%;
        height: 2px;
        bottom: -2px;
        background-color: #f0f0f2;
      }
      &:first-child {
        > .top-line-mask {
          display: block;
          left: 0;
        }
        > .bottom-line-mask {
          display: block;
          left: 0;
        }
      }
      &:last-child {
        > .top-line-mask {
          display: block;
          right: 0;
        }
        > .bottom-line-mask {
          display: block;
          right: 0;
        }
      }
    }
  }
  .bottom-h-line {
    // prettier-ignore
    height: 2px;
    background-color: #c2c5cc;
  }
  > .bottom-v-line {
    // prettier-ignore
    height: 100px;
    // prettier-ignore
    width: 2px;
    background-color: #c2c5cc;
    align-self: center;
  }
  .add-node-btn {
    // prettier-ignore
    margin-top: -61.5PX;
    // prettier-ignore
    margin-bottom: 38.5PX;
    align-self: center;
    position: relative;
    // prettier-ignore
    width: 23PX;
    // prettier-ignore
    height: 23PX;
    box-sizing: border-box;
    border-radius: 50%;
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
      border: 4px solid #c1d6ff;
      background-color: #fff;
      color: #37f;
      outline: none;
      z-index: auto;
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
      user-select: none;
      // prettier-ignore
      top: -2px;
      // prettier-ignore
      left: 25PX;
      // prettier-ignore
      min-width: 200px;
      background-color: #fff;
      padding: 8px;
      z-index: 5;
      border-radius: 4px;
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
          margin-top: 4px;
          white-space: nowrap;
          color: #3e4759;
          box-sizing: border-box;
        }
      }
    }
  }
}
</style>
