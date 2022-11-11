<template>
  <div class="flow-content" ref="flowContent" v-drawable:ControlLeft>
    <div class="node-count" v-if="!readonly">
      <span
        :class="{
          near: maxCount - nodeNum <= maxCount * 0.2,
          exceed: nodeNum >= maxCount - 1,
          overload: nodeNum >= maxCount + exceedCount - 3,
        }"
        >{{ nodeNum }}</span
      >
      / <span class="max-count"> {{ maxCount }}</span>
    </div>
    <div class="scale-bar" v-show="isModern" v-if="!readonly">
      <el-slider
        v-model="scalePercent"
        :step="scaleStep"
        :min="minScale"
        :max="maxScale"
        :marks="sliceMarks"
        :show-stops="false"
        show-tooltip
        label="放大比例"
      />
      <!-- <el-input-number
        class="scale-input"
        v-model="scalePercent"
        :min="minScale"
        :max="maxScale"
        :step="scaleStep"
        step-strictly
      /> -->
    </div>
    <div class="reset-button" v-if="!readonly">
      <el-button @click="resetFlow">清空</el-button>
      <!-- <el-button @click="getBackData">储存当前</el-button> -->
      <!-- <el-button @click="formatBackData">测试当前</el-button> -->
      <!-- <el-button @click="handleOpenDrawer">显示抽屉</el-button> -->
    </div>
    <div class="flow-box" :style="{ '--scale-rate': scaleValue }">
      <component
        v-for="item in flowList"
        :key="item.id"
        :is="item.type || 'RouteNode'"
        :data="item"
        v-show="item.nodeType !== 'phantom'"
        :readonly="readonly"
        @transmit="transmitReach"
      />
    </div>
    <ApprovalSetting
      :data="drawerData.data"
      :sortInfo="drawerData.sortInfo"
      :visible="drawerVisible"
      @close="handleCloseDrawer"
      :readonly="readonly"
      @confirm="handleConfirmDrawer"
    />
  </div>
</template>

<script>
import BasicNode from './node/basic-node.vue'
import RouteNode from './node/route-node.vue'
import nodeSetting from './node/node-setting.js'
import ApprovalSetting from './approval-setting.vue'
// import { smoothMove } from "@/utils/smoothMove";
export default {
  mixins: [nodeSetting],
  components: {
    BasicNode,
    RouteNode,
    ApprovalSetting
  },
  props: {
    data: {
      type: String
    },
    readonly: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      flowList: [],
      // 缩放最小值
      minScale: 40,
      // 缩放最大值
      maxScale: 160,
      // 缩放步进值
      scaleStep: 20,
      // 最多可保存节点数量
      maxCount: 30,
      // 默认缩放倍率
      scalePercent: 100,
      // 可超出操作的节点数量
      exceedCount: 10,

      // 某些浏览器的缩放有问题，所以不支持的就过滤掉
      isModern: true,
      // 鼠标当前位置，要做位置位移的时候应该用的上
      mouseX: 0,
      mouseY: 0,
      // 抽屉显示
      drawerVisible: false,
      // 抽屉数据
      drawerData: {},
      processDict: [],
      // 暂存的分支父对象，用于交换数据
      currentParent: []
    }
  },
  methods: {
    getMousePos (event) {
      const { clientX, clientY } = event
      this.mouseX = clientX
      this.mouseY = clientY
    },
    // scrollToMouse(moreY = 150) {
    //   let toX = this.mouseX;
    //   let toY = this.mouseY + moreY;
    //   this.$refs.flowContent.scrollTo(toX, toY);
    // },
    transmitReach (data) {
      switch (data.type) {
        case 'append':
          this.appendNode(data)
          break
        case 'delete':
          this.deleteNode(data)
          break
        case 'appendBranch':
          this.appendBranch(data)
          break
        case 'click':
          this.handleOpenDrawer(data)
      }
    },
    // 根据ids寻找最终的flow列表和nodeId
    deepReach (ids) {
      let routeObj = {}
      let parentArr = this.flowList
      let nodeIndex = null
      // console.log("nodeIds", ids);
      ids.forEach((item, index) => {
        nodeIndex = parentArr.findIndex((im) => im.id === item)
        // console.log("parentArr", parentArr, item);
        routeObj = parentArr.find((im) => im.id === item)
        // console.log("routeObj", routeObj);
        if (index !== ids.length - 1) {
          parentArr = routeObj.data || routeObj.nodeList
        }
      })

      return { parentArr, nodeIndex }
    },
    appendNode (data) {
      console.log('data', data)
      const { nodeType, nodeIds } = data
      let { parentArr, nodeIndex } = this.deepReach(nodeIds)
      if (data.isStart) {
        nodeIndex++
      }
      // console.log(parentArr, nodeIndex);
      if (nodeType === 'route') {
        if (this.nodeNum > this.maxCount + this.exceedCount - 2) {
          this.$message.error('无法增加更多节点')
          return
        }
      } else {
        if (this.nodeNum > this.maxCount + this.exceedCount - 1) {
          this.$message.error('无法增加更多节点')
          return
        }
      }
      // this.scrollToMouse(nodeType === "route" ? 240 : 120);
      let pushObj = this.getNodes(`${nodeType.toUpperCase()}_NODE`)
      if (nodeType === 'route') {
        pushObj.data.slice(-1)[0].nodeList[0].isOther = true
      }
      console.log('pushObj', pushObj)
      parentArr.splice(nodeIndex + 1, 0, pushObj)
    },
    deleteNode (data) {
      const { nodeIds, nodeType } = data
      let lastId = ''
      let lastIndex = null
      if (nodeType === 'condition') {
        nodeIds.pop()
        lastId = nodeIds.slice(-1)[0]
      }
      let { parentArr, nodeIndex } = this.deepReach(nodeIds)
      if (nodeType === 'condition') {
        if (parentArr.length > 2) {
          lastIndex = parentArr.findIndex((item) => item.id === lastId)
          parentArr.splice(lastIndex, 1)
        } else {
          nodeIds.pop()
          lastId = nodeIds.slice(-1)[0]
          let grandObj = this.deepReach(nodeIds)
          lastIndex = grandObj.parentArr.findIndex(
            (item) => item.id === lastId
          )
          grandObj.parentArr.splice(lastIndex, 1)
        }
      } else {
        parentArr.splice(nodeIndex, 1)
        // this.nodeNum -= 1;
      }
    },
    appendBranch (data) {
      const { nodeIds } = data
      const { parentArr, nodeIndex } = this.deepReach(nodeIds)
      if (this.nodeNum > this.maxCount + this.exceedCount - 1) {
        this.$message.error('无法增加更多节点')
        return
      }
      let newBranch = this.getNodes('BRANCH')
      parentArr[nodeIndex].data.splice(
        parentArr[nodeIndex].data.length - 1,
        0,
        newBranch
      )
    },
    resetFlow () {
      this.$confirm('是否重置审核流程', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.flowList = this.getNodes('DEFAULT_FLOW')
        this.$message.success('已重置流程')
      })
    },
    checkUserAgent () {
      let userAgent = navigator.userAgent
      if (
        ~userAgent.indexOf('Trident') ||
        ~userAgent.indexOf('MicroMessenger')
      ) {
        this.isModern = false
      }
    },
    // 抽屉
    handleOpenDrawer (data) {
      const { nodeIds } = data
      const { parentArr, nodeIndex } = this.deepReach(nodeIds)
      console.log('data', data)

      this.drawerData = {
        data: parentArr[nodeIndex],
        sortInfo: {
          sort: data.sort || 1,
          branchNum: data.branchNum || 1
        }
      }
      if (nodeIds.length > 1) {
        nodeIds.pop()
        this.currentParent = this.deepReach(nodeIds).parentArr
      }
      this.drawerVisible = true
    },
    handleCloseDrawer () {
      this.drawerVisible = false
    },
    handleConfirmDrawer (data) {
      Object.assign(this.drawerData.data, data.data)
      if (
        data.data.nodeType === 'condition' &&
        !data.data.isOther &&
        data.sort !== this.drawerData.sortInfo.sort
      ) {
        this.swapArrayItem(this.drawerData.sortInfo.sort - 1, data.sort - 1)
      }
      this.handleCloseDrawer()
    },
    swapArrayItem (oldSort, newSort) {
      console.log(this.currentParent)
      this.currentParent.splice(
        newSort,
        0,
        this.currentParent.splice(oldSort, 1)[0]
      )
    },
    getBackData () {
      let obj = this.frontToBack(this.flowList)
      console.log('obj', obj)
    },
    validData () {
      return new Promise((resolve, reject) => {
        let wrongNum = 0
        let valid = true
        let totalArr = [...this.deepToArr(this.flowList)] || []
        totalArr.forEach((item) => {
          item.list.forEach((im) => {
            if (im.nodeType === 'condition') {
              if (im.isOther) {
                this.$set(im, 'warningText', '')
                return
              }
              if (im.conditionGroup.length === 0) {
                this.$set(im, 'warningText', '请设置审批条件')
                wrongNum++
                valid = false
              } else {
                if (~im.conditionGroup.findIndex((im2) => im2.length === 0)) {
                  this.$set(im, 'warningText', '请设置审批条件')
                  wrongNum++
                  valid = false
                } else {
                  this.$set(im, 'warningText', '')
                }
              }
            }
            if (im.nodeType === 'approval') {
              if (
                (im.userList.length === 0 || !im.mainBody.value) &&
                im.mainBody.value !== '2' &&
                im.auditType === '1'
              ) {
                wrongNum++
                this.$set(im, 'warningText', '未设置审批人')
                valid = false
              } else {
                im.warningText = ''
              }
            }
            if (im.nodeType === 'copy') {
              if (
                (im.userList.length === 0 || !im.mainBody.value) &&
                im.mainBody.value !== '2'
              ) {
                wrongNum++
                this.$set(im, 'warningText', '未设置审批人')
                valid = false
              } else {
                im.warningText = ''
              }
            }
          })
        })
        let warningText = ''
        if (this.nodeNum > this.maxCount) {
          valid = false
          warningText = `节点数量不能超过${this.maxCount}个`
        }
        resolve({ valid, wrongNum, warningText })
      })
    }
  },
  created () {
    this.checkUserAgent()
    // this.nodeNum += 3;
  },
  mounted () {
    this.$refs.flowContent.addEventListener('click', this.getMousePos, true)
  },
  unmounted () {
    this.$refs.flowContent.removeEventListener(
      'click',
      this.getMousePos,
      false
    )
  },
  computed: {
    nodeNum () {
      let totalArr = [...this.deepToArr(this.flowList)] || []
      let rawNodeNum = totalArr.reduce((prev, cur) => {
        return prev + cur.list.length
      }, 0)
      let routeNodeList = [...new Set(totalArr.map((item) => item.parentId))]
      // 去除条件节点和分支节点
      rawNodeNum -= totalArr.length - 1 + routeNodeList.length - 1
      return rawNodeNum
    },
    scaleValue () {
      return +((this.scalePercent || 100) / 100).toFixed(2)
    },
    sliceMarks () {
      let obj = {}
      let num = this.minScale
      while (num <= this.maxScale) {
        if (num === 100) {
          obj[num.toString()] = {
            style: {
              color: '#1989FA'
            },
            label: this.$createElement('strong', '100%')
          }
        } else {
          obj[num.toString()] = num.toString() + '%'
        }
        num += this.scaleStep
      }
      return obj
    }
  },
  watch: {
    nodeNum (newV, oldV) {
      if (oldV <= this.maxCount && newV > this.maxCount) {
        this.$message.info(`请保持节点数量不多于${this.maxCount}个`)
      }
    },
    data: {
      handler (newV) {
        if (newV) {
          this.flowList = JSON.parse(newV)
        } else {
          this.flowList = this.getNodes('DEFAULT_FLOW')
        }
      },
      immediate: true
    }
  }
}
</script>

<style lang="scss" scoped>
.flow-content {
  padding: 50px 0 0;
  width: 100%;
  padding-right: 100px;
  // height: calc(100% - 500px);
  // height: 100%;
  height: calc(100vh - 220px);
  position: relative;
  flex: 1;
  overflow: auto;
  box-sizing: border-box;
  background-color: #f0f0f2;
  margin: auto;
  scrollbar-width: none;
  // scroll-behavior: smooth;
  &:focus-within {
    scrollbar-width: none;
  }
  .node-count {
    position: fixed;
    bottom: 10%;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 15px;
    right: calc(3% + 15px);
    font-size: 75px;
    color: #8896b3e0;
    user-select: none;
    pointer-events: auto;
    z-index: 3;
    opacity: 0.9;
    text-shadow: 2px 2px 4px #e9e9eb;
    transition: all 0.3s ease-out;
    padding: 0 15px;
    &:hover {
      background: rgba(255, 255, 255, 8);
      .max-count {
        text-shadow: 1px 1px 3px #b0b1b4;
      }
    }
    span {
      color: #8896b3e0;
    }
    .near {
      color: #e6a23c;
      text-shadow: 2px 2px 4px #faecd8;
    }
    .exceed {
      color: #f56c6c;
      text-shadow: 2px 2px 4px #fde2e2;
    }
    .overload {
      color: #ac6cf5;
      opacity: 1;
      text-shadow: 2px 2px 4px #e1c6ff;
    }
    .max-count {
      color: #909399;
      transition: all 0.3s ease-out;
    }
  }
  .scale-bar {
    position: fixed;
    bottom: 4%;
    padding: 0 15px;
    right: 3%;
    width: 290px;
    height: 60px;
    box-sizing: border-box;
    // background-color: #fff;
    z-index: 4;
    user-select: none;
    overflow: hidden;
    opacity: 0.7;
    transition: all 0.3s ease-out;
    &:hover {
      opacity: 1;
    }
    // 如果改用计数器组件，下面的就生效了

    .scale-input {
      position: relative;
      ::v-deep .el-input__inner {
        text-align: center;
        font-size: 16px;
      }
      &::after {
        content: "%";
        position: absolute;
        top: 0;
        line-height: 42px;
        right: 64px;
        font-size: 16px;
        color: #333;
        user-select: none;
        pointer-events: none;
        z-index: 4;
      }
    }
  }
  .reset-button {
    position: absolute;
    top: 15px;
    left: 15px;
  }
  .flow-box {
    --scale-rate: 1;
    min-width: 100%;
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    padding: 0 100px;
    box-sizing: border-box;
    min-height: 100%;
    // position: absolute;
    // top: 0;
    // left: 0;
    // z-index: 3;
    transition: all 0.2s ease;
    -moz-transform: scale(var(--scale-rate));
    zoom: var(--scale-rate);
    -moz-transform-origin: center top;
  }
}
</style>
