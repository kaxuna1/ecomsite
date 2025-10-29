#!/usr/bin/env python3
"""
Interactive script to generate a change request YAML file.

Usage:
    python generate_change_request.py

The script will interactively prompt for information and generate
a properly formatted change request YAML file.
"""

import os
import sys
from datetime import datetime
from pathlib import Path


def get_input(prompt, default=None, required=True):
    """Get user input with optional default value."""
    if default:
        prompt = f"{prompt} [{default}]"

    prompt += ": "
    value = input(prompt).strip()

    if not value and default:
        return default

    if not value and required:
        print("This field is required!")
        return get_input(prompt, default, required)

    return value


def get_multiline(prompt):
    """Get multiline input from user."""
    print(f"{prompt} (Enter empty line when done):")
    lines = []
    while True:
        line = input()
        if not line:
            break
        lines.append(line)
    return "\n    ".join(lines) if lines else ""


def get_list_input(prompt):
    """Get list input from user."""
    print(f"{prompt} (one per line, empty line when done):")
    items = []
    while True:
        item = input("  - ").strip()
        if not item:
            break
        items.append(item)
    return items


def format_list(items, indent=2):
    """Format list for YAML."""
    spaces = " " * indent
    return "\n".join([f"{spaces}- \"{item}\"" for item in items])


def select_template():
    """Let user select a template type."""
    templates = {
        "1": ("feature", "Feature"),
        "2": ("bugfix", "Bug Fix"),
        "3": ("refactor", "Refactoring"),
        "4": ("technical_debt", "Technical Debt"),
    }

    print("\nSelect change request type:")
    for key, (_, name) in templates.items():
        print(f"  {key}) {name}")

    choice = get_input("\nChoice", "1")
    return templates.get(choice, templates["1"])[0]


def generate_feature_cr():
    """Generate feature change request."""
    cr_id = get_input("Change Request ID", "CR-001")
    title = get_input("Feature title")

    print("\nEnter feature description:")
    description = get_multiline("Description")

    business_value = get_multiline("Business value")

    research_findings = get_list_input("\nResearch findings")
    functional_reqs = get_list_input("\nFunctional requirements")

    print("\nNon-functional requirements:")
    perf_reqs = get_list_input("Performance requirements")
    sec_reqs = get_list_input("Security requirements")

    dependencies = get_list_input("\nTechnical dependencies")
    integration_points = get_list_input("Integration points")

    # Generate YAML
    yaml_content = f"""change_request:
  id: {cr_id}
  type: feature
  title: "{title}"
  description: |
    {description}

  business_value: |
    {business_value}

  research_findings:
{format_list(research_findings)}

  functional_requirements:
{format_list(functional_reqs)}

  non_functional_requirements:
    performance:
{format_list(perf_reqs, 6)}
    security:
{format_list(sec_reqs, 6)}

  technical_dependencies:
{format_list(dependencies)}

  integration_points:
{format_list(integration_points)}

tasks:
  # TODO: Add tasks here
  - id: TASK-001
    title: "TODO: Task title"
    type: backend  # frontend|backend|database|devops|fullstack
    agent: backend
    complexity: M  # S|M|L
    priority: high  # high|medium|low
    dependencies: []

    description: |
      TODO: Task description

    acceptance_criteria:
      - "TODO: Criterion 1"
      - "TODO: Criterion 2"

    technical_notes: |
      TODO: Implementation notes

    edge_cases:
      - "TODO: Edge case 1"

    validation_checklist:
      - "[ ] TODO: Validation item 1"
      - "[ ] Code review completed"
      - "[ ] Tests passing"
      - "[ ] Documentation updated"

estimated_effort:
  total_story_points: TODO
  estimated_days: TODO

risks:
  - risk: "TODO: Risk description"
    mitigation: "TODO: Mitigation strategy"
    probability: medium
    impact: high
"""

    return yaml_content


def generate_bugfix_cr():
    """Generate bug fix change request."""
    cr_id = get_input("Change Request ID", "CR-001")
    title = get_input("Bug title")
    severity = get_input("Severity (critical/high/medium/low)", "high")

    description = get_multiline("\nBug description")
    impact = get_multiline("Impact")
    research_findings = get_list_input("\nResearch findings")

    yaml_content = f"""change_request:
  id: {cr_id}
  type: bugfix
  title: "{title}"
  severity: {severity}
  priority: high

  description: |
    {description}

  impact: |
    {impact}

  research_findings:
{format_list(research_findings)}

tasks:
  - id: TASK-001
    title: "Investigate and identify root cause"
    type: fullstack
    agent: backend
    complexity: S
    priority: high
    dependencies: []

    description: |
      Investigate the bug and identify the root cause.

    acceptance_criteria:
      - "Root cause identified and documented"
      - "Reproduction steps verified"
      - "Affected code areas identified"

  - id: TASK-002
    title: "Implement fix for {title}"
    type: backend
    agent: backend
    complexity: M
    priority: high
    dependencies: [TASK-001]

    description: |
      Implement the fix for the identified issue.

    acceptance_criteria:
      - "Bug no longer reproducible"
      - "Unit tests added for bug scenario"
      - "Regression tests passing"
      - "No new bugs introduced"

    validation_checklist:
      - "[ ] Fix verified in development"
      - "[ ] Original reproduction steps no longer work"
      - "[ ] Unit tests added"
      - "[ ] Integration tests passing"
      - "[ ] Manual testing completed"

estimated_effort:
  total_story_points: TODO
  estimated_days: TODO
"""

    return yaml_content


def main():
    print("=" * 60)
    print("Product Owner - Change Request Generator")
    print("=" * 60)

    template_type = select_template()

    print(f"\n[Generating {template_type} change request...]")

    if template_type == "feature":
        yaml_content = generate_feature_cr()
    elif template_type == "bugfix":
        yaml_content = generate_bugfix_cr()
    else:
        print(f"Template type '{template_type}' not fully implemented yet.")
        print("Using basic feature template...")
        yaml_content = generate_feature_cr()

    # Get output filename
    default_filename = f"change_request_{datetime.now().strftime('%Y%m%d_%H%M%S')}.yaml"
    filename = get_input("\nOutput filename", default_filename, required=False) or default_filename

    # Write to file
    output_path = Path(filename)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(yaml_content)

    print(f"\n✅ Change request generated: {output_path}")
    print("\nNext steps:")
    print("1. Review and fill in TODO items")
    print("2. Add specific tasks based on your feature")
    print("3. Validate with: python scripts/validate_change_request.py", output_path)
    print("4. Share with development team for estimation")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Generation cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)
