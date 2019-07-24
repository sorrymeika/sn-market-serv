--# mysql -u root -p
--# Enter password: 12345Qwert

-- 创建数据库
create database if not exists sn_market;

-- 创建用户
create user 'dev'@'localhost' identified by '12345Qwert';

-- 设置用户密码等级
ALTER USER 'dev'@'localhost' IDENTIFIED WITH mysql_native_password BY '12345Qwert';
FLUSH PRIVILEGES;

-- 分配权限
grant ALL on sn_market.* to 'dev'@'localhost';

-- 查看用户
SELECT User, Host FROM mysql.user;

-- 查看用户权限
show grants for 'dev'@'localhost';

-- 展示所有数据库
show databases;

-- 使用数据库
use sn_market;

-- 展示所有表
-- show tables;

-- 页面模版表
create table marketTemplate (
    id int(10) primary key auto_increment,
    name varchar(100),
    type int(4),
    image varchar(100),
    preview varchar(500),
    html text,
    css varchar(2048),
    groupId int(6), -- enum { 1: '图文模块', 2: '商品模块', 3: '智能模块' }
    props json
);

-- 页面表
create table marketPage (
    id int(10) primary key auto_increment,
    name varchar(100),
    type int(6),
    props json,
    status int(2) -- enum { 0: '虚拟删除', 1: '编辑', 2: '发布' }
)

-- 页面数据表
create table marketPageData (
    id int(12) primary key auto_increment,
    pageId int(10),
    templateId int(10),
    sort int(4),
    data json,
    props json
)

-- 页面历史表
create table marketPageHistory (
    id int(12) primary key auto_increment,
    pageId int(10),
    name varchar(100),
    type int(6),
    props json,
    status int(2) -- enum { 0: '虚拟删除', 1: '编辑中', 2: '发布' }
)

-- 页面数据历史表
create table marketPageDataHistory (
    id int(12) primary key auto_increment,
    historyId int(12),
    dataId int(12),
    sort int(4),
    data json,
    props json
)
