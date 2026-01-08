import LazyScratchBlocks from './tw-lazy-scratch-blocks';
import 'scratch-blocks/blockly_compressed_vertical'
import 'scratch-blocks/blockly_compressed_horizontal'
import 'scratch-blocks/lua_compressed'

import 'scratch-blocks/python_compressed'
/**
 * Connect scratch blocks with the vm
 * @param {VirtualMachine} vm - The scratch vm
 * @return {ScratchBlocks} ScratchBlocks connected with the vm
 */
export default function (vm) {
    const ScratchBlocks = LazyScratchBlocks.get();
    


    return ScratchBlocks;
}
