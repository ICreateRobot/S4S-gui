import { getAdd ,getBlock} from '../../../../../utils/isAddMaster.js';
import { getIsRobot ,getRobotIp} from 'scratch-gui/src/components/utils/utils.js';
// ================== 核心逻辑 ==================
export function createControlsLogic(componentInstance) {
    const self = componentInstance

    function handleGreenFlagClick (e) {
        e.preventDefault();
        e.persist(); // 保留事件对象
        console.log('小绿旗')
        // fetch(`http://localhost:3000/get-ble`,{
        //     method: 'GET'
        // })
        // .then(response => {
        //     if (response.ok) {
        //     return response.text();
        //     } else {
        //     throw new Error('请求失败，状态码：' + response.status);
        //     }
        // })
        // .then(isble => {
        //     console.log('蓝牙是否连接', isble);
        //     console.log(getAdd())
        //     if(isble!='0' && getAdd() && getBlock()){
        //         alert('请先连接蓝牙')
        //     }else{
        //         if(getIsRobot()){
                   
        //         }
                // tw: implement alt+click and right click to toggle FPS
                if (e.shiftKey || e.altKey || e.type === 'contextmenu') {
                    if (e.shiftKey) {
                        self.props.vm.setTurboMode(!self.props.turbo);
                    }
                    if (e.altKey || e.type === 'contextmenu') {
                        if (self.props.framerate === 30) {
                            self.props.vm.setFramerate(60);
                        } else {
                            self.props.vm.setFramerate(30);
                        }
                    }
                } else {
                    if (!self.props.isStarted) {
                        self.props.vm.start();
                    }
                    self.props.vm.greenFlag();
                }
            //}
        // })
        // .catch(error => {
        //     console.error('发生错误：', error);
        // });
        
        
    }

    async function handleStopAllClick (e) {
        e.preventDefault();
        self.props.vm.stopAll();
        //console.log('停止')
        self.stopAll.postMessage(true)
        
        await window.EditorPreload.clearCurrentCommand();
        let data = packCommand('bot.restore_default()')
        const result = await window.EditorPreload.serialSendCommand(data,"Arduino");
    }

     function packCommand(cmd) {
        const HEADER = [0xaa, 0x02];
        const TAIL = 0x55;
      
        let id = 10;
      
        // ✅ 支持无参数
        const match = cmd.match(/^(\w+)\.(\w+)(?:\((.*)\))?$/);
        if (!match) {
          throw new Error("格式错误");
        }
      
        const [, obj, method, argsStr] = match;
      
        let args = [];
      
        // ✅ 解析参数（支持字符串中的逗号）
        if (argsStr && argsStr.trim() !== "") {
          let current = "";
          let inString = false;
      
          for (let c of argsStr) {
            if (c === '"') {
              inString = !inString;
              current += c;
            } else if (c === ',' && !inString) {
              args.push(current.trim());
              current = "";
            } else {
              current += c;
            }
          }
      
          if (current.trim() !== "") {
            args.push(current.trim());
          }
        }
      
        // ✅ 判断数字
        function isNumber(val) {
          return /^-?\d+(\.\d+)?$/.test(val);
        }
      
        let body = [];
      
        // ✅ ⃣ obj（强制加引号）
        const objStr = `"${obj}"`;
        const objBytes = Array.from(objStr).map(c => c.charCodeAt(0));
        body.push(id++, objBytes.length, ...objBytes);
      
        // ✅ ⃣ method（强制加引号）
        const methodStr = `"${method}"`;
        const methodBytes = Array.from(methodStr).map(c => c.charCodeAt(0));
        body.push(id++, methodBytes.length, ...methodBytes);
      
        // ✅ ⃣ 参数（按你规则处理）
        for (let arg of args) {
          let val = arg.trim();
      
          // 字符串（必须用户自己带引号）
          if (val.startsWith('"') && val.endsWith('"')) {
            // OK，直接用
          }
          // 数字
          else if (isNumber(val)) {
            // OK，不加引号
          }
          else {
            throw new Error(`参数格式错误: ${val}（字符串必须带引号）`);
          }
      
          const bytes = Array.from(val).map(c => c.charCodeAt(0));
      
          body.push(id++, bytes.length, ...bytes);
        }
      
        // ✅ 包长 = 字段 + 校验位
        const length = body.length + 1;
      
        const lenHigh = (length >> 8) & 0xff;
        const lenLow = length & 0xff;
      
        return [
          ...HEADER,
          lenHigh,
          lenLow,
          ...body,
          TAIL
        ];
      }

    
    return {
       handleGreenFlagClick,
       handleStopAllClick
    };
}
