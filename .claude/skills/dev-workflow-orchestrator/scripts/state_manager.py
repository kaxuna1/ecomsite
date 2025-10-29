#!/usr/bin/env python3
"""
Workflow State Manager
Handles reading, writing, and updating workflow state for the dev-workflow-orchestrator skill.
"""

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any


class WorkflowStateManager:
    """Manages workflow state persistence and operations."""

    def __init__(self, state_file: str = ".claude/state/workflow-state.json"):
        self.state_file = Path(state_file)
        self._ensure_state_directory()

    def _ensure_state_directory(self) -> None:
        """Ensure the state directory exists."""
        self.state_file.parent.mkdir(parents=True, exist_ok=True)

    def initialize_workflow(self, cr_id: str, description: str) -> Dict[str, Any]:
        """Initialize a new workflow state."""
        state = {
            "current_cr": cr_id,
            "description": description,
            "phase": "planning",
            "created_at": datetime.utcnow().isoformat() + "Z",
            "updated_at": datetime.utcnow().isoformat() + "Z",
            "tasks": [],
            "history": []
        }
        self.save_state(state)
        return state

    def load_state(self) -> Optional[Dict[str, Any]]:
        """Load the current workflow state."""
        if not self.state_file.exists():
            return None

        with open(self.state_file, 'r') as f:
            return json.load(f)

    def save_state(self, state: Dict[str, Any]) -> None:
        """Save the workflow state."""
        state["updated_at"] = datetime.utcnow().isoformat() + "Z"

        with open(self.state_file, 'w') as f:
            json.dump(state, f, indent=2)

    def add_task(self, task_id: str, task_type: str, title: str,
                 description: str, acceptance_criteria: List[str],
                 dependencies: Optional[List[str]] = None) -> Dict[str, Any]:
        """Add a new task to the workflow."""
        state = self.load_state()
        if not state:
            raise ValueError("No active workflow. Initialize workflow first.")

        task = {
            "id": task_id,
            "type": task_type,
            "title": title,
            "description": description,
            "acceptance_criteria": acceptance_criteria,
            "dependencies": dependencies or [],
            "status": "pending",
            "assigned_to": None,
            "started_at": None,
            "completed_at": None,
            "qa_status": None,
            "qa_feedback": None
        }

        state["tasks"].append(task)
        self.save_state(state)
        return task

    def update_task_status(self, task_id: str, status: str,
                          assigned_to: Optional[str] = None) -> None:
        """Update task status and optionally assign to an agent."""
        state = self.load_state()
        if not state:
            raise ValueError("No active workflow state found.")

        for task in state["tasks"]:
            if task["id"] == task_id:
                task["status"] = status

                if status == "in_progress" and not task["started_at"]:
                    task["started_at"] = datetime.utcnow().isoformat() + "Z"
                elif status == "completed":
                    task["completed_at"] = datetime.utcnow().isoformat() + "Z"

                if assigned_to:
                    task["assigned_to"] = assigned_to

                # Add to history
                state["history"].append({
                    "timestamp": datetime.utcnow().isoformat() + "Z",
                    "task_id": task_id,
                    "event": "status_change",
                    "old_status": task.get("status"),
                    "new_status": status
                })

                self.save_state(state)
                return

        raise ValueError(f"Task {task_id} not found.")

    def update_qa_status(self, task_id: str, qa_status: str,
                        feedback: Optional[str] = None) -> None:
        """Update QA validation status for a task."""
        state = self.load_state()
        if not state:
            raise ValueError("No active workflow state found.")

        for task in state["tasks"]:
            if task["id"] == task_id:
                task["qa_status"] = qa_status
                task["qa_feedback"] = feedback

                # If changes requested, reset task to in_progress
                if qa_status == "CHANGES_REQUESTED":
                    task["status"] = "in_progress"
                    task["completed_at"] = None

                state["history"].append({
                    "timestamp": datetime.utcnow().isoformat() + "Z",
                    "task_id": task_id,
                    "event": "qa_validation",
                    "qa_status": qa_status,
                    "feedback": feedback
                })

                self.save_state(state)
                return

        raise ValueError(f"Task {task_id} not found.")

    def set_phase(self, phase: str) -> None:
        """Update the current workflow phase."""
        state = self.load_state()
        if not state:
            raise ValueError("No active workflow state found.")

        old_phase = state.get("phase")
        state["phase"] = phase

        state["history"].append({
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "event": "phase_change",
            "old_phase": old_phase,
            "new_phase": phase
        })

        self.save_state(state)

    def get_ready_tasks(self) -> List[Dict[str, Any]]:
        """Get tasks that are ready to be executed (dependencies met)."""
        state = self.load_state()
        if not state:
            return []

        completed_task_ids = {t["id"] for t in state["tasks"] if t["status"] == "completed"}

        ready_tasks = []
        for task in state["tasks"]:
            if task["status"] == "pending":
                # Check if all dependencies are completed
                deps_met = all(dep_id in completed_task_ids for dep_id in task.get("dependencies", []))
                if deps_met:
                    ready_tasks.append(task)

        return ready_tasks

    def get_task(self, task_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific task by ID."""
        state = self.load_state()
        if not state:
            return None

        for task in state["tasks"]:
            if task["id"] == task_id:
                return task

        return None

    def get_status_summary(self) -> Dict[str, Any]:
        """Get a summary of the current workflow status."""
        state = self.load_state()
        if not state:
            return {"status": "no_active_workflow"}

        task_counts = {
            "pending": 0,
            "in_progress": 0,
            "completed": 0,
            "qa_pending": 0,
            "changes_requested": 0
        }

        for task in state["tasks"]:
            task_counts[task["status"]] += 1
            if task["status"] == "completed" and not task.get("qa_status"):
                task_counts["qa_pending"] += 1
            if task.get("qa_status") == "CHANGES_REQUESTED":
                task_counts["changes_requested"] += 1

        return {
            "current_cr": state["current_cr"],
            "phase": state["phase"],
            "total_tasks": len(state["tasks"]),
            "task_counts": task_counts,
            "created_at": state["created_at"],
            "updated_at": state["updated_at"]
        }

    def clear_workflow(self) -> None:
        """Clear the current workflow state."""
        if self.state_file.exists():
            os.remove(self.state_file)


def main():
    """CLI interface for state management."""
    import sys
    import argparse

    parser = argparse.ArgumentParser(description="Workflow State Manager")
    parser.add_argument("command", choices=["init", "status", "add-task", "update", "clear"])
    parser.add_argument("--cr-id", help="Change request ID")
    parser.add_argument("--description", help="Workflow description")
    parser.add_argument("--task-id", help="Task ID")
    parser.add_argument("--task-type", choices=["frontend", "backend", "fullstack", "qa", "docs"])
    parser.add_argument("--title", help="Task title")
    parser.add_argument("--task-description", help="Task description")
    parser.add_argument("--status", help="Task status")
    parser.add_argument("--assigned-to", help="Agent assigned to task")

    args = parser.parse_args()

    manager = WorkflowStateManager()

    if args.command == "init":
        if not args.cr_id or not args.description:
            print("Error: --cr-id and --description required for init", file=sys.stderr)
            sys.exit(1)
        state = manager.initialize_workflow(args.cr_id, args.description)
        print(json.dumps(state, indent=2))

    elif args.command == "status":
        summary = manager.get_status_summary()
        print(json.dumps(summary, indent=2))

    elif args.command == "add-task":
        if not all([args.task_id, args.task_type, args.title, args.task_description]):
            print("Error: --task-id, --task-type, --title, --task-description required", file=sys.stderr)
            sys.exit(1)
        task = manager.add_task(
            args.task_id,
            args.task_type,
            args.title,
            args.task_description,
            []  # Acceptance criteria can be added via direct state manipulation
        )
        print(json.dumps(task, indent=2))

    elif args.command == "update":
        if not args.task_id or not args.status:
            print("Error: --task-id and --status required for update", file=sys.stderr)
            sys.exit(1)
        manager.update_task_status(args.task_id, args.status, args.assigned_to)
        print(f"Task {args.task_id} updated to {args.status}")

    elif args.command == "clear":
        manager.clear_workflow()
        print("Workflow state cleared")


if __name__ == "__main__":
    main()
