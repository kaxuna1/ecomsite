#!/usr/bin/env python3
"""
Change Request Document Generator
Creates structured change request documents from product owner analysis.
"""

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional


class ChangeRequestGenerator:
    """Generates change request documents following standard format."""

    def __init__(self, output_dir: str = "docs/change-requests"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def generate_cr_id(self) -> str:
        """Generate a unique CR ID based on existing CRs."""
        existing_crs = list(self.output_dir.glob("CR-*.md"))
        if not existing_crs:
            return "CR-001"

        # Extract numbers and find max
        cr_numbers = []
        for cr_file in existing_crs:
            try:
                num = int(cr_file.stem.split("-")[1])
                cr_numbers.append(num)
            except (IndexError, ValueError):
                continue

        next_num = max(cr_numbers, default=0) + 1
        return f"CR-{next_num:03d}"

    def create_change_request(self,
                             title: str,
                             description: str,
                             business_value: str,
                             tasks: List[Dict[str, Any]],
                             stakeholders: Optional[List[str]] = None,
                             risks: Optional[List[str]] = None,
                             success_metrics: Optional[List[str]] = None) -> Dict[str, str]:
        """
        Create a change request document.

        Returns:
            Dict with 'cr_id' and 'file_path' keys
        """
        cr_id = self.generate_cr_id()
        timestamp = datetime.utcnow().isoformat() + "Z"

        # Build the document
        content = f"""# {cr_id}: {title}

**Status:** Draft
**Created:** {timestamp}
**Author:** Product Owner Agent

---

## Executive Summary

{description}

## Business Value

{business_value}

## Stakeholders

"""
        if stakeholders:
            for stakeholder in stakeholders:
                content += f"- {stakeholder}\n"
        else:
            content += "_To be determined_\n"

        content += "\n## Task Breakdown\n\n"

        # Add tasks
        for i, task in enumerate(tasks, 1):
            content += f"### {task['id']}: {task['title']}\n\n"
            content += f"**Type:** {task['type'].title()}  \n"
            content += f"**Status:** {task['status']}  \n"

            if task.get('dependencies'):
                deps = ", ".join(task['dependencies'])
                content += f"**Dependencies:** {deps}  \n"

            content += f"\n**Description:**  \n{task['description']}\n\n"

            if task.get('acceptance_criteria'):
                content += "**Acceptance Criteria:**\n"
                for criterion in task['acceptance_criteria']:
                    content += f"- [ ] {criterion}\n"
                content += "\n"

            if task.get('technical_notes'):
                content += f"**Technical Notes:**  \n{task['technical_notes']}\n\n"

            content += "---\n\n"

        # Add risks section
        content += "## Risks & Considerations\n\n"
        if risks:
            for risk in risks:
                content += f"- {risk}\n"
        else:
            content += "_No significant risks identified_\n"

        content += "\n## Success Metrics\n\n"
        if success_metrics:
            for metric in success_metrics:
                content += f"- {metric}\n"
        else:
            content += "_To be defined by stakeholders_\n"

        # Add timeline estimation
        content += "\n## Estimated Timeline\n\n"
        content += f"**Total Tasks:** {len(tasks)}  \n"

        task_type_counts = {}
        for task in tasks:
            task_type = task['type']
            task_type_counts[task_type] = task_type_counts.get(task_type, 0) + 1

        for task_type, count in task_type_counts.items():
            content += f"**{task_type.title()} Tasks:** {count}  \n"

        content += "\n_Detailed timeline to be determined during sprint planning._\n"

        # Add approval section
        content += "\n## Approval\n\n"
        content += "- [ ] Product Owner\n"
        content += "- [ ] Technical Lead\n"
        content += "- [ ] Stakeholders\n"

        # Write to file
        file_path = self.output_dir / f"{cr_id}.md"
        with open(file_path, 'w') as f:
            f.write(content)

        return {
            "cr_id": cr_id,
            "file_path": str(file_path)
        }

    def update_task_status(self, cr_id: str, task_id: str, status: str) -> None:
        """Update a task's status in the CR document."""
        file_path = self.output_dir / f"{cr_id}.md"
        if not file_path.exists():
            raise FileNotFoundError(f"CR document not found: {cr_id}")

        with open(file_path, 'r') as f:
            content = f.read()

        # Find and replace task status
        # Pattern: **Status:** {old_status}
        import re
        pattern = f"(### {task_id}:.*?\\*\\*Status:\\*\\*)\\s+\\w+"
        replacement = f"\\1 {status}"

        updated_content = re.sub(pattern, replacement, content, flags=re.DOTALL)

        with open(file_path, 'w') as f:
            f.write(updated_content)

    def update_cr_status(self, cr_id: str, status: str) -> None:
        """Update the overall CR status."""
        file_path = self.output_dir / f"{cr_id}.md"
        if not file_path.exists():
            raise FileNotFoundError(f"CR document not found: {cr_id}")

        with open(file_path, 'r') as f:
            content = f.read()

        # Replace status line
        import re
        pattern = r"\*\*Status:\*\*\s+\w+"
        replacement = f"**Status:** {status}"

        updated_content = re.sub(pattern, replacement, content, count=1)

        with open(file_path, 'w') as f:
            f.write(updated_content)

    def add_approval(self, cr_id: str, approver: str) -> None:
        """Mark an approver as approved in the CR document."""
        file_path = self.output_dir / f"{cr_id}.md"
        if not file_path.exists():
            raise FileNotFoundError(f"CR document not found: {cr_id}")

        with open(file_path, 'r') as f:
            content = f.read()

        # Find and replace approval checkbox
        import re
        pattern = f"- \\[ \\] {approver}"
        replacement = f"- [x] {approver}"

        updated_content = content.replace(pattern, replacement)

        with open(file_path, 'w') as f:
            f.write(updated_content)


def main():
    """CLI interface for CR generation."""
    import sys
    import argparse

    parser = argparse.ArgumentParser(description="Change Request Generator")
    parser.add_argument("command", choices=["create", "update-status", "approve"])
    parser.add_argument("--title", help="CR title")
    parser.add_argument("--description", help="CR description")
    parser.add_argument("--business-value", help="Business value statement")
    parser.add_argument("--tasks-json", help="Path to JSON file with tasks")
    parser.add_argument("--cr-id", help="CR ID for updates")
    parser.add_argument("--task-id", help="Task ID for status update")
    parser.add_argument("--status", help="New status")
    parser.add_argument("--approver", help="Approver name")
    parser.add_argument("--output-dir", default="docs/change-requests",
                       help="Output directory for CR documents")

    args = parser.parse_args()

    generator = ChangeRequestGenerator(args.output_dir)

    if args.command == "create":
        if not all([args.title, args.description, args.business_value, args.tasks_json]):
            print("Error: --title, --description, --business-value, --tasks-json required",
                  file=sys.stderr)
            sys.exit(1)

        with open(args.tasks_json, 'r') as f:
            tasks_data = json.load(f)

        result = generator.create_change_request(
            title=args.title,
            description=args.description,
            business_value=args.business_value,
            tasks=tasks_data.get("tasks", []),
            stakeholders=tasks_data.get("stakeholders"),
            risks=tasks_data.get("risks"),
            success_metrics=tasks_data.get("success_metrics")
        )

        print(json.dumps(result, indent=2))

    elif args.command == "update-status":
        if args.task_id:
            if not all([args.cr_id, args.task_id, args.status]):
                print("Error: --cr-id, --task-id, --status required", file=sys.stderr)
                sys.exit(1)
            generator.update_task_status(args.cr_id, args.task_id, args.status)
            print(f"Updated task {args.task_id} status to {args.status}")
        else:
            if not all([args.cr_id, args.status]):
                print("Error: --cr-id, --status required", file=sys.stderr)
                sys.exit(1)
            generator.update_cr_status(args.cr_id, args.status)
            print(f"Updated CR {args.cr_id} status to {args.status}")

    elif args.command == "approve":
        if not all([args.cr_id, args.approver]):
            print("Error: --cr-id, --approver required", file=sys.stderr)
            sys.exit(1)
        generator.add_approval(args.cr_id, args.approver)
        print(f"Added approval from {args.approver} to {args.cr_id}")


if __name__ == "__main__":
    main()
