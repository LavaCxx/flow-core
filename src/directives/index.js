// 点击其它地方触发事件
const clickOutside = {
  // 初始化指令
  bind (el, binding) {
    function clickHandler (e) {
      // 这里判断点击的元素是否是本身，是本身，则返回
      if (el.contains(e.target)) {
        return false
      }
      // 判断指令中是否绑定了函数
      if (binding.expression) {
        // 如果绑定了函数 则调用那个函数，此处binding.value就是handleClose方法
        binding.value(e)
      }
    }

    el.__vueClickOutside__ = clickHandler
    document.addEventListener('click', clickHandler)
  },
  update () {},
  unbind (el, binding) {
    // 解除事件监听
    document.removeEventListener('click', el.__vueClickOutside__)
    delete el.__vueClickOutside__
  }
}

// 防冒泡
const depop = (el) => {
  el.addEventListener('click', (e) => {
    e.stopPropagation()
  })
  el.addEventListener('mousedown', (e) => {
    e.stopPropagation()
    recursion(el)
  })
}
const drawable = {
  bind (el, binding) {
    let code = binding.arg || 'ControlLeft'
    window.addEventListener('blur', windowBlur)
    document.addEventListener('keydown', hold)
    document.addEventListener('keyup', unHold)
    let startX = 0 // el的scroll横向初始位置
    let gapX = 0 // 鼠标点击时的横向初始位置
    let startY = 0 // el的scroll纵向向初始位置
    let gapY = 0 // 鼠标点击时的纵向初始位置
    el.__startEvent__ = start
    el.__holdEvent__ = hold
    el.__unHoldEvent__ = unHold
    el.__stopEvent__ = stop
    el.__blurEvent__ = windowBlur
    // 有时候截图的时候也会ctrl，导致一直卡在ctrl状态，因此加个清除的事件监听
    function windowBlur () {
      setTimeout(() => {
        el.style.cursor = 'default'
      }, 0)
    }
    function hold (event) {
      if (event.code === code) {
        if (el.style.cursor !== 'grabbing') el.style.cursor = 'grab'

        el.addEventListener('mousedown', start)
      }
    }
    function unHold (event) {
      if (event.code === code) {
        el.removeEventListener('mousedown', start, false)
        stop()
        el.style.cursor = 'default'
      }
    }
    function start (event) {
      // 判断是否点击鼠标左键
      // console.log("event", event);
      if (event.button === 0) {
        gapX = event.clientX
        gapY = event.clientY
        startX = el.scrollLeft
        startY = el.scrollTop
        el.style.cursor = 'grabbing'
        el.addEventListener('mousemove', move) // document
        el.addEventListener('mouseup', stop)
      }
      // event.preventDefault(); // 阻止默认事件或冒泡 如拖拽时选中文本
      return false
    }
    function move (event) {
      // 移动时的坐标 - 鼠标左键点击时的坐标 = 鼠标移动的相对距离
      let left = event.clientX - gapX
      let top = event.clientY - gapY
      // 滚动条初始坐标 - 移动的相对距离 = 应该滚动后的坐标
      el.scrollTo(startX - left * 1.5, startY - top * 1.5) // 横向 纵向
      return false
    }
    function stop () {
      // 鼠标松开，解除绑定
      el.style.cursor = 'grab'
      el.removeEventListener('mousemove', move, false)
      el.removeEventListener('mouseup', stop, false)
    }
  },
  unbind (el) {
    el.style.cursor = 'default'
    el.removeEventListener('mousedown', el.__startEvent__, false)
    document.removeEventListener('keydown', el.__holdEvent__, false)
    document.removeEventListener('keyup', el.__unHoldEvent__, false)
    window.removeEventListener('blur', el.__blurEvent__, false)
    el.__startEvent__ = null
    el.__holdEvent__ = null
    el.__unHoldEvent__ = null
    el.__stopEvent__ = null
    el.__blurEvent__ = null
  }
}
export { clickOutside, depop, drawable }
