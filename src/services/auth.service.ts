import axios from "axios";

const API = "https://nr-college-backend.onrender.com/api/auth";

// REGISTER - returns { token, user }
export const registerUser = async (data: any) => {
  const res = await axios.post(`${API}/register`, data);
  return res.data; // { token, user }
};

// LOGIN - returns { token, user }
export const loginUser = async (data: any) => {
  const res = await axios.post(`${API}/login`, data);
  return res.data; // { token, user }
};