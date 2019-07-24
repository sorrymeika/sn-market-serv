# sn-auth
超级引擎(super engine) - 用户中心服务

# 错误码

* 1: 成功
* 10000： 账号不存在
* 10001： 密码错误
* 10002： 账号无权限

# redis规范

## 用户信息

* 用户信息使用hash存储，每个用户独立key，过期时间24*7小时，每次调用刷新过期时间
* 用户登录token: `uc:{userId} token {token}`
* 用户角色: `uc:{userId} role {role}`