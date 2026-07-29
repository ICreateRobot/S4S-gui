/**
 * 使用 Zustand 创建的状态管理 store
 * 用于管理物联网可视化界面编辑器的各种状态和操作
 */
import { create } from 'zustand';

// 创建 Zustand store
const useStore = create((set, get) => ({

    // 组件相关状态
    components: [], // 存储所有组件的数组
    selectedComponent: { id: 'screen', type: 'screen', name: '屏幕' }, // 当前选中的组件
    showGrid: false, // 是否显示网格
    screenBackgroundColor: '#000000', // 屏幕背景颜色

    // 屏幕尺寸常量
    SCREEN_WIDTH: 320, // 屏幕宽度
    SCREEN_HEIGHT: 240, // 屏幕高度

    // 辅助线相关状态
    showGuides: true, // 是否显示辅助线
    guides: [], // 辅助线数组
    activeGuide: null, // 当前活动的辅助线
    guidePosition: null, // 辅助线位置
    allGuidesFixed: false, // 是否所有辅助线都已固定

    // 添加组件方法
    addComponent: (type, props = {}) => {
        const components = get().components;
        const SCREEN_WIDTH = get().SCREEN_WIDTH;
        const SCREEN_HEIGHT = get().SCREEN_HEIGHT;

        if (type === 'title') {
            const existingTitle = components.find(comp => comp.type === 'title');
            if (existingTitle) {
                //alert('只能添加一个 Title 组件');
                return existingTitle;
            }

            const titleComponent = {
                id: `title_${Date.now()}`,
                type,
                x: 0,
                y: 0,
                w: SCREEN_WIDTH,
                h: 30,
                name: 'title0',  // 标题固定为 title0
                isStatic: true,
                index: 0,
                ...getDefaultProps(type),
                ...props
            };

            set(state => ({
                components: [...state.components, titleComponent],
                selectedComponent: titleComponent
            }));

            get().notifyVM_AddUI(titleComponent);//vm通知添加组件
            get().updatePythonCode(); // 更新代码

            return titleComponent;
        }
        let newX = props.x !== undefined ? props.x : 20;
        let newY = props.y !== undefined ? props.y : 50;

        // 设置所有组件的默认大小
        const defaultSizes = {
            rectangle: { w: 40, h: 40 },
            label: { w: 80, h: 40 },
            text: { w: 80, h: 40 },
            button: { w: 80, h: 40 },
            switch: { w: 80, h: 40 },
            slider: { w: 100, h: 40 },
            circle: { w: 40, h: 40 }, // 直径40（半径20）
            triangle: { w: 40, h: 40 }, // 边长40
            image: { w: 70, h: 70 },
            line: { w: 100, h: 100 }
        };

        const defaultSize = defaultSizes[type] || { w: 80, h: 40 };
        let newW = props.w !== undefined ? props.w : defaultSize.w;
        let newH = props.h !== undefined ? props.h : defaultSize.h;
        if (type === 'line') {
            newW = 100;
            newH = 100;
            if (props.x1 === undefined || props.y1 === undefined ||
                props.x2 === undefined || props.y2 === undefined) {
                props.x1 = newX + newW;
                props.y1 = newY + newH / 2;
                props.x2 = newX;
                props.y2 = newY + newH / 2;
            }
        }

        // 如果未指定位置，自动寻找合适位置
        if (props.x === undefined || props.y === undefined) {
            if (components.length > 0) {
                const maxY = Math.max(...components.map(comp => comp.y + comp.h));
                newY = maxY + 20;
                if (newY + newH > SCREEN_HEIGHT - 20) {
                    newY = 50;
                    newX = components.length % 2 === 0 ? 20 : 240;
                }
            }
        }

        // 使用英文前缀
        const componentPrefixes = {
            label: 'label',
            rectangle: 'rect',
            circle: 'circle',
            line: 'line',
            triangle: 'triangle',
            image: 'image',
            text: 'text',
            button: 'button',
            switch: 'switch',
            slider: 'slider'
        };

        const prefix = componentPrefixes[type] || type;
        const sameTypeComponents = components.filter(comp => comp.type === type);
        const sameTypeCount = sameTypeComponents.length;

        // 直接使用 "prefix + 数字" 格式，如 label0, rect0, circle0 等
        const name = `${prefix}${sameTypeCount}`;  // 从0开始计数

        const maxIndex = components.length > 0
            ? Math.max(...components.map(comp => comp.index || 0))
            : 0;

        const newComponent = {
            id: `comp_${Date.now()}`,
            type,
            x: newX,
            y: newY,
            w: newW,
            h: newH,
            name: name,
            index: maxIndex + 1,
            ...getDefaultProps(type),
            ...props
        };

        set(state => ({
            components: [...state.components, newComponent],
            selectedComponent: newComponent
        }));

        get().notifyVM_AddUI(newComponent);//vm通知添加组件
        get().updatePythonCode(); // 更新代码

        return newComponent;
    },

    

    // 更新组件方法
    updateComponent: (id, updates) => {
        if (updates.name !== undefined) {
            get().notifyVM_UpdateUI(id,updates.name);//vm通知更新组件名称
        }

        console.log(updates);

        set(state => {
            const updatedComponents = state.components.map(comp => {
                if (comp.id === id) {
                    const newComp = { ...comp, ...updates };

                    // 如果是圆形组件并且更新了半径，需要同步更新宽高
                    if (newComp.type === 'circle' && updates.radius !== undefined) {
                        const diameter = Math.max(20, updates.radius * 2);
                        newComp.w = diameter;
                        newComp.h = diameter;
                    }

                    // 如果是圆形组件并且更新了宽高，需要同步更新半径
                    if (newComp.type === 'circle' && (updates.w !== undefined || updates.h !== undefined)) {
                        const side = Math.min(newComp.w || comp.w, newComp.h || comp.h);
                        newComp.w = side;
                        newComp.h = side;
                        newComp.radius = side / 2;
                    }

                    // 如果是直线组件，确保x1,y1,x2,y2存在
                    if (newComp.type === 'line') {
                        newComp.x1 = newComp.x1 !== undefined ? newComp.x1 : (comp.x1 || 100);
                        newComp.y1 = newComp.y1 !== undefined ? newComp.y1 : (comp.y1 || 100);
                        newComp.x2 = newComp.x2 !== undefined ? newComp.x2 : (comp.x2 || 0);
                        newComp.y2 = newComp.y2 !== undefined ? newComp.y2 : (comp.y2 || 0);
                    }

                    // 如果是三角形组件，确保有所有必需的属性
                    if (newComp.type === 'triangle') {
                        // 首先确保三角形有坐标属性（避免undefined）
                        newComp.point1X = newComp.point1X !== undefined ? newComp.point1X : comp.point1X || 50;
                        newComp.point1Y = newComp.point1Y !== undefined ? newComp.point1Y : comp.point1Y || 10;
                        newComp.point2X = newComp.point2X !== undefined ? newComp.point2X : comp.point2X || 90;
                        newComp.point2Y = newComp.point2Y !== undefined ? newComp.point2Y : comp.point2Y || 90;
                        newComp.point3X = newComp.point3X !== undefined ? newComp.point3X : comp.point3X || 10;
                        newComp.point3Y = newComp.point3Y !== undefined ? newComp.point3Y : comp.point3Y || 90;

                        // 确保有边长属性
                        newComp.sideLength = newComp.sideLength !== undefined ? newComp.sideLength : comp.sideLength || Math.min(comp.w || 80, comp.h || 80);

                        // 当修改边长时，同时更新宽高
                        if (updates.sideLength !== undefined) {
                            const side = Math.max(20, Math.min(300, updates.sideLength));
                            newComp.w = side;
                            newComp.h = side;
                            newComp.sideLength = side;
                        }
                        // 当修改宽高时，更新边长
                        else if (updates.w !== undefined || updates.h !== undefined) {
                            const side = Math.min(newComp.w || comp.w, newComp.h || comp.h);
                            newComp.w = side;
                            newComp.h = side;
                            newComp.sideLength = side;
                        }
                        // 确保三角形保持正方形
                        const side = Math.min(newComp.w || 80, newComp.h || 80);
                        newComp.w = side;
                        newComp.h = side;
                        newComp.sideLength = side;
                    }

                    return newComp;
                }
                return comp;
            });

            return {
                components: updatedComponents,
                selectedComponent: state.selectedComponent?.id === id
                    ? { ...state.selectedComponent, ...updates }
                    : state.selectedComponent
            };
        });

        get().updatePythonCode(); // 更新代码
    },

    // 删除组件方法
    deleteComponent: (id) => {
        console.log('Deleting component:', id);
        get().notifyVM_DeleteUI(id);//vm通知移除组件名称
        set(state => ({
            components: state.components.filter(comp => comp.id !== id),
            selectedComponent: state.selectedComponent?.id === id
                ? null
                : state.selectedComponent
        }));

        get().updatePythonCode(); // 更新代码
    },

    // 选择组件方法
    selectComponent: (id) => {
        if (id === 'screen') {
            set({
                selectedComponent: { id: 'screen', type: 'screen', name: '屏幕' }
            });
        } else {
            const component = get().components.find(comp => comp.id === id);
            set({ selectedComponent: component });
        }
    },

    // 清除所有组件方法
    clearComponents: () => {
        get().notifyVM_ClearUI(); // 通知 VM 全清
        set({
            components: [],
            selectedComponent: { id: 'screen', type: 'screen', name: '屏幕' }
        });

        set({ screenBackgroundColor: "#000000" });//初始化屏幕

        get().updatePythonCode(); // 更新代码
    },

    // 更新屏幕背景颜色方法
    updateScreenBackgroundColor: (color) => {
        set({ screenBackgroundColor: color });
        get().updatePythonCode(); // 更新代码
    },

    // 自动更新Python代码,模拟一次事件
    updatePythonCode: () => {
        //模拟一次事件，强制更新代码
        window.forceGenerateCode?.();
    },
    

    // 组件置顶功能
    bringToFront: (id) => {
        const components = get().components;
        const maxIndex = Math.max(...components.map(comp => comp.index || 0));

        set(state => {
            const updatedComponents = state.components.map(comp =>
                comp.id === id ? { ...comp, index: maxIndex + 1 } : comp
            );

            return {
                components: updatedComponents
            };
        });
    },

    // 组件左对齐功能
    alignComponentLeft: (id) => {
        const component = get().components.find(comp => comp.id === id);
        if (!component) return;

        if (component.type === 'title') return; // 标题组件不支持对齐

        if (component.type === 'line') {
            // 直线组件的左对齐：将整个直线向左移动，使最左边的点对齐到0
            const x1 = component.x1 || 0;
            const x2 = component.x2 || 0;
            const minX = Math.min(x1, x2);
            const offsetX = -minX; // 计算需要向左移动的距离

            // 更新直线的两个端点
            get().updateComponent(id, {
                x1: x1 + offsetX,
                x2: x2 + offsetX,
                x: Math.max(0, (component.x || 0) + offsetX) // 也更新包围盒的x坐标
            });
        } else {
            // 其他组件的左对齐（原有逻辑）
            get().updateComponent(id, { x: 0 });
        }
    },

    // 组件水平居中对齐功能
    alignComponentCenter: (id) => {
        const component = get().components.find(comp => comp.id === id);
        const SCREEN_WIDTH = get().SCREEN_WIDTH;
        if (!component) return;

        if (component.type === 'title') return;

        if (component.type === 'line') {
            // 直线组件的水平居中：让整个直线的中心点对齐屏幕水平中心
            const x1 = component.x1 || 0;
            const x2 = component.x2 || 0;
            const minX = Math.min(x1, x2);
            const maxX = Math.max(x1, x2);
            const lineCenterX = (minX + maxX) / 2;
            const targetCenterX = SCREEN_WIDTH / 2;
            const offsetX = targetCenterX - lineCenterX;

            get().updateComponent(id, {
                x1: x1 + offsetX,
                x2: x2 + offsetX,
                x: Math.max(0, (component.x || 0) + offsetX)
            });
        } else {
            // 其他组件的水平居中（原有逻辑）
            const centerX = Math.round((SCREEN_WIDTH - component.w) / 2);
            get().updateComponent(id, { x: Math.max(0, centerX) });
        }
    },

    // 组件右对齐功能
    alignComponentRight: (id) => {
        const component = get().components.find(comp => comp.id === id);
        const SCREEN_WIDTH = get().SCREEN_WIDTH;
        if (!component) return;

        if (component.type === 'title') return;

        if (component.type === 'line') {
            // 直线组件的右对齐：将整个直线向右移动，使最右边的点对齐到屏幕宽度
            const x1 = component.x1 || 0;
            const x2 = component.x2 || 0;
            const maxX = Math.max(x1, x2);
            const offsetX = SCREEN_WIDTH - maxX;

            get().updateComponent(id, {
                x1: x1 + offsetX,
                x2: x2 + offsetX,
                x: Math.max(0, (component.x || 0) + offsetX)
            });
        } else {
            // 其他组件的右对齐（原有逻辑）
            const rightX = SCREEN_WIDTH - component.w;
            get().updateComponent(id, { x: Math.max(0, rightX) });
        }
    },

    // 组件顶部对齐功能
    alignComponentTop: (id) => {
        const component = get().components.find(comp => comp.id === id);
        if (!component) return;

        if (component.type === 'title') return;

        if (component.type === 'line') {
            // 直线组件的上对齐：将整个直线向上移动，使最上边的点对齐到0
            const y1 = component.y1 || 0;
            const y2 = component.y2 || 0;
            const minY = Math.min(y1, y2);
            const offsetY = -minY;

            get().updateComponent(id, {
                y1: y1 + offsetY,
                y2: y2 + offsetY,
                y: Math.max(0, (component.y || 0) + offsetY)
            });
        } else {
            // 其他组件的上对齐（原有逻辑）
            get().updateComponent(id, { y: 0 });
        }
    },

    // 组件垂直居中对齐功能
    alignComponentMiddle: (id) => {
        const component = get().components.find(comp => comp.id === id);
        const SCREEN_HEIGHT = get().SCREEN_HEIGHT;
        if (!component) return;

        if (component.type === 'title') return;

        if (component.type === 'line') {
            // 直线组件的垂直居中：让整个直线的中心点对齐屏幕垂直中心
            const y1 = component.y1 || 0;
            const y2 = component.y2 || 0;
            const minY = Math.min(y1, y2);
            const maxY = Math.max(y1, y2);
            const lineCenterY = (minY + maxY) / 2;
            const targetCenterY = SCREEN_HEIGHT / 2;
            const offsetY = targetCenterY - lineCenterY;

            get().updateComponent(id, {
                y1: y1 + offsetY,
                y2: y2 + offsetY,
                y: Math.max(0, (component.y || 0) + offsetY)
            });
        } else {
            // 其他组件的垂直居中（原有逻辑）
            const componentHeight = Math.min(component.h, SCREEN_HEIGHT);
            const middleY = Math.max(0, Math.round((SCREEN_HEIGHT - componentHeight) / 2));
            get().updateComponent(id, { y: middleY });
        }
    },

    // 组件底部对齐功能
    alignComponentBottom: (id) => {
        const component = get().components.find(comp => comp.id === id);
        const SCREEN_HEIGHT = get().SCREEN_HEIGHT;
        if (!component) return;

        if (component.type === 'title') return;

        if (component.type === 'line') {
            // 直线组件的下对齐：将整个直线向下移动，使最下边的点对齐到屏幕高度
            const y1 = component.y1 || 0;
            const y2 = component.y2 || 0;
            const maxY = Math.max(y1, y2);
            const offsetY = SCREEN_HEIGHT - maxY;

            get().updateComponent(id, {
                y1: y1 + offsetY,
                y2: y2 + offsetY,
                y: Math.max(0, (component.y || 0) + offsetY)
            });
        } else {
            // 其他组件的下对齐（原有逻辑）
            const componentHeight = Math.min(component.h, SCREEN_HEIGHT);
            const bottomY = Math.max(0, SCREEN_HEIGHT - componentHeight);
            get().updateComponent(id, { y: bottomY });
        }
    },

    // 辅助线相关方法
    toggleGuides: () => {  // 切换辅助线显示/隐藏
        set(state => ({ showGuides: !state.showGuides }));
    },

    // 添加新的辅助线
    addGuide: (type) => {
        const SCREEN_WIDTH = get().SCREEN_WIDTH;  // 获取屏幕宽度
        const SCREEN_HEIGHT = get().SCREEN_HEIGHT;  // 获取屏幕高度

        // 创建新辅助线对象
        const newGuide = {
            id: `guide_${Date.now()}`,  // 使用时间戳生成唯一ID
            type,  // 辅助线类型
            position: type === 'vertical' ? SCREEN_WIDTH / 2 : SCREEN_HEIGHT / 2,  // 默认位置在屏幕中间
            fixed: false  // 是否固定
        };

        // 更新状态，添加新辅助线并设置为活动状态
        set(state => ({
            guides: [...state.guides, newGuide],  // 添加新辅助线
            activeGuide: newGuide.id,  // 设置为新添加的辅助线为活动状态
            guidePosition: {  // 更新辅助线位置信息
                x: type === 'vertical' ? newGuide.position : null,
                y: type === 'horizontal' ? newGuide.position : null
            }
        }));
    },

    // 移除指定ID的辅助线
    removeGuide: (id) => {
        set(state => ({
            guides: state.guides.filter(guide => guide.id !== id),  // 过滤掉指定ID的辅助线
            activeGuide: state.activeGuide === id ? null : state.activeGuide,  // 如果移除的是活动辅助线，清空活动状态
            guidePosition: state.activeGuide === id ? null : state.guidePosition  // 如果移除的是活动辅助线，清空位置信息
        }));
    },

    // 移除所有辅助线
    removeAllGuides: () => {
        set({
            guides: [],  // 清空辅助线数组
            allGuidesFixed: false,  // 重置所有辅助线固定状态
            activeGuide: null,  // 清空活动辅助线
            guidePosition: null  // 清空辅助线位置信息
        });
    },

    // 更新指定辅助线的位置
    updateGuidePosition: (id, position) => {
        const guide = get().guides.find(g => g.id === id);  // 查找指定ID的辅助线
        // 如果辅助线不存在或所有辅助线已固定/当前辅助线已固定，则不更新
        if (guide && (get().allGuidesFixed || guide.fixed)) return;

        const SCREEN_WIDTH = get().SCREEN_WIDTH;  // 获取屏幕宽度
        const SCREEN_HEIGHT = get().SCREEN_HEIGHT;  // 获取屏幕高度

        // 根据辅助线类型限制位置范围
        let clampedPosition = position;
        if (guide.type === 'vertical') {
            clampedPosition = Math.max(0, Math.min(SCREEN_WIDTH, position));  // 限制在屏幕宽度范围内
        } else {
            clampedPosition = Math.max(0, Math.min(SCREEN_HEIGHT, position));  // 限制在屏幕高度范围内
        }

        set(state => {
            // 更新辅助线位置
            const updatedGuides = state.guides.map(guide =>
                guide.id === id ? { ...guide, position: clampedPosition } : guide
            );

            // 如果当前移动的是活动辅助线，更新 guidePosition
            let newGuidePosition = state.guidePosition;
            if (state.activeGuide === id) {
                newGuidePosition = guide.type === 'vertical'
                    ? { x: clampedPosition, y: state.guidePosition?.y || null }
                    : { x: state.guidePosition?.x || null, y: clampedPosition };
            }

            return {
                guides: updatedGuides,
                guidePosition: newGuidePosition
            };
        });
    },

    // 切换所有辅助线的固定状态
    toggleFixAllGuides: () => {
        set(state => {
            // 创建新的固定状态，取反当前状态
            const newFixedState = !state.allGuidesFixed;
            // 更新所有辅助线的固定状态
            const updatedGuides = state.guides.map(guide => ({
                ...guide,
                fixed: newFixedState
            }));

            let newActiveGuide = state.activeGuide;
            let newGuidePosition = state.guidePosition;
            // 如果设置为固定状态且当前有激活的辅助线，则清除激活状态
            if (newFixedState && state.activeGuide) {
                newActiveGuide = null;
                newGuidePosition = null;
            }

            // 返回更新后的状态
            return {
                guides: updatedGuides,
                allGuidesFixed: newFixedState,
                activeGuide: newActiveGuide,
                guidePosition: newGuidePosition
            };
        });
    },

    // 切换单个辅助线的固定状态
    toggleFixGuide: (id) => {
        set(state => {
            // 更新指定ID的引导线的固定状态
            const updatedGuides = state.guides.map(guide =>
                guide.id === id ? { ...guide, fixed: !guide.fixed } : guide
            );

            let newActiveGuide = state.activeGuide;
            let newGuidePosition = state.guidePosition;
            // 如果切换的是当前激活的辅助线，则清除激活状态
            if (id === state.activeGuide) {
                newActiveGuide = null;
                newGuidePosition = null;
            }

            // 检查是否所有辅助线都已固定
            const allFixed = updatedGuides.length > 0 && updatedGuides.every(guide => guide.fixed);

            // 返回更新后的状态
            return {
                guides: updatedGuides,
                allGuidesFixed: allFixed,
                activeGuide: newActiveGuide,
                guidePosition: newGuidePosition
            };
        });
    },

    // 设置激活辅助线
    setActiveGuide: (id) => {
        const guide = get().guides.find(g => g.id === id);
        // 如果辅助线存在且已被固定，或者所有辅助线都已固定，则返回
        if (guide && (get().allGuidesFixed || guide.fixed)) return;

        set({
            activeGuide: id,
            // 根据辅助线类型设置位置
            guidePosition: guide ? {
                x: guide.type === 'vertical' ? guide.position : null,
                y: guide.type === 'horizontal' ? guide.position : null
            } : null
        });
    },

    // 清除辅助线
    clearActiveGuide: () => {
        set({
            activeGuide: null,
            guidePosition: null
        });
    },

    // 切换网格显示状态
    toggleGrid: () => {
        set(state => ({ showGrid: !state.showGrid }));
    },

    // 获取用于保存的状态
    getStateForSave: () => {
        const state = get();
        const projectData = {
            components: state.components,
            screenBackgroundColor: state.screenBackgroundColor,
            showGrid: state.showGrid,
            showGuides: state.showGuides,
            guides: state.guides,
            allGuidesFixed: state.allGuidesFixed,
        };
        const dataStr = JSON.stringify(projectData, null, 2);
        // const dataBlob = new Blob([dataStr], { type: 'application/json' });

        return dataStr
    },

    // 加载保存的状态
    loadSavedState: async (savedState) => {
        try {
            get().clearComponents()
            await new Promise(resolve => setTimeout(resolve, 100));
            // 设置新的状态
            set({
                components: Array.isArray(savedState.components) ? savedState.components : [],
                screenBackgroundColor: savedState.screenBackgroundColor || '#000000',
                showGrid: savedState.showGrid !== undefined ? savedState.showGrid : true,
                showGuides: savedState.showGuides !== undefined ? savedState.showGuides : false,
                guides: Array.isArray(savedState.guides) ? savedState.guides : [],
                allGuidesFixed: savedState.allGuidesFixed !== undefined ? savedState.allGuidesFixed : false,
                selectedComponent: { id: 'screen', type: 'screen', name: '屏幕' },
                activeGuide: null,
                guidePosition: null
            });

            console.log('状态加载成功:', savedState);
            // get().notifyVM_ClearUI()
            
            
            for(let i=0; i<savedState.components.length;i++){
                get().notifyVM_AddUI(savedState.components[i]);//vm通知添加组件
            }
            
            get().updatePythonCode(); // 更新代码
        } catch (error) {
            get().clearComponents()
            console.error('加载状态时出错:', error);
            alert('加载文件时发生错误，请查看控制台获取详细信息。');
        }
    },

    // 代码生成功能 - 直接返回生成的Python代码
    generatePythonCode: () => {
        const state = get();
        const components = state.components;
        const bgColor = state.screenBackgroundColor;
        const screenWidth = state.SCREEN_WIDTH;
        const screenHeight = state.SCREEN_HEIGHT;

        // 转换颜色格式：从 "#RRGGBB" 到 "0xRRGGBB"
        const convertColor = (color) => {
            if (!color) return '0x000000';
            if (color.startsWith('#')) {
                return `0x${color.slice(1)}`;
            }
            return color;
        };

        // 转换屏幕背景颜色
        const screenBgColor = convertColor(bgColor);

        // 导入语句和类定义
        let code = `bk = Background(${screenBgColor})\n`;

        // 为每个组件生成一行代码
        components.forEach((component, index) => {
            code += `${component.name || component.type} = ${getComponentPythonCode(component)}\n`;
        });

        return code;
    },

    // 通知 VM 添加组件
    notifyVM_AddUI: (component) => { 
        if (window.vm.extensionManager) {
            const ext = window.vm.extensionManager._loadedExtensions.get('UIEditor');
            if (ext) {
                window.vm.runtime.emit('UI_ADD_COMPONENT', {
                    type: component.type,
                    id: component.id,
                    name: component.name
                });
            }
        }
    },
    // 通知 VM 更新组件名称
    notifyVM_UpdateUI: (id,data) => {
        if (window.vm.extensionManager) {
            const ext = window.vm.extensionManager._loadedExtensions.get('UIEditor');
            if (ext) {
                window.vm.runtime.emit('UI_UPDATE_COMPONENT', {
                    id: id,
                    name: data
                });
            }
        }
    },
    // 通知 VM 删除组件
    notifyVM_DeleteUI: (id) => {
        if (window.vm.extensionManager) {
            const ext = window.vm.extensionManager._loadedExtensions.get('UIEditor');
            if (ext) {
                window.vm.runtime.emit('UI_DELETE_COMPONENT', {
                    id: id
                });
            }
        }
    },
    // 通知 VM 清除所有组件
    notifyVM_ClearUI() {
       if (window.vm.extensionManager) {
            const ext = window.vm.extensionManager._loadedExtensions.get('UIEditor');
            if (ext) {
                window.vm.runtime.emit('UI_CLEAR_ALL');
            }
        }
    }
}));

// 为每个组件生成Python代码的辅助函数
function getComponentPythonCode(component) {
    const x = component.x || 0;
    const y = component.y || 0;
    const width = component.w || 100;
    const height = component.h || 50;
    const index = component.index || 0;

    // 转换颜色格式：从 "#RRGGBB" 到 "0xRRGGBB"
    const convertColor = (color) => {
        if (!color || color === 'transparent') return '0x000000';
        if (color.startsWith('#')) {
            return `0x${color.slice(1)}`;
        }
        return color;
    };

    // 转换布尔值：首字母大写
    const convertBool = (value) => {
        return value ? 'True' : 'False';
    };

    // 处理透明状态
    const isTransparent = (propName) => {
        const transparentProp = component[`${propName}Transparent`];
        return transparentProp !== undefined ? transparentProp : false;
    };

    // 获取颜色值或透明状态
    const getColorValue = (colorProp, transparentProp) => {
        const color = component[colorProp];
        const isTransparent = component[transparentProp];
        if (isTransparent) {
            return 'transparent';
        }
        return color || '#000000';
    };

    switch (component.type) {
        case 'title':
            const titleText = component.text || '标题';
            const titleSize = component.fontSize || 18;
            const titleTextColor = getColorValue('color', 'colorTransparent');
            const titleBgColor = getColorValue('backgroundColor', 'backgroundColorTransparent');

            // return `Screen.Title(${index}, ${convertColor(titleBgColor)}, ${convertBool(isTransparent('backgroundColor'))}, ${convertColor(titleTextColor)}, ${convertBool(isTransparent('color'))}, "${titleText}", ${titleSize})`;
            return `Title(index=${index},bkg_color=${convertColor(titleBgColor)},text_color=${convertColor(titleTextColor)},text="${titleText}",text_size=${titleSize})`
        case 'label':
            const labelText = component.text || '标签';
            const labelSize = component.fontSize || 12;
            const labelTextColor = getColorValue('color', 'colorTransparent');
            const labelBgColor = getColorValue('backgroundColor', 'backgroundColorTransparent');

            // return `Screen.Label(${x}, ${y}, ${width}, ${height}, ${index}, ${convertColor(labelBgColor)}, ${convertBool(isTransparent('backgroundColor'))}, ${convertColor(labelTextColor)}, ${convertBool(isTransparent('color'))}, "${labelText}", ${labelSize})`;
            return `Label(x=${x}, y=${y}, w=${width}, h=${height}, index=${index}, bkg_color=${convertColor(labelBgColor)}, text_color=${convertColor(labelTextColor)},text="${labelText}", text_size=${labelSize})`
        case 'rectangle':
            const rectBgColor = getColorValue('backgroundColor', 'backgroundColorTransparent');
            const rectBorderColor = getColorValue('borderColor', 'borderColorTransparent');
            const borderWidth = 2; // 默认边框宽度

            // return `Screen.Rectangle(${x}, ${y}, ${width}, ${height}, ${index}, ${convertColor(rectBgColor)}, ${convertBool(isTransparent('backgroundColor'))}, ${borderWidth}, ${convertColor(rectBorderColor)}, ${convertBool(isTransparent('borderColor'))})`;
            return `Rectangle(x=${x}, y=${y}, w=${width}, h=${height}, index=${index},bkg_color=${convertColor(rectBgColor)},border_width=${borderWidth}, border_color=${convertColor(rectBorderColor)})`
        case 'circle':
            const radius = Math.min(width, height) / 2;
            const circleBgColor = getColorValue('backgroundColor', 'backgroundColorTransparent');
            const circleBorderColor = getColorValue('borderColor', 'borderColorTransparent');
            const circleBorderWidth = 2; // 默认边框宽度

            // return `Screen.Circle(${x}, ${y}, ${radius}, ${index}, ${convertColor(circleBgColor)}, ${convertBool(isTransparent('backgroundColor'))}, ${circleBorderWidth}, ${convertColor(circleBorderColor)}, ${convertBool(isTransparent('borderColor'))})`;
            return `Circle(x=${x}, y=${y}, r=${radius}, index=${index}, bkg_color=${convertColor(circleBgColor)},  border_width=${circleBorderWidth}, border_color=${convertColor(circleBorderColor)})`
        case 'line':
            const x1 = component.x1 || 0;
            const y1 = component.y1 || 0;
            const x2 = component.x2 || 100;
            const y2 = component.y2 || 0;
            const strokeWidth = component.strokeWidth || 2;
            const lineColor = getColorValue('strokeColor', 'strokeColorTransparent');

            // return `Screen.Line(${x2}, ${y2}, ${x1}, ${y1}, ${strokeWidth}, ${convertColor(lineColor)}, ${index})`;
            return `Line(x1=${x1}, y1=${y1}, x2=${x2}, y2=${y2}, width=${strokeWidth}, color=${convertColor(lineColor)}, index=${index})`
        case 'triangle':
            const point1X = component.point1X || 50;
            const point1Y = component.point1Y || 10;
            const point2X = component.point2X || 90;
            const point2Y = component.point2Y || 90;
            const point3X = component.point3X || 10;
            const point3Y = component.point3Y || 90;
            const triFillColor = getColorValue('fillColor', 'fillColorTransparent') ||
                getColorValue('backgroundColor', 'backgroundColorTransparent');
            const triBorderColor = getColorValue('borderColor', 'borderColorTransparent');
            const triBorderWidth = component.borderWidth || 2;

            return `Screen.Triangle(${x}, ${y}, ${width}, ${height}, ${index}, ${point1X}, ${point1Y}, ${point2X}, ${point2Y}, ${point3X}, ${point3Y}, ${convertColor(triFillColor)}, ${convertBool(isTransparent('fillColor'))}, ${triBorderWidth}, ${convertColor(triBorderColor)}, ${convertBool(isTransparent('borderColor'))})`;

        case 'text':
            const textText = component.text || '文本';
            const textSize = component.fontSize || 12;
            const textTextColor = getColorValue('color', 'colorTransparent');
            const textBgColor = getColorValue('backgroundColor', 'backgroundColorTransparent');

            return `Screen.Text(${x}, ${y}, ${width}, ${height}, ${index}, ${convertColor(textBgColor)}, ${convertBool(isTransparent('backgroundColor'))}, ${convertColor(textTextColor)}, ${convertBool(isTransparent('color'))}, "${textText}", ${textSize})`;

        case 'button':
            const buttonText = component.text || '按钮';
            const buttonSize = component.fontSize || 14;
            const buttonTextColor = getColorValue('color', 'colorTransparent');
            const buttonBgColor = getColorValue('backgroundColor', 'backgroundColorTransparent');

            // return `Screen.Button(${x}, ${y}, ${width}, ${height}, ${index}, ${convertColor(buttonBgColor)}, ${convertBool(isTransparent('backgroundColor'))}, ${convertColor(buttonTextColor)}, ${convertBool(isTransparent('color'))}, "${buttonText}", ${buttonSize})`;
            return `Button(x=${x}, y=${y}, w=${width}, h=${height}, index=${index},bkg_color=${convertColor(buttonBgColor)},text_color=${convertColor(buttonTextColor)},text="${buttonText}",text_size=${buttonSize})`
        case 'switch':
            const switchText = component.text || '开关';
            const switchBgColor = getColorValue('backgroundColor', 'backgroundColorTransparent');
            const switchOnColor = getColorValue('onColor', 'onColorTransparent');
            const switchValue = component.value || false;

            // return `Screen.Switch(${x}, ${y}, ${width}, ${height}, ${index}, ${convertColor(switchBgColor)}, ${convertBool(isTransparent('backgroundColor'))}, ${convertColor(switchOnColor)}, ${convertBool(isTransparent('onColor'))}, "${switchText}", ${convertBool(switchValue)})`;
            return `Switch(x=${x},y=${y},w=${width},h=${height},index=${index},bg_c=${convertColor(switchBgColor)},bg_c_checked=${convertColor(switchOnColor)})`
        case 'slider':
            const sliderMin = component.min || 0;
            const sliderMax = component.max || 100;
            const sliderValue = component.value || 50;
            const sliderFillColor = getColorValue('fillColor', 'fillColorTransparent');

            // return `Screen.Slider(${x}, ${y}, ${width}, ${height}, ${index}, ${sliderMin}, ${sliderMax}, ${sliderValue}, ${convertColor(sliderFillColor)}, ${convertBool(isTransparent('fillColor'))})`;
            return `Slider(x=${x}, y=${y},w=${width},h=${height},index= ${index},min_value=${sliderMin}, max_value=${sliderMax}, value=${sliderValue},color=${convertColor(sliderFillColor)})`
        case 'image':
            const imageSrc = component.src;
            // return `Screen.Image(${x}, ${y}, ${width}, ${height}, ${index}, "${imageSrc}")`;
            if(imageSrc){
                return ` Image(img_src="${imageSrc}", x=${x}, y=${y}, index=${index})`
            }else{
                return ` Image(x=${x}, y=${y}, index=${index})`
            }
            

        default:
            return `# ${component.type}组件 - 未实现`;
    }
}

//默认值
const getDefaultProps = (type) => {
    const defaults = {
        title: {
            text: 'title',
            fontSize: 18,
            color: '#000000',
            backgroundColor: '#ffffff',
            colorTransparent: false,
            backgroundColorTransparent: false,
            fontWeight: 'bold',
            textAlign: 'center',
            index: 0
        },
        label: {
            text: 'label',
            fontSize: 12,
            color: '#000000',
            backgroundColor: '#ffffff',
            colorTransparent: false,
            backgroundColorTransparent: false,
            fontWeight: 'normal',
            index: 0
        },
        rectangle: {
            backgroundColor: '#fcc507',
            borderColor: '#ef8c26',
            backgroundColorTransparent: false,
            borderColorTransparent: false,
            index: 0
        },
        circle: {
            radius: 20,
            backgroundColor: '#d607fc',
            borderColor: '#990fc5',
            backgroundColorTransparent: false,
            borderColorTransparent: false,
            index: 0,
            w: 40,
            h: 40
        },
        line: {
            x1: 100,
            y1: 100,
            x2: 0,
            y2: 0,
            strokeColor: '#ffffff',
            strokeWidth: 2,
            strokeColorTransparent: false,
            index: 0,
            w: 100,
            h: 100
        },
        triangle: {
            sideLength: 80,
            point1X: 50,
            point1Y: 10,
            point2X: 90,
            point2Y: 90,
            point3X: 10,
            point3Y: 90,
            fillColor: '#9b59b6',
            borderColor: '#8e44ad',
            borderWidth: 0,
            backgroundColor: '#9b59b6',
            backgroundColorTransparent: false,
            borderColorTransparent: false,
            index: 0,
            w: 80,
            h: 80
        },
        image: {
            src: '',
            index: 0
        },
        text: {
            text: 'text',
            fontSize: 12,
            color: '#ffffff',
            backgroundColor: '#000000',
            colorTransparent: false,
            backgroundColorTransparent: false,
            fontWeight: 'normal',
            index: 0
        },
        button: {
            text: 'button',
            fontSize: 12,
            color: '#ffffff',
            backgroundColor: '#27ae60',
            colorTransparent: false,
            backgroundColorTransparent: false,
            pressed: false,
            index: 0
        },
        switch: {
            text: 'switch',
            fontSize: 12,
            color: '#ffffff',
            backgroundColor: '#95a5a6',
            onColor: '#27ae60',
            colorTransparent: false,
            backgroundColorTransparent: false,
            onColorTransparent: false,
            value: false,
            index: 0
        },
        slider: {
            min: 0,
            max: 100,
            value: 50,
            fillColor: '#ff0000',
            fillColorTransparent: false,
            index: 0
        }
    };

    return defaults[type] || {};
};

export default useStore;

window.UIStore = useStore;
