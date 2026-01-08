import codeModule from '../../../../../utils/global.js';

import { getDeletedCate,setDeletedCate,delCategro,getHiddenBlocks,setHiddenBlocks,delHiddenBlocks,getShowCodeDb,getAllLoaded,getLoadExtension} from 'scratch-gui/src/components/utils/utils.js';
import {injectExtensionBlockTheme, injectExtensionCategoryTheme} from '../../lib/themes/blockHelpers';
import makeToolboxXML from '../../lib/make-toolbox-xml';

// ================== 核心逻辑 ==================
export function createBlocksLogic(componentInstance,modeValue,deviceType) {
    const self = componentInstance

    let downEnableCategories=['control','operators','variables','myBlocks','robot','bricks','Microbit']
    let isChangeMode = false;//记录切换模式


    const channelLoadExtension = new BroadcastChannel('loadExtension')
    channelLoadExtension.addEventListener('message',async (event)=>{
        console.log(event.data)

        if(event.data.op=='remove'){
            await removeCategoryFromToolbox([
                event.data.id
            ]);
            self.onWorkspaceUpdate(self.dataXML)
            self.workspace.clear()
        }else{
            await restoreCategoriesToToolbox([
                event.data.id
            ]);
            self.onWorkspaceUpdate(self.dataXML)
            self.workspace.clear()
        }
            
    })

    



    

    //显示扩展（没有用）
    const channel = new BroadcastChannel('extensionSecondly');
    channel.addEventListener('message', async (event) => {
        const categories = event.data;//需要添加的模块

        await restoreCategoriesToToolbox(categories)
        //self.onWorkspaceUpdate(self.dataXML);
        self.workspace.clear();

        return
    })

    //隐藏扩展（暂时用）
    const channelMasterClose = new BroadcastChannel('master_close');
    channelMasterClose.addEventListener('message',async (event)=>{
        self.props.vm.emit('workspaceUpdate');

        // await removeCategoryFromToolbox(event.data)
        // self.onWorkspaceUpdate(self.dataXML);
        //self.workspace.clear();
    })




    //格式处理（没细看）
    function unindentCode(code) {
        // 将代码按行分割
        let lines = code.split('\n');
        
        // 使用map遍历每一行，先取消四个空格缩进，再检查并取消恰好两个空格的缩进
        const unindentedLines = lines.map(line => {
            // 记录原始行
            let originalLine = line;
            
            // 尝试取消四个空格的缩进
            let newLine = line.replace(/^\s{4}/, '');
            
            // 如果四个空格缩进已经被取消，检查是否有恰好两个空格的缩进
            if (newLine !== originalLine) {
            // 只有在四个空格缩进被取消后，才检查恰好两个空格的缩进
            newLine = newLine.replace(/^\s{2}(?! )/, '');
            }
            
            return newLine;
        });
    
        // 将处理后的行重新组合成一个字符串
        return unindentedLines.join('\n');
    }

    //格式处理（没细看）
    function indentPythonFunctions(code) {
        const lines = code.split('\n');
        let result = [];
        let inFunction = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
        
            if (line.trim().startsWith('def ')) {
            // 函数定义行
            inFunction = true;
            result.push(line); // 原样添加
            continue;
            }
        
            // 空行代表函数体结束
            if (line.trim() === '') {
            inFunction = false;
            result.push(line);
            continue;
            }
        
            // 缩进函数体（不在 def 行且处于函数中）
            if (inFunction) {
            result.push('    ' + line);
            } else {
            result.push(line);
            }
        }
        
        return result.join('\n');
    }
    






    function arraysAreEqual(arr1, arr2) {
        // 如果数组长度不同，直接返回 false
        if (arr1.length !== arr2.length) {
            return false;
        }

        // 比较每个元素
        for (let i = 0; i < arr1.length; i++) {
            if (arr1[i] !== arr2[i]) {
                return false;
            }
        }

        // 如果所有检查都通过，返回 true
        return true;
    }
    function findSecondTopParent(block) {
        let parentBlock = block.getParent();
        let secondTopParent = null;
        
        if (!parentBlock) {
            return false; // No parent block found
        }
        if(parentBlock.type == 'control_forever'){
            return true
        }
        
        while (parentBlock.getParent()) {
            secondTopParent = parentBlock;
            parentBlock = parentBlock.getParent();
            if(parentBlock.type == 'control_forever'){
            return true
            }
        }
        
        return false;
    }

    //大大的有用（事件检测，生成代码相关）
    function workspaceToCode (event) {
        console.log(event.type)
        if(event.type == 'endDrag' || event.type == 'change'){//拖拽结束或内容变化
            let code;
            try {
                // const generatorName = getLan();
                // console.log('language',generatorName)
                let generatorName = "Python";//默认python
                console.log(deviceType)
                if(deviceType == "Microbit"){//根据设备判断语言
                    generatorName = "Python";
                }else{//否则不显示代码
                    //return
                }
                code = self.ScratchBlocks[generatorName].workspaceToCode(self.workspace);
                console.log(code)
                
                codeModule.setCode(indentPythonFunctions(unindentCode(code)))
            } catch (e) {
                code = e.message;
            }
            return code;
        }
        return ''
        
    }

    //移除扩展（外观移除）
    async function removeCategoryFromToolbox(categoriesToRemove) {
        console.log('执行了移除函数')
        try {
            const toolboxXML = getToolboxXML();
            const toolboxDom = self.ScratchBlocks.Xml.textToDom(toolboxXML);

            const categories = toolboxDom.getElementsByTagName('category');
            
            // Collect categories to remove
            for (let category of categories) {
                if (categoriesToRemove.includes(category.getAttribute('id'))) {
                    setDeletedCate(category);
                    setDeletedCate(category.getAttribute('id'))
                }
            }

        } catch (error) {
            console.error('Error removing categories from toolbox', error);
        }
    }

    async function restoreCategoriesToToolbox(categoriesToRestore) {
        console.log('执行了恢复函数')
        try {
            
    
            // this.deletedCategoriesID = this.deletedCategoriesID.filter(item => !categoriesToRestore.includes(item));
            // this.deletedCategories = this.deletedCategories.filter(item => !categoriesToRestore.includes(item.id));

            // console.log('head:'+this.deletedCategoriesID)
            for (let i = getDeletedCate().length - 1; i >= 0; i--) {
                if (categoriesToRestore.includes(getDeletedCate()[i])) {
                    // console.log('删除了'+this.deletedCategoriesID[i])
                    delCategro(i, 1);
                }
                // setDelete(this.deletedCategoriesID)
            }

    
        } catch (error) {
            console.error('Error restoring categories to toolbox', error);
        }
    }

    function getToolboxXML () {
        // Use try/catch because this requires digging pretty deep into the VM
        // Code inside intentionally ignores several error situations (no stage, etc.)
        // Because they would get caught by this try/catch
        try {
            let {editingTarget: target, runtime} = self.props.vm;
            const stage = runtime.getTargetForStage();
            if (!target) target = stage; // If no editingTarget, use the stage

            const stageCostumes = stage.getCostumes();
            const targetCostumes = target.getCostumes();
            const targetSounds = target.getSounds();
            let dynamicBlocksXML = injectExtensionCategoryTheme(
                self.props.vm.runtime.getBlocksXML(target),
                self.props.theme
            );
            try{
                console.log(getDeletedCate())
                dynamicBlocksXML = dynamicBlocksXML.filter(category => {
                    // console.log(category.id)
                    return !getDeletedCate().includes(category.id); // 保留未删除的类别
                });

                // 过滤掉需要隐藏的块类型
                dynamicBlocksXML = dynamicBlocksXML.map(category => {
                    // 解析 category.xml 为 DOM 对象
                    const parser = new DOMParser();
                    const categoryDom = parser.parseFromString(category.xml, 'application/xml');
                    
                    // 获取所有的 block 元素
                    const blocks = categoryDom.getElementsByTagName('block');
                    
                    
                        // 倒序遍历并删除匹配的 block
                    for (let i = blocks.length - 1; i >= 0; i--) {
                        const block = blocks[i];
                        if (getHiddenBlocks().includes(block.getAttribute('type'))) {
                            // console.log(block.getAttribute('type') + ' 已被删除');
                            block.remove();
                        }
                    }

                    // 将修改后的 DOM 转回 XML 字符串
                    category.xml = new XMLSerializer().serializeToString(categoryDom.documentElement);

                    return category;
                });

                // console.log(this.deletedCategoriesID)
                // console.log(this.hiddenBlocksTypes)
            }catch(e){
                console.log(e)
            }

            // dynamicBlocksXML = processDynamicBlocksXML(dynamicBlocksXML);
console.log("没想到吧")
            return makeToolboxXML(false, target.isStage, target.id, dynamicBlocksXML,
                targetCostumes[targetCostumes.length - 1].name,
                stageCostumes[stageCostumes.length - 1].name,
                targetSounds.length > 0 ? targetSounds[targetSounds.length - 1].name : '',
                self.props.theme.getBlockColors()
            );
        } catch {
            return null;
        }
    }

    
    return {
       channelLoadExtension,
       channel,
       channelMasterClose,
       unindentCode,
       indentPythonFunctions,
       arraysAreEqual,
       findSecondTopParent,
       workspaceToCode,
       removeCategoryFromToolbox,
       restoreCategoriesToToolbox,
       getToolboxXML,
    };
}
