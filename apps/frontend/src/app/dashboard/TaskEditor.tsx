"use client";

import { useState } from "react";
import { Task } from "../../types/task";
import { TaskStatus } from "../../types/taskstatus";

/**
 * Returns a text description of the difference between the previous task and the history task
 * @param prevTask - The previous task
 * @param history - The history task
 * @returns A text description of the difference between the previous task and the history task
 */
const diffText = (prevTask: Task, history: Task) => {
  // Initialize an array to store the changes
  const changes: string[] = [];

  // Compare title
  if (prevTask.title !== history.title) {
    changes.push(
      `Title changed from "${history.title}" to "${prevTask.title}"`,
    );
  }

  // Compare description
  if (prevTask.description !== history.description) {
    if (!history.description && prevTask.description) {
      changes.push(`Description added: "${prevTask.description}"`);
    } else if (history.description && !prevTask.description) {
      changes.push(`Description removed`);
    } else {
      changes.push(`Description updated`);
    }
  }

  // Compare status
  if (prevTask.status !== history.status) {
    changes.push(`Status changed from ${history.status} to ${prevTask.status}`);
  }

  // Compare due date
  const prevDate = prevTask.dueDate ? new Date(prevTask.dueDate) : null;
  const historyDate = history.dueDate ? new Date(history.dueDate) : null;

  if ((!prevDate && historyDate) || (prevDate && !historyDate)) {
    changes.push(
      prevDate
        ? `Due date added: ${prevDate.toLocaleDateString()}`
        : `Due date removed`,
    );
  } else if (
    prevDate &&
    historyDate &&
    prevDate.getTime() !== historyDate.getTime()
  ) {
    changes.push(
      `Due date changed from ${historyDate.toLocaleDateString()} to ${prevDate.toLocaleDateString()}`,
    );
  }

  // check the deletedAt field
  if (prevTask.deletedAt !== history.deletedAt) {
    changes.push(`Task deleted at ${history.deletedAt}`);
  }

  // Return a formatted string of all changes
  return changes.length > 0 ? changes.join(", ") : "No changes detected";
};

export default function TaskEditor({
  task,
  onClose,
  onSave,
}: {
  task: Task | null;
  onClose: () => void;
  onSave: () => void;
}) {
  if (!task) return null;
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [dueDate, setDueDate] = useState(task.dueDate);
  const [status, setStatus] = useState(task.status);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log(title, description, dueDate, status);

    const token = localStorage.getItem("token");
    const userData = JSON.parse(localStorage.getItem("user") || "{}");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tasks${task.id !== null ? `/${task.id}` : ``}`,
        {
          method: task.id === null ? "POST" : "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body:
            task.id === null
              ? JSON.stringify({
                  title,
                  description,
                  dueDate,
                  status,
                  userId: userData.id,
                })
              : JSON.stringify({
                  id: task.id,
                  title,
                  description,
                  dueDate,
                  status,
                  userId: userData.id,
                }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error creating task:", errorData);
      } else {
        // Handle success
        console.log("Task created successfully");
        onSave();
        onClose();
      }
    } catch (error) {
      console.error("Error submitting task:", error);
    }
  };

  return (
    <dialog
      open={true}
      className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white p-4 rounded-md shadow-md z-50"
    >
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-4">
          <div className="flex justify-between">
            <h1>{task.id === "0" ? "Add Task" : "Edit Task"}</h1>
            <button onClick={onClose}>Close</button>
          </div>
          <label htmlFor="title">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border border-gray-300 rounded-md p-2"
          />
          <label htmlFor="description">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border border-gray-300 rounded-md p-2"
          />
          <label htmlFor="dueDate">Due Date</label>
          <input
            type="date"
            value={new Date(dueDate).toISOString().split("T")[0]}
            onChange={(e) => setDueDate(new Date(e.target.value))}
            className="border border-gray-300 rounded-md p-2"
          />
          <label htmlFor="status">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
            className="border border-gray-300 rounded-md p-2"
          >
            <option value={TaskStatus.TODO}>TODO</option>
            <option value={TaskStatus.IN_PROGRESS}>IN_PROGRESS</option>
            <option value={TaskStatus.DONE}>DONE</option>
          </select>
          <button
            className="bg-blue-500 text-white p-2 rounded-md"
            type="submit"
          >
            Save
          </button>
        </div>
      </form>
      <div className="flex justify-end">
        {task.id !== null &&
          task.taskHistory &&
          task.taskHistory.length > 0 && (
            <div className="mt-4 w-full">
              <h2 className="text-lg font-semibold mb-2">Task History</h2>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 text-left">Date</th>
                    <th className="border p-2 text-left">Title</th>
                    <th className="border p-2 text-left">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {task.taskHistory.map((history, idx, arr) => {
                    const isLast = idx === arr.length - 1;
                    const diff = diffText(
                      idx === arr.length - 1 ? task : arr[idx + 1],
                      history,
                    );
                    return (
                      <tr key={history.id} className="hover:bg-gray-50">
                        <td className="border p-2">
                          {new Date(history.createdAt).toLocaleDateString()}
                        </td>
                        <td className="border p-2">{history.title}</td>
                        <td className="border p-2">{diff}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </dialog>
  );
}
