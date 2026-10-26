// Seed data: one fully-worked sample topic whose lesson body exercises
// every rich-content feature, plus three stubs so wikilinks resolve and the
// graph/backlinks have something to show.
export const seedTopics: Array<{ title: string; body?: string }> = [
  {
    title: "Quadratic Functions",
    body: `# Quadratic Functions

A [[quadratic function]] has the form $f(x) = ax^2 + bx + c$ with $a \\ne 0$.
See also [[Graph Theory]] for an unrelated link, and the
[[Quadratic Functions|same page under an alias]].

==The vertex is the highest or lowest point of the parabola.== %%Author note: keep this lesson under 5 minutes.%%

## Key facts

| Form | Equation | Vertex |
| ---- | -------- | ------ |
| Standard | $ax^2 + bx + c$ | $x = -b / 2a$ |
| Vertex | $a(x-h)^2 + k$ | $(h, k)$ |

- [x] Standard form memorized
- [ ] Factored form

> [!note] Discriminant
> The **discriminant** $D = b^2 - 4ac$ tells you how many real roots exist.

> [!warning]- Roots check
> If $D > 0$ there are two real roots:
>
> $$x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$$

\`\`\`python
def roots(a, b, c):
    d = b ** 2 - 4 * a * c
    return d
\`\`\`

\`\`\`mermaid
flowchart TD
    A[Compute D = b² − 4ac] --> B{D sign?}
    B -->|D > 0| C[Two real roots]
    B -->|D = 0| D[One repeated root]
    B -->|D < 0| E[No real roots]
\`\`\`

\`\`\`plot
fn: x^2 - 3*x + 2
fn: 0
x: -1 4
y: -3 6
\`\`\`

Below is this lesson's own table of contents, rendered from a fence:

\`\`\`toc
\`\`\`
`,
  },
  {
    title: "Quadratic Function",
    body: `# Quadratic Function

Stub topic. Every function $f(x) = ax^2 + bx + c$ is one. Back to
[[Quadratic Functions]].
`,
  },
  {
    title: "Graph Theory",
    body: `# Graph Theory

Stub topic about vertices and edges — not parabolas. Linked from
[[Quadratic Functions]] to show backlinks.
`,
  },
  {
    title: "Parabolas",
    body: `# Parabolas

Every [[Quadratic Functions|quadratic function]] graphs to a parabola.
The focus-directrix definition: points at equal distance from a fixed
point (focus) and a fixed line (directrix), giving $y = ax^2$ in the
simplest orientation.

> [!note] Reading the shape
> The sign of $a$ opens the parabola up ($a > 0$) or down ($a < 0$);
> $|a|$ controls how narrow it is.
`,
  },
];
