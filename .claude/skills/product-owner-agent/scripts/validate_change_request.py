#!/usr/bin/env python3
"""
Validate a change request YAML file.

Usage:
    python validate_change_request.py <path-to-yaml-file>

Checks:
- YAML syntax validity
- Required fields present
- Valid values for enum fields
- Task dependencies exist
- Complexity values valid
- No duplicate task IDs
"""

import sys
import yaml
from pathlib import Path


class ValidationError(Exception):
    """Custom validation error."""
    pass


def validate_required_fields(data, required_fields, path=""):
    """Validate that required fields are present."""
    errors = []

    for field in required_fields:
        if field not in data:
            errors.append(f"Missing required field: {path}.{field}")
        elif isinstance(data[field], str) and data[field].strip().startswith("TODO"):
            errors.append(f"TODO found in required field: {path}.{field}")

    return errors


def validate_change_request(cr):
    """Validate change request structure."""
    errors = []

    # Required fields
    required = ["id", "type", "title", "description", "business_value", "research_findings"]
    errors.extend(validate_required_fields(cr, required, "change_request"))

    # Valid types
    valid_types = ["feature", "bugfix", "refactor", "technical_debt"]
    if "type" in cr and cr["type"] not in valid_types:
        errors.append(f"Invalid type '{cr['type']}'. Must be one of: {valid_types}")

    # Research findings should be a list
    if "research_findings" in cr:
        if not isinstance(cr["research_findings"], list):
            errors.append("research_findings must be a list")
        elif len(cr["research_findings"]) == 0:
            errors.append("research_findings cannot be empty")

    return errors


def validate_task(task, all_task_ids, index):
    """Validate a single task."""
    errors = []

    # Required fields
    required = ["id", "title", "type", "agent", "complexity", "priority", "description", "acceptance_criteria"]
    errors.extend(validate_required_fields(task, required, f"tasks[{index}]"))

    # Valid types
    valid_types = ["frontend", "backend", "database", "devops", "fullstack"]
    if "type" in task and task["type"] not in valid_types:
        errors.append(f"Task {task.get('id', index)}: Invalid type '{task['type']}'. Must be one of: {valid_types}")

    # Valid agents
    valid_agents = ["frontend", "backend", "database", "devops"]
    if "agent" in task and task["agent"] not in valid_agents:
        errors.append(f"Task {task.get('id', index)}: Invalid agent '{task['agent']}'. Must be one of: {valid_agents}")

    # Valid complexity
    valid_complexity = ["S", "M", "L"]
    if "complexity" in task and task["complexity"] not in valid_complexity:
        errors.append(f"Task {task.get('id', index)}: Invalid complexity '{task['complexity']}'. Must be one of: {valid_complexity}")

    # Valid priority
    valid_priority = ["high", "medium", "low"]
    if "priority" in task and task["priority"] not in valid_priority:
        errors.append(f"Task {task.get('id', index)}: Invalid priority '{task['priority']}'. Must be one of: {valid_priority}")

    # Acceptance criteria should be a list
    if "acceptance_criteria" in task:
        if not isinstance(task["acceptance_criteria"], list):
            errors.append(f"Task {task.get('id', index)}: acceptance_criteria must be a list")
        elif len(task["acceptance_criteria"]) == 0:
            errors.append(f"Task {task.get('id', index)}: acceptance_criteria cannot be empty")

    # Validate dependencies exist
    if "dependencies" in task and isinstance(task["dependencies"], list):
        for dep in task["dependencies"]:
            if dep not in all_task_ids:
                errors.append(f"Task {task.get('id', index)}: Dependency '{dep}' does not exist")

    return errors


def validate_tasks(tasks):
    """Validate all tasks."""
    errors = []

    if not tasks:
        errors.append("No tasks defined")
        return errors

    if not isinstance(tasks, list):
        errors.append("tasks must be a list")
        return errors

    # Collect all task IDs
    task_ids = set()
    duplicate_ids = set()

    for i, task in enumerate(tasks):
        if not isinstance(task, dict):
            errors.append(f"Task at index {i} is not a dictionary")
            continue

        task_id = task.get("id")
        if task_id:
            if task_id in task_ids:
                duplicate_ids.add(task_id)
            task_ids.add(task_id)

    # Report duplicates
    if duplicate_ids:
        errors.append(f"Duplicate task IDs found: {', '.join(duplicate_ids)}")

    # Validate each task
    for i, task in enumerate(tasks):
        if isinstance(task, dict):
            errors.extend(validate_task(task, task_ids, i))

    return errors


def validate_yaml_file(file_path):
    """Validate a change request YAML file."""
    errors = []

    # Check file exists
    path = Path(file_path)
    if not path.exists():
        return [f"File not found: {file_path}"]

    # Load YAML
    try:
        with open(path, "r") as f:
            data = yaml.safe_load(f)
    except yaml.YAMLError as e:
        return [f"Invalid YAML syntax: {e}"]

    if not isinstance(data, dict):
        return ["YAML file must contain a dictionary"]

    # Validate structure
    if "change_request" not in data:
        errors.append("Missing top-level 'change_request' key")
    else:
        errors.extend(validate_change_request(data["change_request"]))

    if "tasks" not in data:
        errors.append("Missing top-level 'tasks' key")
    else:
        errors.extend(validate_tasks(data["tasks"]))

    return errors


def print_summary(errors, warnings):
    """Print validation summary."""
    print("\n" + "=" * 60)

    if not errors and not warnings:
        print("✅ Validation passed!")
        print("\nChange request is valid and ready to use.")
    else:
        if errors:
            print(f"❌ {len(errors)} error(s) found:")
            for error in errors:
                print(f"  • {error}")

        if warnings:
            print(f"\n⚠️  {len(warnings)} warning(s):")
            for warning in warnings:
                print(f"  • {warning}")

        print("\nPlease fix the issues above before proceeding.")

    print("=" * 60)


def main():
    if len(sys.argv) < 2:
        print("Usage: python validate_change_request.py <path-to-yaml-file>")
        sys.exit(1)

    file_path = sys.argv[1]

    print(f"Validating: {file_path}")
    print("=" * 60)

    errors = validate_yaml_file(file_path)

    # Separate warnings from errors (warnings are for TODOs)
    warnings = [e for e in errors if "TODO" in e]
    errors = [e for e in errors if "TODO" not in e]

    print_summary(errors, warnings)

    # Exit with error code if errors found
    if errors:
        sys.exit(1)


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
