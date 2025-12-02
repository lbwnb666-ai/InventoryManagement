import request from '@/utils/request'

export const userAPI = {
    /**
     * 登录
     * @param {Object} data 登录数据S
     * @param {string} data.userName 用户名
     * @param {string} data.password 密码
     */
    login(data){
        return request.post('/api/User/Login', data)
    },

    /**
     * 注册
     * @param {Object} data 注册数据
     * @param {string} data.userName 用户名
     * @param {string} data.account 账号
     * @param {string} data.password 密码
     * @param {int} data.inviteCode 邀请码
    */
    register(data){
            return request.post('/api/User/Register', data)
    },

    /**
     * 生成邀请码
     * @param {int} data 用户ID信息
     */
    AddInviteCode(data){
        return request.get(`/api/User/AddInviteCode?userId=${data}`)
    },

    /**
     * 获取当前用户下的所有邀请码
     * @param {int} data 用户ID信息
     */
    GetInviteCode(data){
        return request.get(`/api/User/GetInviteCode?userId=${data}`)
    },

    /**
     * 获取用户信息
     * @param {int} data 用户token
     */
    getUserInfo(data){ 
        return request.post(`/api/User/UserInfo`,{UserToken: data})
    },

    /**
     * 撤销该邀请码
     * @param {int} data 邀请码ID
    */
    revokeInviteCode(data){
        return request.get(`/api/User/revokeInviteCode?CodeId=${data}`)
   }

}