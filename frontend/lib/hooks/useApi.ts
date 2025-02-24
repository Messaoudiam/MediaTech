// react
import { useState } from "react";

// axios
import { AxiosError } from "axios";
import api from "../api/axios";

// types
interface ApiError {
  message: string;
  statusCode: number;
}

export function useApi<T>() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchData = async (endpoint: string) => {
    try {
      setLoading(true);

      setError(null);

      const response = await api.get<T>(endpoint);

      setData(response.data);

      return response.data;
    } catch (err) {
      const error = err as AxiosError<ApiError>;

      setError(
        error.response?.data || {
          message: "Une erreur est survenue",
          statusCode: 500,
        }
      );

      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, fetchData };
}
