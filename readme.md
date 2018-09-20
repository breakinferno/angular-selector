### 下拉选择框组件

该组件使用angular.js 1.7.4，使用指令模块化的方式进行编写。由于angular.js天然存在的模块机制的坑，可能导致命名冲突，使用时应该注意。

主要功能： 增加blur，增加键盘响应，增加自定义模板，增加对分组的支持，增加数据对promise的处理

#### API：

    require: '=?',          // 是否必须
    type:    '@?',          // 组件类型
    inputType: '@?',        // 输入数据类型
    disable: '@?',          // 是否允许选择
    disableSearch: '@?',    // 是否允许搜索项
    placeholder: '@?',      // 占位符
    filterFunc: '@?',       // 过滤函数
    searchValue: '@?',      // 搜索框值
    bindAttr: '=?',         // 绑定属性值
    debounce: '@?',         // 节流
    onChange: '&?',         // 更改时回调
    onSelect: '&?',         // 选择时回调
    totalData:     '=?',    // 全部数据
    setOptionLabel: '&?',   // 设置label的显示的数据
    setOptionGroup: '&?',   // 设置group的显示值
    setOptionSelect: '&?',  // 设置select值的数据
    setOptionInput: '&?',   // 设置input数据
    labelAttr:  '@?',       // label属性
    valueAttr:  '@?',       // value属性
    groupAttr:  '@?',       // 组属性
    inputAttr:  '@?',       // input属性
    optionHeight: '@?',     // 下拉框高度
    optionWidth: '@?',      // 下拉框宽度
    height: '@?',           // input高度
    width:  '@?',           // input宽度
    inputStyle: '@?',       // input 样式
    keep: '@?',             // 重新获取焦点时是否保留数据，0不保留，1保留输入数据，2保留选择数据
    error: '=?',            // 错误
    dropdownItemTemplate:   '=?',   // 自定义下拉项模板
    dropdownGroupTemplate:  '=?'    // 自定义下拉组模板
