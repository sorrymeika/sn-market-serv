const { Service } = require('sonorpc');

const PARAM_ERROR = { success: false, code: -140, message: '参数错误' };
const PAGE_STATUS_ERROR = { success: false, code: 11000, message: '页面状态错误!' };
const PAGE_NOT_EXISTS = { success: false, code: 11001, message: '页面不存在!' };

class PageService extends Service {
    async list(data) {
        this.app.validate({
            pageIndex: { type: 'number', required: true },
            pageSize: { type: 'number', required: true },
        }, data);
        const rows = await this.app.dao.page.query(data);
        return { success: true, data: rows };
    }

    async getPageByKeyName(keyName) {
        if (typeof keyName !== 'string') {
            return PARAM_ERROR;
        }
        const page = await this.app.dao.page.getPageByKeyName(keyName);
        if (page) {
            const [bricks, templates] = await this._getBricksAndTemplates(page.id);
            page.bricks = bricks;
            page.templates = templates;
        }
        return { success: true, data: page };
    }

    async getPageById(pageId) {
        if (typeof pageId !== 'number') {
            return PARAM_ERROR;
        }
        const page = await this.app.dao.page.getPageById(pageId);
        if (page) {
            const [bricks, templates] = await this._getBricksAndTemplates(page.id);
            page.bricks = bricks;
            page.templates = templates;
        }
        return { success: true, data: page };
    }

    async getPageBySellerId(sellerId) {
        if (typeof sellerId !== 'number') {
            return PARAM_ERROR;
        }

        const page = await this.app.dao.page.getPageBySellerId(sellerId);
        if (page) {
            const [bricks, templates] = await this._getBricksAndTemplates(page.id);
            page.bricks = bricks;
            page.templates = templates;
        }

        return { success: true, data: page };
    }

    async _getBricksAndTemplates(pageId) {
        const bricks = await this.app.dao.page.getBricksByPageId(pageId);
        let templates;
        if (bricks) {
            templates = await this.app.dao.template.getTemplatesByIds(bricks.map((brick) => brick.templateId));
        }
        return [bricks || [], templates || []];
    }

    async addPage(type, name, sellerId) {
        const result = await this.app.dao.page.addPage(type, name, sellerId);
        return { success: true, id: result.insertId };
    }

    editPage(pageId, sellerId) {
        return this.app.dao.page.addPage(pageId, sellerId);
    }

    editHome() {
        return this.app.dao.page.editHome();
    }

    editShop(sellerId) {
        return this.app.dao.page.editShop(sellerId);
    }

    editBricks(pageId, historyId) {
        return this.app.dao.page.editBricks(pageId, historyId);
    }

    addBrick(pageId, brick, historyId) {
        return this.app.dao.page.addBrick(pageId, brick, historyId);
    }

    updateBrick(pageId, brick) {
        return this.app.dao.page.updateBrick(pageId, brick);
    }

    deleteBrick(pageId, brickId, brickType) {
        return this.app.dao.page.deleteBrick(pageId, brickId, brickType);
    }

    savePageProps(pageId, historyId, pageProps) {
        return this.app.dao.page.savePageProps(pageId, historyId, pageProps);
    }

    savePage(pageId, historyId, pageName, sortings) {
        return this.app.dao.page.savePage(pageId, historyId, pageName, sortings);
    }

    publishPage(pageId, historyId) {
        return this.app.dao.page.publishPage(pageId, historyId);
    }
}

module.exports = PageService;