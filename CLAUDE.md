# AAO React Native

## Superpowers Skills Framework

This project uses the [Superpowers](https://github.com/obra/superpowers) skills framework. You have superpowers.

**Below is your introduction to using skills. For all other skills, use the `Skill` tool.**

Skills are located in `.claude/skills/`. Agents are in `.claude/agents/`. Commands are in `.claude/commands/`.

### Available Skills

| Skill | Purpose |
|-------|---------|
| `using-superpowers` | Introduction to the skills system |
| `brainstorming` | Socratic design refinement before coding |
| `writing-plans` | Detailed implementation plans |
| `executing-plans` | Batch execution with checkpoints |
| `subagent-driven-development` | Fast iteration with two-stage review |
| `dispatching-parallel-agents` | Concurrent subagent workflows |
| `test-driven-development` | RED-GREEN-REFACTOR cycle |
| `systematic-debugging` | 4-phase root cause process |
| `verification-before-completion` | Ensure it's actually fixed |
| `requesting-code-review` | Pre-review checklist |
| `receiving-code-review` | Responding to feedback |
| `using-git-worktrees` | Parallel development branches |
| `finishing-a-development-branch` | Merge/PR decision workflow |
| `writing-skills` | Create new skills |

### Available Agents

| Agent | Purpose |
|-------|---------|
| `code-reviewer` | Reviews completed project steps against plans and coding standards |

### How It Works

**Invoke relevant skills BEFORE any response or action.** Even a 1% chance a skill might apply means you should invoke the skill to check. If an invoked skill turns out to be wrong for the situation, you don't need to use it.

#### Red Flags - These thoughts mean STOP, you're rationalizing:

| Thought | Reality |
|---------|---------|
| "This is just a simple question" | Questions are tasks. Check for skills. |
| "I need more context first" | Skill check comes BEFORE clarifying questions. |
| "Let me explore the codebase first" | Skills tell you HOW to explore. Check first. |
| "This doesn't need a formal skill" | If a skill exists, use it. |
| "The skill is overkill" | Simple things become complex. Use it. |
| "I'll just do this one thing first" | Check BEFORE doing anything. |

#### Skill Priority

When multiple skills could apply, use this order:
1. **Process skills first** (brainstorming, debugging) - these determine HOW to approach the task
2. **Implementation skills second** - these guide execution

"Let's build X" -> brainstorming first, then implementation skills.
"Fix this bug" -> debugging first, then domain-specific skills.
