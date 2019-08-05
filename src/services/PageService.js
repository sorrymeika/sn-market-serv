const { Service } = require('sonorpc');

const PAGE_STATUS_ERROR = { success: false, code: 11000, message: '页面状态错误!' };
const PAGE_NOT_EXISTS = { success: false, code: 11001, message: '页面不存在!' };


class PageService extends Service {

    async editHome() {
        let result = await this._queryHome();

        if (!result || !result.length) {
            const page = {
                name: '首页',
                type: 1,
                props: null,
                status: 1,
                keyName: 'home'
            };
            const res = await this.ctx.mysql.insert('marketPage', page);
            if (res.insertId) {
                page.id = res.insertId;
                return { success: true, code: 1, data: page };
            }
        }

        const data = result[0];
        if (data.status == 3) {
            const rows = await this._queryEdit(data.id);
            if (!rows || !rows[0]) {
                return PAGE_STATUS_ERROR;
            }
            const edit = rows[0];

            data.historyId = edit.id;
            data.name = edit.name;
            data.props = edit.props;
        } else if (data.status == 2) {
            await this.ctx.mysql.useTransaction(async (connection) => {
                const history = await connection.insert('marketPageHistory', {
                    pageId: data.id,
                    name: data.name,
                    props: data.props,
                    status: 3
                });
                // 将编辑中的数据插入历史表中
                await connection.query('insert into marketBricksHistory (historyId,dataId,sort,data,props)'
                    + ' select @p0,id,sort,data,props from marketBricks where pageId=@p1', [history.insertId, data.id]);
                // 修改原页面状态
                await connection.query('update marketPage set status=3 where id=@p0', [data.id]);
                data.status = 3;
            });
        }

        return { success: true, code: 1, data };
    }

    _queryHome() {
        return this.ctx.mysql.query('select id,name,type,props,status,keyName from marketPage where status!=0 and type=1 and keyName=\'home\' limit 1');
    }

    _queryEdit(pageId) {
        return this.ctx.mysql.query('select id,name,type,props,status from marketPageHistory where status=3 and pageId=@p0 limit 1', [pageId]);
    }

    async _getPageStatus(pageId) {
        const rows = await this.ctx.mysql.query('select status from marketPage where pageId=@p0', [pageId]);
        if (!rows[0]) return null;
        return rows[0].status;
    }

    async editBricks(pageId, historyId) {
        const status = await this._getPageStatus(pageId);
        if (!status) return PAGE_NOT_EXISTS;

        let data;

        if (status === 1) {
            data = await this.ctx.mysql.query('select id,pageId,templateId,sort,props,data,1 as type from marketBricks where pageId=@p0', [pageId]);
        } else if (historyId && status === 3) {
            data = await this.ctx.mysql.query('select id,historyId,templateId,sort,props,data,2 as type,dataId from marketBricksHistory where historyId=@p0', [historyId]);
        } else {
            return PAGE_STATUS_ERROR;
        }
        return { success: true, code: 1, data };
    }

    async addBrick(pageId, brick, historyId) {
        const status = await this._getPageStatus(pageId);
        if (!status) return PAGE_NOT_EXISTS;

        let insert;

        if (status === 1) {
            // 页面状态为新建，直接插入`marketBricks`表
            insert = await this.ctx.mysql.insert('marketBricks', {
                pageId,
                templateId: brick.templateId,
                sort: brick.sort,
                data: brick.data,
                props: brick.props,
            });
            brick.id = insert.insertId;
            brick.type = 1;
        } else if (historyId && status === 3) {
            // 页面状态为修改中，插入`marketBricksHistory`表
            insert = await this.ctx.mysql.insert('marketBricksHistory', {
                historyId,
                templateId: brick.templateId,
                sort: brick.sort,
                data: brick.data,
                props: brick.props,
            });
            brick.id = insert.insertId;
            brick.type = 2;
        } else {
            return PAGE_STATUS_ERROR;
        }

        return { success: true, code: 1, data: insert };
    }

    async updateBrick(pageId, brick) {
        const status = await this._getPageStatus(pageId);
        if (!status) return PAGE_NOT_EXISTS;

        const {
            id,
            type: brickType,
            props,
            data,
            sort,
        } = brick;

        let result;

        if (status === 1 && brickType == 1) {
            result = await this.ctx.mysql.query('update marketBricks set sort={sort},props={props},data={data} where id={id}', {
                id,
                data,
                props,
                sort,
            });
        } else if (status === 3 && brickType == 2) {
            result = await this.ctx.mysql.query('update marketBricksHistory set sort={sort},props={props},data={data} where id={id}', {
                id,
                data,
                props,
                sort,
            });
        } else {
            return PAGE_STATUS_ERROR;
        }

        return { success: true, code: 1, data: result };
    }

    async deleteBrick(pageId, brickId, brickType) {
        const status = await this._getPageStatus(pageId);
        if (!status) return PAGE_NOT_EXISTS;

        let result;

        if (status === 1 && brickType == 1) {
            result = await this.ctx.mysql.query('delete from marketBricks where id={id}', {
                id: brickId
            });
        } else if (status === 3 && brickType == 2) {
            result = await this.ctx.mysql.query('delete from marketBricksHistory where id={id}', {
                id: brickId
            });
        } else {
            return PAGE_STATUS_ERROR;
        }
        return { success: true, code: 1, data: result };
    }
}

module.exports = PageService;