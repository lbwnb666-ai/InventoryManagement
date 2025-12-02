import request from '@/utils/request'

export const itemAPI = {
    /**
     * 获取全部物品总览
     */
    getAllItem(){ 
        return request.get(`/api/StuOperate/QueryAllItem`)
    },

    /**
     * 获取物品库存信息
     * @param {Object} data 查询数据
     * @param {string} data.id 物品id
     * @param {string} data.name 物品名称
     * @param {string} data.code 物品编码
     * @param {string} data.unit 物品规格
     * @param {string} data.specification 置空
     * @param {string} data.startTime 开始时间
     * @param {string} data.endTime 结束时间
     * @param {string} data.pageIndex 页码
     * @param {string} data.pageSize 每页条数
     */
    getItem(data){
        return request.post(`/api/StuOperate/QueryItem`,data)
    },

    /**
     * 获取物品出入库信息
     * @param {Object} data 查询数据S
     * @param {string} data.id 物品id
     * @param {string} data.name 物品名称
     * @param {string} data.type 出入库类型 1入库 2出库
     * @param {string} data.orderNumber 订单号
     * @param {string} data.startTime 开始时间
     * @param {string} data.endTime 结束时间
     * @param {string} data.pageIndex 页码
     * @param {string} data.pageSize 每页条数
    */
    queryInOutRecords(data){ 
        return request.post(`/api/StuOperate/QueryInOutRecords`,data)
    },

    /**
     * 添加物品
     * @param {Object} data 添加数据
     * @param {string} data.name 物品名称
     * @param {string} data.code 物品编码
     * @param {string} data.unit 物品规格
     */
    addItem(data){
        return request.post(`/api/StuOperate/AddItem`,data)
    },

    /**
     * 出库或者入库
     * @param {Object} data 添加数据
     * @param {string} data.itemId 物品id
     * @param {string} data.type 出入库类型 1入库 2出库
     * @param {string} data.quantity 数量
     * @param {string} data.operator 操作人id
     * @param {string} data.remark 备注
     */
    inOutItem(data){
        return request.post(`/api/StuOperate/AddInOutRecords`,data)
    },
}