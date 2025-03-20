"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TaskEditor from "./TaskEditor";
import { TaskStatus } from "../../types/taskstatus";
import { Task } from "../../types/task";
import { useTasks } from "../../hooks/useTasks";
import { User } from "@auth/core/types";

export default function Dashboard() {
  const router = useRouter();
  const {
    tasks,
    totalPages,
    isLoading,
    error,
    page,
    limit,
    setPage,
    setLimit,
    reloadTasks,
    showDeleted,
    setShowDeleted,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
  } = useTasks();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.push("/");
      return;
    }

    setUser(JSON.parse(userData));
  }, [router]);

  const deleteTaskToggle = async (taskId: string) => {
    const task = tasks.find((task) => task.id === taskId);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks/${taskId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then(() => {
        reloadTasks();
      })
      .catch((err) => {
        console.error("Error deleting task:", err);
        alert("Error deleting task. Please try again.");
      });
  };

  function sortTableBy(column: string) {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
      setPage(1);
    }
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!user) {
    return <div>User not found</div>;
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <h1 className="text-2xl font-bold">My Tasks</h1>
        <div className="flex justify-end">
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded-md"
            onClick={() =>
              setSelectedTask({
                id: null,
                title: "",
                description: "",
                status: TaskStatus.TODO,
                dueDate: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
                taskHistory: [],
              })
            }
          >
            Add Task
          </button>
        </div>
      </div>

      <div className="mb-4 flex justify-end">
        <button
          className={`bg-blue-500 text-white px-4 py-2 rounded-md ${
            page === 1 ? "opacity-50 cursor-not-allowed" : ""
          }`}
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
        >
          Previous
        </button>
        <span className="mx-4">
          {page}/{Math.max(totalPages, 1)}
        </span>
        <button
          className={`bg-blue-500 text-white px-4 py-2 rounded-md ${
            page === Math.max(totalPages, 1)
              ? "opacity-50 cursor-not-allowed"
              : ""
          }`}
          onClick={() => setPage(page + 1)}
          disabled={page === Math.max(totalPages, 1)}
        >
          Next
        </button>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">
              <button
                onClick={() => {
                  sortTableBy("title");
                }}
              >
                Title
                {sortBy === "title" && (sortOrder === "asc" ? "↑" : "↓")}
              </button>
            </th>
            <th className="border p-2 text-left">
              <button
                onClick={() => {
                  sortTableBy("status");
                }}
              >
                Status
                {sortBy === "status" && (sortOrder === "asc" ? "↑" : "↓")}
              </button>
            </th>
            <th className="border p-2 text-left">
              <button
                onClick={() => {
                  sortTableBy("dueDate");
                }}
              >
                Due Date
                {sortBy === "dueDate" && (sortOrder === "asc" ? "↑" : "↓")}
              </button>
            </th>
            <th className="border p-2 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id} className="hover:bg-gray-50">
              <td
                className="border p-2 cursor-pointer"
                onClick={() => setSelectedTask(task)}
              >
                {task.title}
              </td>
              <td className="border p-2">{task.status}</td>
              <td className="border p-2">
                {new Date(task.dueDate).toLocaleDateString()}
              </td>
              <td className="border p-2 text-center">
                <a
                  href="#"
                  className={`text-red-500 font-bold ${
                    task.deletedAt ? "opacity-50" : ""
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Handle delete functionality here
                    if (
                      task.id !== null &&
                      confirm("Are you sure you want to delete this task?")
                    ) {
                      deleteTaskToggle(task.id);
                    }
                  }}
                >
                  X
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 mb-4 flex justify-end">
        <button
          className={`bg-blue-500 text-white px-4 py-2 rounded-md ${
            showDeleted ? "bg-green-500" : ""
          }`}
          onClick={() => setShowDeleted(!showDeleted)}
        >
          Show Deleted Tasks
        </button>
      </div>

      <TaskEditor
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onSave={reloadTasks}
      />
    </>
  );
}
