const { Service } = require('sonorpc');

class TemplateService extends Service {
    getTemplates({ name, status, groupId, pageType }) {
        let i = 0;
        let where = '1=1';
        let vals = [];

        if (status != null) {
            where += ' and status=@p' + i++;
            vals.push(status);
        }

        if (name) {
            where += ' and name like @p' + (i++);
            vals.push(`%${name}%`);
        }

        if (groupId != null) {
            where += ' and groupId=@p' + i++;
            vals.push(groupId);
        }

        if (pageType) {
            where += ' and FIND_IN_SET(@p' + (i++) + ',supportPageTypes)!=0';
            vals.push(pageType);
        }

        return this.connection.query(`select id,name,type,supportPageTypes,image,preview,html,css,sorting,groupId,props from marketTemplate where ${where} order by sorting desc`, vals);
    }

    getTemplatesByIds(templateIds) {
        return this.connection.query('select id,name,type,html,css,props from marketTemplate where id in (?)', templateIds);
    }

    addTemplate({
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
        return this.connection.insert('marketTemplate', {
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
    }

    updateTemplate({
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
    }) {
        return this.connection.update('marketTemplate', {
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
        }, { id });
    }

    deleteById(templateId) {
        return this.connection.query('update marketTemplate set status=0 where id=@p0', [templateId]);
    }
}

module.exports = TemplateService;