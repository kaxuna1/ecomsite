#!/usr/bin/env python3
"""
Task Manager - Core task CRUD operations for the task-tracker skill.
Manages task state, dependencies, and persistence in JSON format.
"""

import json
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any
from enum import Enum


class TaskStatus(str, Enum):
    """Task status values"""
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    BLOCKED = "blocked"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class TaskPriority(str, Enum):
    """Task priority levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class TaskManager:
    """Manages tasks in a JSON-based storage system"""

    def __init__(self, storage_path: str = ".claude/tasks/active-sprint.json"):
        self.storage_path = Path(storage_path)
        self.storage_path.parent.mkdir(parents=True, exist_ok=True)
        self.tasks = self._load_tasks()

    def _load_tasks(self) -> Dict[str, Any]:
        """Load tasks from JSON storage"""
        if self.storage_path.exists():
            with open(self.storage_path, 'r') as f:
                return json.load(f)
        return {
            "sprint": {
                "id": "sprint-1",
                "name": "Active Sprint",
                "created": datetime.now().isoformat()
            },
            "tasks": {}
        }

    def _save_tasks(self) -> None:
        """Save tasks to JSON storage"""
        with open(self.storage_path, 'w') as f:
            json.dump(self.tasks, f, indent=2)

    def create_task(
        self,
        task_id: str,
        title: str,
        description: str = "",
        assignee: Optional[str] = None,
        priority: TaskPriority = TaskPriority.MEDIUM,
        estimate: Optional[int] = None,
        tags: Optional[List[str]] = None,
        dependencies: Optional[List[str]] = None,
        due_date: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a new task"""
        if task_id in self.tasks["tasks"]:
            raise ValueError(f"Task {task_id} already exists")

        task = {
            "id": task_id,
            "title": title,
            "description": description,
            "status": TaskStatus.TODO,
            "created": datetime.now().isoformat(),
            "updated": datetime.now().isoformat(),
            "assignee": assignee,
            "priority": priority,
            "estimate": estimate,
            "tags": tags or [],
            "dependencies": dependencies or [],
            "blockers": [],
            "due_date": due_date,
            "completed_at": None
        }

        self.tasks["tasks"][task_id] = task
        self._save_tasks()
        return task

    def get_task(self, task_id: str) -> Optional[Dict[str, Any]]:
        """Get a task by ID"""
        return self.tasks["tasks"].get(task_id)

    def update_task(self, task_id: str, **updates) -> Dict[str, Any]:
        """Update task properties"""
        if task_id not in self.tasks["tasks"]:
            raise ValueError(f"Task {task_id} not found")

        task = self.tasks["tasks"][task_id]
        task.update(updates)
        task["updated"] = datetime.now().isoformat()
        self._save_tasks()
        return task

    def start_task(self, task_id: str) -> Dict[str, Any]:
        """Mark a task as in progress"""
        return self.update_task(task_id, status=TaskStatus.IN_PROGRESS)

    def complete_task(self, task_id: str) -> Dict[str, Any]:
        """Mark a task as completed"""
        return self.update_task(
            task_id,
            status=TaskStatus.COMPLETED,
            completed_at=datetime.now().isoformat()
        )

    def block_task(self, task_id: str, reason: str) -> Dict[str, Any]:
        """Mark a task as blocked"""
        task = self.get_task(task_id)
        if not task:
            raise ValueError(f"Task {task_id} not found")

        blocker = {
            "reason": reason,
            "created": datetime.now().isoformat()
        }
        task["blockers"].append(blocker)
        return self.update_task(task_id, status=TaskStatus.BLOCKED)

    def unblock_task(self, task_id: str) -> Dict[str, Any]:
        """Remove block status from a task"""
        return self.update_task(task_id, status=TaskStatus.TODO)

    def add_dependency(self, task_id: str, depends_on: str) -> Dict[str, Any]:
        """Add a dependency to a task"""
        task = self.get_task(task_id)
        if not task:
            raise ValueError(f"Task {task_id} not found")

        if depends_on not in task["dependencies"]:
            task["dependencies"].append(depends_on)
            self._save_tasks()
        return task

    def get_all_tasks(self) -> Dict[str, Dict[str, Any]]:
        """Get all tasks"""
        return self.tasks["tasks"]

    def get_tasks_by_status(self, status: TaskStatus) -> List[Dict[str, Any]]:
        """Get all tasks with a specific status"""
        return [
            task for task in self.tasks["tasks"].values()
            if task["status"] == status
        ]

    def get_blocked_tasks(self) -> List[Dict[str, Any]]:
        """Get all blocked tasks"""
        return self.get_tasks_by_status(TaskStatus.BLOCKED)

    def can_start_task(self, task_id: str) -> tuple[bool, Optional[str]]:
        """Check if a task can be started (all dependencies completed)"""
        task = self.get_task(task_id)
        if not task:
            return False, f"Task {task_id} not found"

        for dep_id in task["dependencies"]:
            dep_task = self.get_task(dep_id)
            if not dep_task:
                return False, f"Dependency {dep_id} not found"
            if dep_task["status"] != TaskStatus.COMPLETED:
                return False, f"Dependency {dep_id} is not completed (status: {dep_task['status']})"

        return True, None

    def generate_board_view(self) -> str:
        """Generate a sprint board view"""
        output = []
        output.append("=" * 80)
        output.append(f"📋 {self.tasks['sprint']['name']} - {self.tasks['sprint']['id']}")
        output.append("=" * 80)
        output.append("")

        # Group tasks by status
        status_groups = {
            TaskStatus.TODO: "📝 TODO",
            TaskStatus.IN_PROGRESS: "🔄 IN PROGRESS",
            TaskStatus.BLOCKED: "🚫 BLOCKED",
            TaskStatus.COMPLETED: "✅ COMPLETED"
        }

        for status, header in status_groups.items():
            tasks = self.get_tasks_by_status(status)
            output.append(f"\n{header} ({len(tasks)})")
            output.append("-" * 80)

            if not tasks:
                output.append("  (no tasks)")
            else:
                for task in tasks:
                    priority_emoji = {
                        TaskPriority.LOW: "🔵",
                        TaskPriority.MEDIUM: "🟡",
                        TaskPriority.HIGH: "🟠",
                        TaskPriority.CRITICAL: "🔴"
                    }.get(task["priority"], "⚪")

                    line = f"  {priority_emoji} {task['id']}: {task['title']}"
                    if task["assignee"]:
                        line += f" [@{task['assignee']}]"
                    if task["estimate"]:
                        line += f" [{task['estimate']}h]"
                    output.append(line)

                    if task["dependencies"]:
                        output.append(f"     ↳ Depends on: {', '.join(task['dependencies'])}")
                    if task["blockers"]:
                        output.append(f"     ⚠️  Blocked: {task['blockers'][-1]['reason']}")
                    if task["tags"]:
                        output.append(f"     🏷️  Tags: {', '.join(task['tags'])}")

        output.append("\n" + "=" * 80)
        return "\n".join(output)


def main():
    """CLI interface for task manager"""
    if len(sys.argv) < 2:
        print("Usage: task_manager.py <command> [args...]")
        print("\nCommands:")
        print("  create <id> <title> [--description] [--assignee] [--priority] [--estimate] [--tags] [--dependencies] [--due-date]")
        print("  start <id>")
        print("  complete <id>")
        print("  block <id> <reason>")
        print("  unblock <id>")
        print("  show-status")
        print("  get <id>")
        sys.exit(1)

    command = sys.argv[1]
    manager = TaskManager()

    try:
        if command == "create":
            task_id = sys.argv[2]
            title = sys.argv[3]
            # Parse optional arguments
            kwargs = {}
            i = 4
            while i < len(sys.argv):
                if sys.argv[i].startswith("--"):
                    key = sys.argv[i][2:].replace("-", "_")
                    if i + 1 < len(sys.argv):
                        value = sys.argv[i + 1]
                        # Handle list values
                        if key in ["tags", "dependencies"]:
                            value = value.split(",")
                        elif key == "estimate":
                            value = int(value)
                        elif key == "priority":
                            value = TaskPriority(value)
                        kwargs[key] = value
                        i += 2
                    else:
                        i += 1
                else:
                    i += 1

            task = manager.create_task(task_id, title, **kwargs)
            print(f"✅ Created task {task['id']}: {task['title']}")

        elif command == "start":
            task_id = sys.argv[2]
            can_start, reason = manager.can_start_task(task_id)
            if not can_start:
                print(f"❌ Cannot start task: {reason}")
                sys.exit(1)
            task = manager.start_task(task_id)
            print(f"🔄 Started task {task['id']}: {task['title']}")

        elif command == "complete":
            task_id = sys.argv[2]
            task = manager.complete_task(task_id)
            print(f"✅ Completed task {task['id']}: {task['title']}")

        elif command == "block":
            task_id = sys.argv[2]
            reason = " ".join(sys.argv[3:])
            task = manager.block_task(task_id, reason)
            print(f"🚫 Blocked task {task['id']}: {reason}")

        elif command == "unblock":
            task_id = sys.argv[2]
            task = manager.unblock_task(task_id)
            print(f"✅ Unblocked task {task['id']}")

        elif command == "show-status":
            print(manager.generate_board_view())

        elif command == "get":
            task_id = sys.argv[2]
            task = manager.get_task(task_id)
            if task:
                print(json.dumps(task, indent=2))
            else:
                print(f"❌ Task {task_id} not found")
                sys.exit(1)

        else:
            print(f"❌ Unknown command: {command}")
            sys.exit(1)

    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
