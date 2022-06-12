import fs from "fs"

export type TemplateFile = {
    name: string,
    content: string
}

const templatlesFolder = '/templates'

export const getTemplateFiles = (): TemplateFile[] => {
    const files = fs.readdirSync(templatlesFolder)
    const templateFiles = files.map(x => ({
        name: x,
        content: fs.readFileSync(`${templatlesFolder}/${x}`, "utf-8")
    } as TemplateFile))

    return templateFiles
}