# Commit Conventions

We follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/):

```
<type>(<scope>): <short, imperative summary>

[optional body]

[optional footer(s)]
```

## Types

| Type | Use for |
|---|---|
| `feat` | a new feature |
| `fix` | a bug fix |
| `docs` | documentation only |
| `style` | formatting, no code meaning change |
| `refactor` | code change that neither fixes a bug nor adds a feature |
| `test` | adding or correcting tests |
| `chore` | tooling, dependencies, config |

## Scope

Use the module name: `authentication`, `users`, `tickets`, `chatbot`, `ai`, `knowledge-base`,
`notifications`, `dashboard`, `admin`, `analytics`, `frontend`, `database`, `docker`, `ci`, `repo`.

## Examples

```
feat(tickets): scaffold ticket CRUD routes with mock responses
fix(auth): correct precedence of role guard over route handler
docs(architecture): map NFR-2.7 to ai module
chore(ci): add backend lint + typecheck workflow
test(chatbot): add placeholder unit test for intent service
```

## Rules

- Imperative mood ("add", not "added"/"adds").
- Keep the summary under ~72 characters.
- Reference requirement IDs or issue numbers in the body when relevant, e.g. `Refs NFR-1.3, #42`.
