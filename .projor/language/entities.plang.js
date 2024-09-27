async function parseEntitiesFile(filename, content) {
    const parsedEntities = [];

    // Regular expression to match entity blocks
    const entityRegex = /((?:\/\/[^\n]*\n)*)\s*entity\s+(\w+)\s*{\s*([^}]*)}/g;

    let match;
    while ((match = entityRegex.exec(content)) !== null) {
        const [_, commentBlock, entityName, entityBody] = match;

        const entityDescription = extractDescription(commentBlock) || "No description provided.";
        const { attributes, associations } = parseAttributesAndAssociations(entityBody);

        const entity = {
            name: entityName,
            description: entityDescription,
            attributes: attributes,
            associations: associations
        };

        parsedEntities.push(entity);
    }

    return {
        id: "entities",
        name: "Entities",
        description: "The entities in the project",
        schema: "Entity",
        objects: parsedEntities
    };
}

function extractDescription(commentBlock) {
    return commentBlock
        .split('\n')
        .map(line => {
            const match = line.match(/\/\/\s?(.*)/);
            return match ? match[1].trim() : '';
        })
        .filter(line => line.length > 0)
        .join(' ');
}

function parseAttributesAndAssociations(entityBody) {
    const attributes = [];
    const associations = [];

    // Regular expression to match attributes and associations
    const attributeRegex = /((?:\/\/[^\n]*\n)*)\s*(?:(@Join)\s+)?(\w+)\s+(\w+)/g;

    let match;
    while ((match = attributeRegex.exec(entityBody)) !== null) {
        const [_, commentBlock, joinKeyword, type, name] = match;
        const isAssociation = !!joinKeyword;

        const description = extractDescription(commentBlock) || "No description provided.";
        const mappedType = isAssociation ? `entities#${type}` : `basic#${type}`;

        const item = {
            name: name,
            description: description,
            type: mappedType
        };

        if (isAssociation) {
            associations.push(item);
        } else {
            attributes.push(item);
        }
    }

    return { attributes, associations };
}

async function parseAllEntitiesFiles(files) {
    if (files.length !== 1) {
        return {
            errors: [
                {
                    filename: "<unknown>",
                    message: "Only one entities file is allowed"
                }
            ]
        };
    }

    return await parseEntitiesFile(files[0].filename, files[0].content);
}

return {
    extensions: ['.entities'],
    parse: parseAllEntitiesFiles
};
