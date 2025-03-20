import { useEffect, useState } from "react";
import { Task } from "../types/task";

export function useTasks() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [totalTasks, setTotalTasks] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [sortBy, setSortBy] = useState<string>("title");
  const [sortOrder, setSortOrder] = useState<string>("asc");

  function reloadTasks() {
    setIsLoading(true);
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/tasks?page=${page}&limit=${limit}${showDeleted ? "&deleted=true" : ""}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      },
    )
      .then((response) => response.json())
      .then((data) => {
        // If there are no tasks but we're not on the first page, go back one page
        if (data.tasks.length === 0 && page > 1) {
          setPage(page - 1);
          return; // Exit early as we'll fetch again with the updated page
        }
        setTasks(data.tasks);
        setTotalPages(data.totalPages);
        setTotalTasks(data.totalTasks);
        setIsLoading(false);
      })
      .catch((error) => {
        setError(error.message);
        setIsLoading(false);
      });
  }

  useEffect(() => {
    setIsLoading(true);
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/tasks?page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}${showDeleted ? "&deleted=true" : ""}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      },
    )
      .then((response) => response.json())
      .then((data) => {
        setTasks(data.tasks);
        setTotalPages(data.totalPages);
        setTotalTasks(data.totalTasks);
        setIsLoading(false);
      })
      .catch((error) => {
        setError(error.message);
        setIsLoading(false);
      });
  }, [page, limit, showDeleted, sortBy, sortOrder]);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tasks?page=${page}&limit=${limit}&deleted=${showDeleted}&sortBy=${sortBy}&sortOrder=${sortOrder}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      // Process response...
    } catch (error) {
      // Handle error...
    }
  };

  return {
    tasks,
    totalPages,
    totalTasks,
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
  };
}
