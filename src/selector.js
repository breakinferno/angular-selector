'use strict';

/**
 * 下拉框优化
 * @author luffylv
 * @description 增加blur，增加键盘响应，增加自定义模板，增加对分组的支持，增加数据对promise的处理
 */

 /**
  * sample:
  *   Javascript:
  *     $scope.totalData = [
        {'ID':'1', 'TIPIS':'GroupName1', 'DESC':'name'},
        {'ID':'2', 'TIPIS':'GroupName1', 'DESC':'name1'},
        {'ID':'3', 'TIPIS':'GroupName2', 'DESC':'name2'},
        {'ID':'4', 'TIPIS':'GroupName1', 'DESC':'name3'},
    ];
      HTML
        <div selector-plus total-data="totalData" group-attr="TIPIS" label-attr="DESC"></div>
        <div selector-plus total-data="totalData" debounce="10" label-attr="DESC" type="select" keep="1"></div>
        <div selector-plus total-data="totalData" placeholder="请选择" debounce="10" label-attr="DESC" disable-search = "true" type="dropdown" search-value="自定义名字"></div>
        <div selector-plus placeholder="select" type="input"></div>
  */

import './index.css';

const KEYS = { up: 38, down: 40, left: 37, right: 39, escape: 27, enter: 13, backspace: 8, delete: 46, shift: 16, leftCmd: 91, rightCmd: 93, ctrl: 17, alt: 18, tab: 9 };

const defaults = {
    type:                   'select',   // 默认类型为选择框（可选input,dropdown, select, dropdown-select)
    searchValue:            '',         // 搜索内容
    disable:                false,      // 是否可用, 是则不可用
    disableSearch:          false,      // 是否允许选择,是则不可过滤，只读
    showOption:             false,      // 是否显示选择框
    value:                  null,       // 选择的值
    highlighted:            0,          // 高亮项
    totalData:              [],         // 全部数据
    labelAttr:              null,       // 对象数组时指定哪个属性作为label
    groupAttr:              null,       // 对象数组时指定哪个属性作为group
    valueAttr:              null,       // 对象数组时指定哪个属性作为value
    inputAttr:              null,       // input显示时指定属性作为值
    options:                [],
    debounce:               0,          // 节流时间ms
    css: {
        input: {
            // height:         '30px',     // input高度
            // width:          '400px',    // input宽度
        },
        dropdown: {
            maxHeight:   '200px',          // 下拉框高度
        }
    },
    keep:                   2,           // 数据留存行为
    dropdownItemTemplate:   'selector/item.html', // 下拉项
    dropdownGroupTemplate:  'selector/group.html', // 下拉组项
    onChange: ()=>{},
    onSelect: ()=>{}
};

const templates = {
    selector: ` <div class="selector-plus-container">
                    <label>
                        <input
                            type="inputType || 'txt'"
                            ng-model="searchValue"
                            ng-change="$onChange()"
                            placeholder="{{!hasValue() ? placeholder : \'\'}}"
                            ng-model-options="{debounce: debounce}"
                            ng-disabled="disable"
                            ng-readonly="disableSearch"
                            ng-required="required && !hasValue()"
                            autocomplete="on"
                            ng-keydown="keydown($event)"
                            ng-focus="open($event)"
                            ng-style="css.input"
                            ng-click="error=false"
                            ng-class="{\'ui\':true, \'input\': true, error:error}"/>
                            <span class="selector-cursor" ng-if="type === 'dropdown' || type === 'dropdown-select'" ng-click="handleCursorClick($event);error=false">
                                <i class="icon iconfont up" ng-show="!showOption">&#xe600;</i>
                                <i class="icon iconfont down" ng-show="showOption">&#xe601;</i>
                            </span>
                    </label>
                    <ul class="selector-dropdown" ng-show="showOption && filteredOptions && filteredOptions.length" ng-style="css.dropdown">
                        <li ng-repeat-start="(index, option) in filteredOptions track by index"
                            ng-include="dropdownGroupTemplate">
                        </li>
                        <li ng-repeat-end
                            class="selector-option"
                            ng-include="dropdownItemTemplate"
                            ng-mouseover="highlight(index)"
                            ng-click="set()">
                        </li>
                    </ul>
                </div>`,
    item:   '<span ng-bind="setOptionLabel(option)" ng-class="{\'selector-i\':true, group:groupAttr}"></span>',
    group:  '<span ng-bind="setOptionGroup(option, index)" ng-class="{\'selector-group-i\': true, group:setOptionGroup(option, index)===\'\'}"></span>'
};

// 获取样式
function getStyles(element) {
    return !(element instanceof HTMLElement) ? {} :
        element.ownerDocument && element.ownerDocument.defaultView.opener
            ? element.ownerDocument.defaultView.getComputedStyle(element)
            : window.getComputedStyle(element);
}

export default ['$templateCache', '$timeout', '$q', ($templateCache, $timeout, $q)=>{
    return {
        restrict:'EA',
        replace: true,
        scope: {
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
        },
        template: templates.selector,
        compile: function compile(tElement, tAttrs, transclude) {
            for (let template of Object.keys(templates)) {
                $templateCache.put(`selector/${template}.html`, templates[template]);
            }
            return {
                pre : function preLink($scope, iElement, iAttrs, controller) {
                },
                post: function postLink($scope, iElement, iAttrs, controller) {

                    // 初始化
                    $scope.init = () => {
                        // 默认配置初始化
                        for (let attr of Object.keys(defaults)) {
                            $scope[attr] = $scope[attr] || defaults[attr];
                        }
                        $scope.groupIndex = [];
                        // jqLite型的基本对象
                        $scope.$$selector = angular.element(iElement[0]);
                        $scope.$$dropdown = angular.element(iElement[0].getElementsByClassName('selector-dropdown'))[0];
                        // css
                        $scope.css.input = Object.assign({},
                            {
                                height: $scope.height || $scope.css.input.height,
                                width: $scope.width || $scope.css.input.width
                            },
                            $scope.inputStyle || {}
                        );
                        $scope.css.dropdown = {
                            maxHeight: $scope.optionHeight || $scope.css.dropdown.maxHeight,
                            width: $scope.optionWidth || $scope.css.dropdown.width
                        };
                        if ($scope.type === 'dropdown') {
                            $scope['disableSearch'] = true;
                        }
                        // 对attr的处理
                        ['disableSearch', 'disable', 'debounce', 'keep'].forEach(attr => {
                            if (iAttrs[attr]) {
                                $scope[attr] = $scope.$eval(iAttrs[attr]);
                            }
                        });
                    };

                    /**
                     * 自定义过滤函数
                     * @param {any} value 数据的值
                     * @param {string} target 输入框输入的值
                     */
                    $scope.filterFunc = (value, target) => {
                        // 数组选第一个元素
                        Array.isArray(value) && (value = value[0]);
                        // 对象选labelAttr
                        if ($scope.labelAttr) {
                            value = value[$scope.labelAttr];
                        }
                        if (value.includes) {
                            return value.includes(target);
                        }
                        return false;
                    };
                    /**
                     * 设置选项的label展示
                     * @param {any} option 选项参数
                     */
                    $scope.setOptionLabel = (option) => {
                        return $scope.getObjValue(option, $scope.labelAttr, true);
                    };

                    /**
                     * 设置选项组的展示
                     * @param {any} option 对象
                     */
                    $scope.setOptionGroup = (option, index) => {
                        return $scope.groupIndex.includes(index) ? $scope.getObjValue(option, $scope.groupAttr) : '';
                    };

                    /**
                     * 设置选项的select
                     * @param {any} option 选项参数
                     */
                    $scope.setOptionSelect = (option) => {
                        return $scope.getObjValue(option, $scope.valueAttr, true);
                    };

                    /**
                     * 设置选项的select
                     * @param {any} option 选项参数
                     */
                    $scope.setOptionInput = (option) => {
                        return $scope.getObjValue(option, $scope.inputAttr || $scope.labelAttr, true);
                    };

                    // 判断是否已选
                    $scope.hasValue = function () {
                        return !!$scope.value;
                    };

                    /**
                     * 获取对象属性值
                     * @param {any} target 对象
                     * @param {string} attr 属性名
                     * @param {boolean} hasDefault 是否将target作为默认值
                     */
                    $scope.getObjValue = function (target, attr, hasDefault) {
                        if (target && attr && target[attr]) {
                            return target[attr];
                        }
                        return hasDefault ? target : null;
                    };

                    /**
                     * 过滤符合要求的值
                     * @param {string} input 输入值
                     * @param {function} fn 过滤函数
                     */
                    $scope.filterValue = (input, fn) => {
                        if (!input) {
                            $scope.filteredOptions = [];
                            return;
                        }
                        if ($scope.disableSearch) {
                            $scope.filteredOptions = $scope.totalData || [];
                            return;
                        }
                        let type = typeof $scope.totalOptions; // $scope.totalOptions
                        let target;
                        if (Array.isArray($scope.totalOptions)) {
                            type = 'array';
                            target = $scope.totalOptions;
                        } else if (type === 'object') {
                            target = Object.entries($scope.totalOptions);
                        }

                        if (typeof $scope.totalOptions === 'string') {
                            type = 'string';
                            target = $scope.totalOptions.split('');
                        }
                        if (['undefined', 'null', 'symbol', 'boolean', 'number'].includes(type)) {
                            throw new Error('下拉选项必须为可迭代对象');
                        }
                        Array.isArray($scope.totalOptions) && ($scope.filteredOptions = target.filter( value => {
                            return typeof fn === 'function' && fn.call($scope.totalOptions, value, input);
                        }));
                        if ($scope.filteredOptions && $scope.filteredOptions.length !== 0) {
                            $scope.groupIndex = $scope.groupIndex || [];
                            // 分组
                            if ($scope.groupAttr) {
                                const groupBy = $scope.filteredOptions.reduce((obj, option) => {
                                    obj[option[$scope.groupAttr]] = obj[option[$scope.groupAttr]] || [];
                                    obj[option[$scope.groupAttr]].push(option);
                                    return obj;
                                }, {});
                                let preIndex = 0;
                                $scope.groupIndex = Object.keys(groupBy).reduce((index, opt) => {
                                    index.push(preIndex);
                                    preIndex += groupBy[opt].length;
                                    return index;
                                }, []);
                                $scope.filteredOptions = Object.values(groupBy).reduce((rt, opt) => {
                                    rt = rt.concat(opt);
                                    return rt;
                                }, []);
                            }
                            $scope.showOption = true;
                        }
                    };

                    // 上一个选项
                    $scope.decrementHighlighted = () => {
                        $scope.highlight($scope.highlighted - 1);
                        $scope.scrollToHighlighted();
                    };
                    // 下一个选项
                    $scope.incrementHighlighted = () => {
                        $scope.highlight($scope.highlighted + 1);
                        $scope.scrollToHighlighted();
                    };

                    // 将列标记
                    $scope.highlight = (index) => {
                        let length = $scope.filteredOptions ? $scope.filteredOptions.length : 0;
                        if (length) {
                            $scope.highlighted = (length + index) % length;
                        }
                        const last = angular.element($scope.$$dropdown.querySelectorAll('.highlight'));
                        last[0] && (last.removeClass('highlight'));
                        angular.element($scope.$$dropdown.querySelectorAll('li.selector-option')[$scope.highlighted]).addClass('highlight');
                    };

                    // 移动到高亮处
                    $scope.scrollToHighlighted = function () {
                        const dd = $scope.$$dropdown;
                        let index = $scope.highlighted;
                        const option = dd.querySelectorAll('li.selector-option')[index];
                        let styles = getStyles(option);
                        let marginTop = parseFloat(styles.marginTop || 0);
                        let marginBottom = parseFloat(styles.marginBottom || 0);
                        if (!$scope.filteredOptions || !$scope.filteredOptions.length || !option) {
                            return;
                        }
                        if (option.offsetTop + option.offsetHeight + marginBottom > dd.scrollTop + dd.offsetHeight){
                            $scope.$evalAsync(function () {
                                dd.scrollTop = option.offsetTop + option.offsetHeight + marginBottom - dd.offsetHeight;
                            });
                        }
                        if (option.offsetTop - marginTop < dd.scrollTop) {
                            $scope.$evalAsync(function () {
                                dd.scrollTop = option.offsetTop - marginTop;
                            });
                        }
                    };
                    // 聚焦
                    $scope.open = ($event) => {
                        $scope.hasSetted = false;
                        switch(+$scope.keep) {
                        // 清空
                        case 0:
                            $scope.searchValue = '';
                            break;
                        case 1:
                            $scope.searchValue = $scope.input;
                            break;
                        case 2:
                        default:
                        }
                        $scope.filterValue($scope.searchValue, $scope.filterFunc);
                        // 存在游标的可以模拟游标点击操作
                        $scope.type && $scope.type.includes('drop') && $scope.handleCursorClick($event);
                    };
                    // 失去焦点
                    $scope.close = ($event) => {
                        $scope.showOption = false;
                        // 保存input值
                        !$scope.hasSetted && ($scope.input = $scope.searchValue);
                    };

                    // ng-blur救不了我了，只有曲线救国
                    $scope.handleBlur = ($event) => {
                        const dom = $scope.$$selector[0];
                        // 包含dom元素
                        function containsDom(parent, dom) {
                            while (dom) {
                                if (dom === parent) {
                                    return true;
                                }
                                dom = dom.parentNode;
                            }
                            return false;
                        }
                        function onBlur(e) {
                            // e.relatedTarget for Chrome
                            // document.activeElement for IE 11
                            var targetElement = e.relatedTarget || document.activeElement;
                            if (!containsDom(dom, targetElement)) {
                                $timeout(function () {
                                    $scope.$apply($scope.close);
                                }, 10);
                            }
                        }
                        if (dom.addEventListener) {
                            dom.addEventListener('blur', onBlur, true);
                        } else {
                            dom.attachEvent('onfocusout', onBlur); // For IE8
                        }
                    };

                    // 游标点击
                    $scope.handleCursorClick = ($event) => {
                        $scope.showOption = !$scope.showOption;
                        // 展示
                        $scope.filteredOptions = ($scope.filteredOptions && $scope.filteredOptions.length && $scope.filteredOptions) || $scope.totalOptions || [];
                        $event.preventDefault();
                    };

                    // 输入框键盘事件
                    $scope.keydown = function ($event) {
                        switch ($event.keyCode) {
                        case KEYS.up:
                            $scope.decrementHighlighted();
                            $event.preventDefault();
                            break;
                        case KEYS.down:
                            $scope.incrementHighlighted();
                            $event.preventDefault();
                            break;
                        case KEYS.escape:
                            $scope.highlight(0);
                            break;
                        case KEYS.enter:
                            $scope.set();
                            $event.preventDefault();
                            break;
                        case KEYS.backspace:
                            break;
                        case KEYS.left:
                        case KEYS.right:
                        case KEYS.shift:
                        case KEYS.ctrl:
                        case KEYS.alt:
                        case KEYS.tab:
                        case KEYS.leftCmd:
                        case KEYS.rightCmd:
                            break;
                        default:
                        }
                    };

                    // 设置option为select
                    $scope.set = () => {
                        const target = $scope.filteredOptions[$scope.highlighted];
                        if (target) {
                            $scope.value = $scope.setOptionSelect(target);
                            $scope.input = $scope.setOptionInput(target);
                        } else {
                            $scope.input = $scope.value = $scope.searchValue;
                        }

                        const tmp = $scope.input;
                        $scope.hasSetted = true;
                        $scope.input = $scope.searchValue;
                        $scope.searchValue = tmp;

                        // disable
                        $scope.showOption = false;
                        // 下一个脏检测循环进行函数调用
                        typeof $scope.onSelect === 'function' && $timeout(() => {
                            $scope.onSelect({value: $scope.value});
                        });
                    };

                    // 内部变化函数
                    $scope.$onChange = () => {
                        $scope.bindAttr = $scope.searchValue;
                        $scope.filterValue($scope.searchValue, $scope.filterFunc);
                        typeof $scope.onChange === 'function' && $timeout(() => {
                            $scope.onChange({value: $scope.bindAttr});
                        });
                    };

                    // $scope.$watch('searchValue', (val, oldVal) => {
                    // });

                    // 监听全部选项
                    $scope.$watch('totalData', (val, oldVal) => {
                        if (typeof $scope.totalData === 'function') {
                            let rt = $scope.totalData();
                            // thenable
                            if (rt.then) {
                                rt.then(res => {
                                    $scope.totalOptions = res;
                                });
                                return;
                            }
                            $scope.totalOptions = rt;
                        }
                        $scope.totalOptions = $scope.totalData;
                    });

                    $scope.$watch('filteredOptions', (val, oldVal) => {
                        // dom更改之后才进行首选项高亮
                        $timeout(()=> {
                            $scope.highlight(0);
                        });
                    });

                    $scope.init();
                    $scope.handleBlur();
                }
            };
        }
    };
}];
