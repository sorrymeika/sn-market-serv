const { Dao } = require('sonorpc');

const PAGE_STATUS_ERROR = { success: false, code: 11000, message: '页面状态错误!' };
const PAGE_NOT_EXISTS = { success: false, code: 11001, message: '页面不存在!' };

const DEFAULT_COLUMNS = ['id', 'name', 'type', 'props', 'status', 'keyName', 'sellerId'];

class PageDao extends Dao {
    async query({ id, name, type, status, sellerId, pageIndex, pageSize }) {
        let where = {};

        if (id) {
            where.id = id;
        }
        if (name) {
            where['name like ?'] = `%${name}%`;
        }
        if (status != null) {
            where.status = status;
        }
        if (type != null) {
            where.type = type;
        }
        if (sellerId != null) {
            where.sellerId = sellerId;
        }

        return this.connection.selectPage(DEFAULT_COLUMNS, 'marketPage', {
            where,
            pageIndex,
            pageSize
        });
    }

    async getPageByKeyName(keyName) {
        const rows = await this.connection.select(DEFAULT_COLUMNS, 'marketPage', {
            where: {
                keyName
            }
        });
        return rows[0];
    }

    async getPageById(pageId) {
        const rows = await this.connection.query('select ?? from marketPage where id=?', [DEFAULT_COLUMNS, pageId]);
        return rows[0];
    }

    async getPageBySellerId(sellerId) {
        const rows = await this.connection.query('select ?? from marketPage where sellerId=? and type=3 limit 1', [DEFAULT_COLUMNS, sellerId]);
        return rows[0];
    }

    getBricksByPageId(pageId) {
        return this.connection.query('select id,pageId,templateId,sort,props,data from marketBricks where pageId=@p0', [pageId]);
    }

    addPage(type, name, sellerId) {
        return this.connection.insert('marketPage', {
            type,
            name,
            sellerId,
            status: 1
        });
    }

    async editPage(pageId, sellerId) {
        const result = await this.connection.query('select id,name,type,props,status,keyName from marketPage where status!=0 and id=@p0 and sellerId=@p1 limit 1', [pageId, sellerId]);
        if (!result || !result[0]) {
            return PAGE_STATUS_ERROR;
        }
        return this._editPage(result[0]);
    }

    async editHome() {
        let result = await this._queryHome();
        if (!result || !result.length) {
            const page = {
                name: '首页',
                type: 1,
                props: null,
                status: 1,
                sellerId: 0,
                keyName: 'home'
            };
            const res = await this.connection.insert('marketPage', page);
            if (res.insertId) {
                page.id = res.insertId;
                return { success: true, code: 1, data: page };
            }
        }
        return this._editPage(result[0]);
    }

    _queryHome() {
        return this.connection.query('select id,name,type,props,status,keyName from marketPage where status!=0 and type=1 and keyName=\'home\' limit 1');
    }

    async editShop(sellerId) {
        let result = await this.connection.query('select id,name,type,props,status,keyName from marketPage where status!=0 and type=3 and sellerId=@p0 limit 1', [sellerId]);

        if (!result || !result.length) {
            const page = {
                name: '店铺首页',
                type: 3,
                props: null,
                status: 1,
                sellerId,
                keyName: 'shop' + sellerId
            };
            const res = await this.connection.insert('marketPage', page);
            if (res.insertId) {
                page.id = res.insertId;
                return { success: true, code: 0, data: page };
            }
        }

        return this._editPage(result[0]);
    }

    async _editPage(data) {
        if (data.status == 3) {
            const rows = await this._queryEditingPage(data.id);
            if (!rows || !rows[0]) {
                return PAGE_STATUS_ERROR;
            }
            const edit = rows[0];

            data.historyId = edit.id;
            data.name = edit.name;
            data.props = edit.props;
        } else if (data.status == 2) {
            await this.app.transaction(async (connection) => {
                const history = await connection.insert('marketPageHistory', {
                    pageId: data.id,
                    name: data.name,
                    props: data.props,
                    status: 3
                });
                // 将编辑中的数据插入历史表中
                await connection.query('insert into marketBricksHistory (historyId,dataId,templateId,sort,data,props)'
                    + ' select @p0,id,templateId,sort,data,props from marketBricks where pageId=@p1', [history.insertId, data.id]);
                // 修改原页面状态
                await connection.query('update marketPage set status=3 where id=@p0', [data.id]);
                data.status = 3;
                data.historyId = history.insertId;
            });
        }
        return { success: true, code: 1, data };
    }

    _queryEditingPage(pageId) {
        return this.connection.query('select id,name,props,status from marketPageHistory where status=3 and pageId=@p0 limit 1', [pageId]);
    }

    async _getHistoryId(pageId) {
        const rows = await this.connection.query('select id from marketPageHistory where status=3 and pageId=@p0 limit 1', [pageId]);
        if (!rows || !rows[0]) {
            return 0;
        }
        return rows[0].id;
    }

    async _getPageStatus(pageId) {
        const rows = await this.connection.query('select status from marketPage where id=@p0', [pageId]);
        if (!rows[0]) return null;
        return rows[0].status;
    }

    async editBricks(pageId, historyId) {
        const status = await this._getPageStatus(pageId);
        if (!status) return PAGE_NOT_EXISTS;

        let data;

        if (status === 1) {
            data = await this.connection.query('select id,pageId,templateId,sort,props,data,1 as type from marketBricks where pageId=@p0', [pageId]);
        } else if (historyId && status === 3) {
            data = await this.connection.query('select id,historyId,templateId,sort,props,data,2 as type,dataId from marketBricksHistory where historyId=@p0', [historyId]);
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
            insert = await this.connection.insert('marketBricks', {
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
            insert = await this.connection.insert('marketBricksHistory', {
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

        return { success: true, code: 1, data: brick };
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
            result = await this.connection.query('update marketBricks set sort={sort},props={props},data={data} where id={id}', {
                id,
                data,
                props,
                sort,
            });
        } else if (status === 3 && brickType == 2) {
            result = await this.connection.query('update marketBricksHistory set sort={sort},props={props},data={data} where id={id}', {
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
            result = await this.connection.query('delete from marketBricks where id={id}', {
                id: brickId
            });
        } else if (status === 3 && brickType == 2) {
            result = await this.connection.query('delete from marketBricksHistory where id={id}', {
                id: brickId
            });
        } else {
            return PAGE_STATUS_ERROR;
        }
        return { success: true, code: 1, data: result };
    }

    async savePageProps(pageId, historyId, pageProps) {
        const status = await this._getPageStatus(pageId);
        if (!status) return PAGE_NOT_EXISTS;

        if (status === 1) {
            await this.connection.query('update marketPage set props={props} where id={id}', {
                id: pageId,
                props: pageProps
            });
        } else if (historyId && status === 3) {
            await this.connection.query('update marketPageHistory set props={props} where id={id}', {
                id: historyId,
                props: pageProps
            });
        } else {
            return PAGE_STATUS_ERROR;
        }
        return { success: true, code: 0, data: pageProps };
    }

    async savePage(pageId, historyId, pageName, sortings) {
        const status = await this._getPageStatus(pageId);
        if (!status) return PAGE_NOT_EXISTS;

        let results;
        if (status === 1) {
            await this.connection.query('update marketPage set name={name} where id={id}', {
                id: pageId,
                name: pageName
            });
            results = await Promise.all(sortings.map(({ id, sort }) => (
                this.connection.query('update marketBricks set sort={sort} where id={id}', {
                    id,
                    sort
                })
            )));
        } else if (historyId && status === 3) {
            await this.connection.query('update marketPageHistory set name={name} where id={id}', {
                id: historyId,
                name: pageName
            });
            results = await Promise.all(sortings.map(({ id, sort }) => (
                this.connection.query('update marketBricksHistory set sort={sort} where id={id}', {
                    id,
                    sort
                })
            )));
        } else {
            return PAGE_STATUS_ERROR;
        }
        return { success: true, code: 1, data: results };
    }

    async publishPage(pageId, historyId) {
        const status = await this._getPageStatus(pageId);
        if (!status) return PAGE_NOT_EXISTS;

        const results = [];
        let result;
        if (status === 1) {
            result = await this.connection.query('update marketPage set status=2 where id={id}', {
                id: pageId
            });
            results.push(result);
        } else if (historyId && status === 3) {
            await this.app.transaction(async (connection) => {
                results.push(
                    await connection.query('update marketPage a,marketPageHistory b set a.status=2,b.status=2,a.name=b.name,a.props=b.props where a.id={id} and b.pageId={id}', {
                        id: pageId
                    })
                );
                results.push(await connection.query('delete from marketBricks where pageId=@p0', [pageId]));
                results.push(await connection.query('insert into marketBricks (pageId,templateId,sort,data,props) select @p0,templateId,sort,data,props from marketBricksHistory where historyId=@p1', [pageId, historyId]));
            });
        } else {
            return PAGE_STATUS_ERROR;
        }
        return { success: true, code: 1, data: results };
    }
}

module.exports = PageDao;