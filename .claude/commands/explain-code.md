# Explain Code Command

Provides detailed, line-by-line explanation of code functionality, design patterns, and architectural decisions.

## Usage

```bash
/explain-code <file_path>
```

## What This Command Does

1. **High-Level Overview**: Explains the file's purpose and role
2. **Line-by-Line Analysis**: Detailed explanation of each code section
3. **Design Patterns**: Identifies and explains patterns used
4. **Dependencies**: Explains imported modules and their purposes
5. **Data Flow**: Traces data through functions and components
6. **Best Practices**: Highlights adherence to or violations of standards
7. **Multi-Tenant Context**: Explains organization isolation patterns

## Explanation Depth Levels

### Quick Explanation (Default)
- Purpose and key functionality
- Main design patterns
- Critical security/compliance aspects

### Detailed Explanation (`--detailed`)
- Line-by-line breakdown
- Variable naming rationale
- Algorithm explanations
- Performance considerations

### Beginner-Friendly (`--beginner`)
- Simplified explanations
- TypeScript concepts explained
- Common patterns clarified
- Links to documentation

## Arguments

- `$ARGUMENTS`: File path to explain (required)
  - Can include flags: `--detailed`, `--beginner`, `--security-focus`

## Examples

```bash
/explain-code apps/web/src/server/api/routers/client.ts
/explain-code apps/web/src/components/TaxCalculator.tsx --detailed
/explain-code apps/web/src/lib/utils/encryption.ts --security-focus
```

---

**Intelligent Explanation**: Uses development-assistant agent to analyze $ARGUMENTS and provide clear, comprehensive explanations tailored to your understanding level and focus area.