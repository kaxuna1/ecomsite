#!/usr/bin/env python3
"""
Task Orchestration Engine
Determines which tasks can run in parallel and generates execution plan.
"""

import json
from typing import Dict, List, Set, Tuple, Any
from collections import defaultdict


class TaskOrchestrator:
    """Orchestrates task execution with dependency management and parallelization."""

    def __init__(self, tasks: List[Dict[str, Any]]):
        self.tasks = {task["id"]: task for task in tasks}
        self.dependency_graph = self._build_dependency_graph()

    def _build_dependency_graph(self) -> Dict[str, List[str]]:
        """Build a dependency graph from tasks."""
        graph = defaultdict(list)
        for task_id, task in self.tasks.items():
            for dep_id in task.get("dependencies", []):
                graph[dep_id].append(task_id)
        return dict(graph)

    def get_execution_waves(self) -> List[List[str]]:
        """
        Generate execution waves (batches of tasks that can run in parallel).
        Returns a list of lists, where each inner list contains task IDs that can run concurrently.
        """
        waves = []
        completed = set()
        pending = set(task_id for task_id, task in self.tasks.items() if task["status"] == "pending")

        while pending:
            # Find tasks with all dependencies completed
            ready = []
            for task_id in pending:
                deps = set(self.tasks[task_id].get("dependencies", []))
                if deps.issubset(completed):
                    ready.append(task_id)

            if not ready:
                # Circular dependency or blocked tasks
                raise ValueError(f"Circular dependency or blocked tasks detected: {pending}")

            waves.append(ready)
            completed.update(ready)
            pending -= set(ready)

        return waves

    def group_by_agent_type(self, task_ids: List[str]) -> Dict[str, List[str]]:
        """Group tasks by the agent type they require."""
        grouped = defaultdict(list)
        for task_id in task_ids:
            task = self.tasks[task_id]
            task_type = task["type"]

            if task_type == "frontend":
                grouped["frontend-developer-agent"].append(task_id)
            elif task_type == "backend":
                grouped["backend-developer-agent"].append(task_id)
            elif task_type == "fullstack":
                # Fullstack requires both agents
                grouped["frontend-developer-agent"].append(task_id)
                grouped["backend-developer-agent"].append(task_id)
            elif task_type == "qa":
                grouped["qa-validator-agent"].append(task_id)
            elif task_type == "docs":
                grouped["documentation-agent"].append(task_id)
            else:
                grouped["general-purpose"].append(task_id)

        return dict(grouped)

    def can_parallelize(self, task_ids: List[str]) -> bool:
        """Check if tasks can be executed in parallel (no dependencies between them)."""
        task_id_set = set(task_ids)

        for task_id in task_ids:
            deps = set(self.tasks[task_id].get("dependencies", []))
            if deps.intersection(task_id_set):
                return False

        return True

    def get_task_chain(self, task_id: str) -> List[str]:
        """Get the chain of dependencies for a task."""
        chain = []
        visited = set()

        def visit(tid: str):
            if tid in visited:
                return
            visited.add(tid)

            for dep_id in self.tasks[tid].get("dependencies", []):
                visit(dep_id)

            chain.append(tid)

        visit(task_id)
        return chain

    def estimate_completion_time(self, task_id: str,
                                 estimates: Dict[str, int] = None) -> int:
        """
        Estimate completion time for a task considering parallel execution.
        estimates: dict of task_id -> estimated_hours
        """
        if estimates is None:
            # Default estimates by type
            default_estimates = {
                "frontend": 4,
                "backend": 6,
                "fullstack": 8,
                "qa": 2,
                "docs": 1
            }
            estimates = {
                tid: default_estimates.get(task["type"], 4)
                for tid, task in self.tasks.items()
            }

        chain = self.get_task_chain(task_id)
        waves = self._get_waves_for_chain(chain)

        total_time = 0
        for wave in waves:
            # Time for a wave is the max time of any task in that wave
            wave_time = max(estimates.get(tid, 4) for tid in wave)
            total_time += wave_time

        return total_time

    def _get_waves_for_chain(self, chain: List[str]) -> List[List[str]]:
        """Get execution waves for a specific chain of tasks."""
        waves = []
        completed = set()
        pending = set(chain)

        while pending:
            ready = []
            for task_id in pending:
                deps = set(self.tasks[task_id].get("dependencies", []))
                if deps.issubset(completed):
                    ready.append(task_id)

            if not ready:
                break

            waves.append(ready)
            completed.update(ready)
            pending -= set(ready)

        return waves

    def generate_execution_plan(self) -> Dict[str, Any]:
        """Generate a complete execution plan with waves and agent assignments."""
        waves = self.get_execution_waves()

        plan = {
            "total_waves": len(waves),
            "total_tasks": len(self.tasks),
            "waves": []
        }

        for i, wave_task_ids in enumerate(waves, 1):
            agent_groups = self.group_by_agent_type(wave_task_ids)
            can_parallel = self.can_parallelize(wave_task_ids)

            wave_info = {
                "wave_number": i,
                "task_count": len(wave_task_ids),
                "can_parallelize": can_parallel,
                "tasks": wave_task_ids,
                "agent_assignments": agent_groups
            }

            plan["waves"].append(wave_info)

        return plan


def main():
    """CLI interface for task orchestration."""
    import sys
    import argparse
    from pathlib import Path

    parser = argparse.ArgumentParser(description="Task Orchestration Engine")
    parser.add_argument("command", choices=["plan", "waves", "estimate"])
    parser.add_argument("--state-file", default=".claude/state/workflow-state.json",
                       help="Path to workflow state file")
    parser.add_argument("--task-id", help="Specific task ID for estimation")

    args = parser.parse_args()

    state_path = Path(args.state_file)
    if not state_path.exists():
        print(f"Error: State file not found: {args.state_file}", file=sys.stderr)
        sys.exit(1)

    with open(state_path, 'r') as f:
        state = json.load(f)

    orchestrator = TaskOrchestrator(state["tasks"])

    if args.command == "plan":
        plan = orchestrator.generate_execution_plan()
        print(json.dumps(plan, indent=2))

    elif args.command == "waves":
        waves = orchestrator.get_execution_waves()
        output = {"waves": waves, "total_waves": len(waves)}
        print(json.dumps(output, indent=2))

    elif args.command == "estimate":
        if not args.task_id:
            print("Error: --task-id required for estimate", file=sys.stderr)
            sys.exit(1)
        estimated_hours = orchestrator.estimate_completion_time(args.task_id)
        print(json.dumps({"task_id": args.task_id, "estimated_hours": estimated_hours}, indent=2))


if __name__ == "__main__":
    main()
