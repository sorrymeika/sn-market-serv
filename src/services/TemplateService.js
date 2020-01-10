const { Service } = require('sonorpc');

class TemplateService extends Service {
    async getTemplates({ name, status, groupId, pageType }) {
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

        if (pageType) {
            where += ' and FIND_IN_SET(@p' + (i++) + ',supportPageTypes)!=0';
            vals.push(pageType);
        }

        const res = await this.app.mysql.query(`select id,name,type,supportPageTypes,image,preview,html,css,sorting,groupId,props from marketTemplate where ${where} order by sorting desc`, vals);
        return { success: true, code: 1, data: res };
    }

    async addTemplate({
        name,
        description,
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
        const res = await this.app.mysql.insert('marketTemplate', {
            name,
            description,
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
            description,
            supportPageTypes,
            image,
            preview,
            html,
            css,
            sorting,
            groupId,
            props,
        } = data;
        const res = this.app.mysql.query(
            `update marketTemplate set 
                name={name},
                description={description},
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
                description,
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
        const res = this.app.mysql.query('update marketTemplate set status=0 where id=@p0', [templateId]);
        return { success: true, data: res };
    }
}

module.exports = TemplateService;