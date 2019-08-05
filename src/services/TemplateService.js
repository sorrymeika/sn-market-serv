const { Service } = require('sonorpc');

class TemplateService extends Service {
    async getTemplates({ name, status, groupId }) {
        let i = 0;
        let where = '1=1';
        let vals = [];

        if (status != null) {
            where += ' and status=@p' + i++;
            vals.push(status);
        }

        if (name) {
            where += ' and name like CONCAT(\'%\',@p' + (i++) + ',\'%\')';
            vals.push(name);
        }

        if (groupId != null) {
            where += ' and groupId=@p' + i++;
            vals.push(groupId);
        }

        const res = await this.ctx.mysql.query(`select id,name,type,supportPageTypes,image,preview,html,css,sorting,groupId,props from marketTemplate where ${where} order by sorting desc`, vals);
        return { success: true, data: res };
    }

    async addTemplate({
        name,
        type,
        supportPageTypes,
        image,
        preview,
        html,
        css,
        sorting,
        groupId,
        props
    }) {
        const res = await this.ctx.mysql.insert('marketTemplate', {
            name,
            type,
            supportPageTypes,
            image,
            preview,
            html,
            css,
            sorting,
            groupId,
            props,
            status: 1
        });
        return { success: !!res.insertId, id: res.insertId, data: res };
    }

    updateTemplate(data) {
        const {
            id,
            name,
            supportPageTypes,
            image,
            preview,
            html,
            css,
            sorting,
            groupId,
            props,
        } = data;
        const res = this.ctx.mysql.query(
            `update marketTemplate set 
                name={name},
                supportPageTypes={supportPageTypes},
                image={image},
                preview={preview},
                html={html},
                css={css},
                sorting={sorting},
                groupId={groupId},
                props={props}
            where id={id}`,
            {
                id,
                name,
                supportPageTypes,
                image,
                preview,
                html,
                css,
                sorting,
                groupId,
                props
            });
        return { success: true, data: res };
    }

    deleteById(templateId) {
        const res = this.ctx.mysql.query('update marketTemplate set status=0 where id=@p0', [templateId]);
        return { success: true, data: res };
    }
}

module.exports = TemplateService;