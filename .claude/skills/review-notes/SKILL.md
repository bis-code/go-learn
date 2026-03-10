# /review-notes

Review offline notes and log them as Q&A entries in the learning tracker.

## When to Use

When the user has written questions in `notes/` while offline and wants them answered and logged.

## Workflow

1. **Scan** — read all `.md` files in the `notes/` directory (skip `reviewed/` subfolder)
2. **For each note:**
   a. Read the file content — this is the user's question
   b. Call `learn_log_question` with the note content
   c. Answer the question thoroughly (following the learning-mode rules)
   d. Call `learn_log_answer` with a concise markdown summary of the answer
   e. Move the file to `notes/reviewed/` so it's not processed again
3. **Report** — summarize how many notes were reviewed

## Note Format

Each note file is a standalone question in markdown:

```
notes/
  001-error-wrapping.md     ← "How does error wrapping work in Go?"
  002-generics-constraints.md ← "What are type constraints in generics?"
  reviewed/                  ← processed notes land here
```

The filename is for your reference only — the file content IS the question.

## Requirements

- An active topic MUST be set before reviewing notes. If none is set, ask the user which topic these notes belong to.
- Create the `notes/reviewed/` directory if it doesn't exist.
- Process notes in alphabetical order.
