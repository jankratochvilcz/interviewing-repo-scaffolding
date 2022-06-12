import test from "ava"
import { parseTemplate, Template } from "./templates"

test('parses content correctly', t => {
    const actual = parseTemplate('---\ntitle: Front Matter\ntype: pull_request\nbranch: main\n---\nThis is content.')
    t.deepEqual(actual, {
        title: 'Front Matter',
        branch: "main",
        content: "This is content.",
        type: "pull_request"
    } as Template)
})

const validateThrowsMacro = test.macro((t, input: string) => {
    t.throws(() => parseTemplate(input))
})

test('throws for missing title', validateThrowsMacro, '---\ntype: pull_request\nbranch: main\n---\nThis is content.')

test('throws for missing type', validateThrowsMacro, '---\ntitle: Front Matter\nbranch: main\n---\nThis is content.')
test('throws for invalid type', validateThrowsMacro, '---\ntitle: Front Matter\nbranch: main\ntype: invalid_type\n---\nThis is content.')

test('throws for missing content', validateThrowsMacro, '---\ntitle: Front Matter\ntype: pull_request\nbranch: main\n---\n')