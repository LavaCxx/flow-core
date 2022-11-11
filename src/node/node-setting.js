function CreateNode (obj) {
  // console.log("obj", obj);
  for (let prop in obj) {
    this[ prop ] = JSON.parse(JSON.stringify(obj[ prop ]))
  }
}
export default {
  data () {
    return {
      NODE_COUNT: 1,
      // 定义单个节点
      START_NODE: {
        id: 'start',
        // 普通节点OR分支
        type: 'BasicNode',
        // 节点类型
        nodeType: 'start',
        name: '发起'
      },
      // 承接开始节点的伪节点，不渲染
      PHANTOM_NODE: {
        id: 'phantom',
        type: 'BasicNode',
        nodeType: 'phantom',
        name: '开始'
      },
      APPROVAL_NODE: {
        id: 'approval',
        type: 'BasicNode',
        nodeType: 'approval',
        name: '审批',
        // assigneeDeptIdList: ["1"],
        // assigneeRoleIdList: ["1"],
        // assigneeUserIdList: ["1"],
        // assigneeUserTagIdList: ["1"],
        // 主选项内容，但审批貌似抛弃了这个选择
        mainBody: {
          label: '',
          value: '1'
        },
        creatorAuditConfig: '1',
        auditType: '1',
        // 选择的人员
        userList: [],
        auditMode: '1',
        approved: '1',
        approvalFailed: '1',
        warningText: ''
      },
      CONDITION_NODE: {
        id: 'condition',
        type: 'BasicNode',
        nodeType: 'condition',
        name: '条件',
        // 条件组Arr，内部为条件Arr
        conditionGroup: [],
        warningText: ''
      },
      COPY_NODE: {
        id: 'copy',
        type: 'BasicNode',
        nodeType: 'copy',
        name: '抄送',
        mainBody: {
          label: '',
          value: '1'
        },
        userList: [],
        warningText: ''
      },
      END_NODE: {
        id: 'end',
        type: 'BasicNode',
        nodeType: 'end',
        name: '结束'
      },
      // 后端数据模板
      target: {
        startEventDto: {},
        // 后端需要这个对象来承接开始
        startTaskDto: {},
        endEventDto: {},
        auditTaskDtoList: [],
        exclusiveGatewayDtoList: [],
        sequenceFlowDtoList: [],
        automaticTaskDtoList: [],
        ccTaskDtoList: []
      }
    }
  },
  computed: {
    // 定义复合对象
    BRANCH () {
      return {
        id: `branch`,
        nodeList: [
          this.getNodes('CONDITION_NODE'),
          this.getNodes('APPROVAL_NODE')
        ]
      }
    },
    ROUTE_NODE () {
      return {
        id: 'route',
        type: 'RouteNode',
        data: [ this.getNodes('BRANCH'), this.getNodes('BRANCH') ]
      }
    },
    DEFAULT_FLOW () {
      return [
        this.getNodes('START_NODE'),
        this.getNodes('PHANTOM_NODE'),
        this.getNodes('APPROVAL_NODE'),
        this.getNodes('END_NODE')
      ]
    }
  },
  methods: {
    getNodes (nodeName, isOther) {
      if (nodeName === 'DEFAULT_FLOW') {
        return JSON.parse(JSON.stringify(this.DEFAULT_FLOW))
      }
      let node = new CreateNode(this[ nodeName ])
      node.id += `_${this.$getUUID()}`
      this.NODE_COUNT++
      return node
    },
    // 前端数据转后端
    frontToBack (source) {
      let rawList = JSON.parse(JSON.stringify(source))
      let target = JSON.parse(JSON.stringify(this.target))
      target.processViewJson = JSON.stringify(rawList)
      let totalArr = [ ...this.deepToArr(rawList) ] || []
      totalArr.forEach((item, index) => {
        item.list.forEach((im, ix) => {
          if (im.hasOwnProperty('data')) {
            target.exclusiveGatewayDtoList.push({
              id: im.id,
              name: `switch_${im.id}`,
              type: im.type
            })
          } else {
            if (im.nodeType === 'start') {
              target.startEventDto = im
            }
            if (im.nodeType === 'end') {
              target.endEventDto = im
            }
            if (index === 0 && ix >= item.list.length - 1) {
              // console.log("返回了", im);
              return
            }
            if (im.nodeType === 'condition') {
              let targetRef = this.findNext(totalArr.slice().reverse(), im.id)
              // if (item.list.length === 1) {
              //   totalArr.forEach((im2) => {
              //     im2.list.forEach((im3, ix3) => {
              //       if (im3.id === item.parentId) {
              //         // this.findNext(totalArr, im3.id).then(res => {
              //         //   targetRef = res
              //         // })
              //         try {
              //           targetRef = im2.list[ ix3 + 1 ].id
              //         } catch {
              //           console.log('item', item, totalArr[ index - 1 ])
              //           this.$message.error('请保证每个分支有多于一个的节点数量')
              //         }
              //       }
              //     })
              //   })
              // } else {
              //   targetRef = item.list[ ix + 1 ].id
              // }
              target.sequenceFlowDtoList.push({
                id: `lineId_${this.$getUUID()}`,
                priority: (item.sort ?? 0) + 1,
                name: `lineName_${this.$getUUID()}`,
                condition: this.formatCondition(im.conditionGroup),
                sourceRef: item.parentId,
                targetRef: targetRef
              })
            } else {
              let targetId = this.findNext(totalArr.slice().reverse(), im.id)
              // if (item.list.length > ix + 1) {
              //   targetId = item.list[ ix + 1 ].id
              // } else {
              //   totalArr.forEach((item2) => {
              //     item2.list.forEach((item3, index3) => {
              //       if (item3.id === item.parentId) {
              //         try {
              //           targetId = item2.list[ index3 + 1 ].id
              //         } catch {
              //           console.log('item2', item2, 'index3', index3)
              //           this.$message.error('请保证每个分支有多于一个的节点数量')
              //         }
              //       }
              //     })
              //   })
              // }
              target.sequenceFlowDtoList.push({
                id: `lineId_${this.$getUUID()}`,
                name: `lineName_${this.$getUUID()}`,
                sourceRef: im.id,
                targetRef: targetId
              })
              if (im.nodeType === 'approval') {
                if (im.auditType === '1') {
                  target.auditTaskDtoList.push(this.formatApproval(im))
                } else {
                  target.automaticTaskDtoList.push({
                    id: im.id,
                    automaticMode: +im.auditType - 1,
                    name: im.name
                  })
                }
              }
              if (im.nodeType === 'copy') {
                target.ccTaskDtoList.push(this.formatApproval(im))
              }
              if (im.nodeType === 'phantom') {
                target.startTaskDto = {
                  id: im.id,
                  name: im.name
                }
              }
            }
          }
        })
      })
      return target
    },
    // 格式化条件字符串
    formatCondition (conditionGroup = []) {
      if (!conditionGroup.length) {
        return ''
      }
      let str = '${('
      conditionGroup.forEach((item, index) => {
        let userCollect = {
          user: {
            id: 'start_user_id',
            list: []
          },
          department: {
            id: 'start_user_dept_id',
            list: []
          },
          tag: {
            id: 'start_user_tag_id',
            list: []
          },
          role: {
            id: 'start_user_role_id',
            list: []
          }
        }
        let dictList = []
        // {label,value}
        item.forEach((im, ix) => {
          if (Array.isArray(im.value)) {
            im.value.forEach((tag) => {
              userCollect[ tag.type ].list.push(tag.id)
            })
          } else {
            dictList.push({ label: im.mainBody.type, value: im.label })
          }
        })
        let needSymbol = false
        for (const prop in userCollect) {
          if (userCollect[ prop ].list.length) {
            if (needSymbol) {
              str += '&&'
              needSymbol = false
            }
            str += '('
            userCollect[ prop ].list.forEach((im, ix) => {
              if (ix) {
                str += '||'
              }
              str += `${userCollect[ prop ].id}.contains("${im}")`
            })
            str += ')'
            // str+=`(${userCollect[prop].id}.contains("${userCollect[prop].list.join(")||contains(")})`
            // str += `"${userCollect[prop].list.join(",")}".contains(${
            //   userCollect[prop].id
            // })`;
            needSymbol = true
          }
        }
        if (dictList.length) {
          dictList.forEach((im, ix) => {
            if ((!ix && needSymbol) || ix) {
              str += '&&'
            }
            str += `${im.label}=='${im.value}'`
          })
        }
        str += index ? ')||' : ')'
      })
      str += '}'
      return str
    },
    // 格式化审批对象
    formatApproval (data) {
      data.assigneeDeptIdList = []
      data.assigneeRoleIdList = []
      data.assigneeUserIdList = []
      data.assigneeUserTagIdList = []
      data.userList.forEach((item) => {
        switch (item.type) {
          case 'user':
            data.assigneeUserIdList.push(item.id)
            break
          case 'role':
            data.assigneeRoleIdList.push(item.id)
            break
          case 'userTag':
            data.assigneeUserTagIdList.push(item.id)
            break
          case 'department':
            data.assigneeDeptIdList.push(item.id)
            break
        }
      })
      return data
    },
    // 遍历几个对象，看有没有对应数据
    // returnBackObj(source, targetRef) {
    //   if (source.startEventDto.id === targetRef)
    //     return { nodeType: "start", data: source.startEventDto };
    //   if (source.endEventDto.id === targetRef)
    //     return { nodeType: "end", data: source.endEventDto };
    //   let approvalIndex = source.auditTaskDtoList.findIndex(
    //     (item) => item.id === targetRef
    //   );
    //   if (~approvalIndex)
    //     return {
    //       nodeType: "approval",
    //       data: source.auditTaskDtoList[approvalIndex],
    //     };
    //   let gateWayIndex = source.exclusiveGatewayDtoList.findIndex(
    //     (item) => item.id === targetRef
    //   );
    //   if (~gateWayIndex) {
    //     let { id, name } = source.exclusiveGatewayDtoList[gateWayIndex];
    //     return {
    //       nodeType: "route",
    //       data: { id, name },
    //     };
    //   } else {
    //     throw new Error("无法查询到节点内容-" + targetRef);
    //   }
    // },
    // 返回flowList里的每一个分支
    * deepToArr (nodes = [], parentId = '', sort = 0) {
      yield { list: nodes, parentId, sort }
      for (let item of nodes) {
        if (item.data && item.data.length) {
          for (let i = 0; i < item.data.length; i++) {
            yield * this.deepToArr(item.data[ i ].nodeList, item.id, i)
          }
        }
      }
    },
    // 寻找序列中的下一个对象
    findNext (reverseArr = [], id) {
      // let reverseArr = totalArr.reverse()
      // console.log('newLoop', id)
      for (let i = 0; i < reverseArr.length; i++) {
        for (let k = 0; k < reverseArr[i].list.length; k++) {
          if (reverseArr[i].list[k].id === id) {
            if (k === reverseArr[i].list.length - 1) {
              // console.log(reverseArr[i], id, i, k)
              id = reverseArr[i].parentId
              break
            } else {
              // console.log('done', reverseArr[i], id, i, k)
              return reverseArr[i].list[k + 1].id
            }
          }
        }
      }
    }
  }
}
