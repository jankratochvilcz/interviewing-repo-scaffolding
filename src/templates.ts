import matter from "gray-matter"

export type TemplateType = "issue" | "pull_request"

export type Template = {
    title: string
    type: TemplateType
    branch?: string
    content: string
}

export const parseTemplate = (templateString: string): Template => {
    const parsed = matter(templateString)
    const title = parsed.data["title"]

    if(!title) {
        throw new Error("Title not filled.");
        
    }
    
    const content = parsed.content

    if(!content) {
        throw new Error("Content not filled.");
        
    }

    var type: TemplateType
    switch (parsed.data["type"]) {
        case "issue":
            type = "issue"
            break;
        case "pull_request":
            type = "pull_request"
            break
        default:
            throw new Error("Invalid or empty template type.");
    }

    const branch = parsed.data["branch"]

    const template = {
        title: title,
        type: type,
        branch: branch,
        content: content
    } as Template

    return template
}