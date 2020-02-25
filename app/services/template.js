const { Service } = require('sonorpc');

class TemplateService extends Service {
    async getTemplates(params) {
        const res = await this.app.dao.template.getTemplates(params);
        return { success: true, data: res };
    }

    async getTemplatesByIds(ids) {
        const res = await this.app.dao.template.getTemplatesByIds(ids);
        return { success: true, data: res };
    }

    async addTemplate(data) {
        const res = await this.app.dao.template.addTemplate(data);
        return { success: !!res.insertId, id: res.insertId, data: res };
    }

    async updateTemplate(data) {
        const res = await this.app.dao.template.updateTemplate(data);
        return { success: true, data: res };
    }

    async deleteById(templateId) {
        const res = await this.app.dao.template.deleteById(templateId);
        return { success: true, data: res };
    }
}

module.exports = TemplateService;