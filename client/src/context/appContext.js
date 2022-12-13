import React, { useContext, useReducer } from "react";
import {
  DISPLAY_ALERT,
  CLEAR_ALERT,
  HANDLE_CHANGE,
  REGISTER_USER_BEGIN,
  REGISTER_USER_SUCCESS,
  REGISTER_USER_ERROR,
  LOGIN_USER_BEGIN,
  LOGIN_USER_SUCCESS,
  LOGIN_USER_ERROR,
  LOGOUT_USER,
  IMPORT_REPO_BEGIN,
  IMPORT_REPO_SUCCESS,
  IMPORT_REPO_ERROR,
  GET_REPOS_BEGIN,
  GET_REPOS_SUCCESS,
  GET_DETAIL_BEGIN,
  GET_DETAIL_SUCCESS,
  DELETE_REPO_BEGIN,
  DELETE_REPO_SUCCESS,
  CHANGE_PAGE,
  CLEAR_FILTERS,
  TOGGLE_SIDEBAR,
} from "./actions";
import axios from "axios";
import reducer from "./reducer";
import jwt_decode from "jwt-decode";
//import config from "../../../backend/config";

const user = localStorage.getItem("name");
const email = localStorage.getItem("email");

export const initialState = {
  isLoading: false,
  showAlert: false,
  user: user==null ? JSON.parse(user) : null,//改了，否则前端会有json not defined 的报错
  alertText: "",
  alertType: "",
  showSidebar: false,
  repos: [],
  detail: {},
  totalRepos: 0,
  viewMyRepos: false,
  page: 1,
  numOfPages: 1,
  search: "",
};

const AppContext = React.createContext();
const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const authFetch = axios.create({
    baseURL: "http://localhost:4538/",
  });

  const displayAlert = () => {
    dispatch({
      type: DISPLAY_ALERT,
    });
    clearAlert();
  };

  const clearAlert = () => {
    setTimeout(() => {
      dispatch({
        type: CLEAR_ALERT,
      });
    }, 3000);
  };

  const handleChange = ({ name, value }) => {
    dispatch({
      type: HANDLE_CHANGE,
      payload: { name, value },
    });
  };

  //注册函数
  const registerUser = async (currentUser) => {
    dispatch({ type: REGISTER_USER_BEGIN });
    try {
      const { data } = await authFetch.post("/register", currentUser);
      const { name } = data;
      dispatch({
        type: REGISTER_USER_SUCCESS,
        payload: { name },
      });
      // 将用户名存入LocalStorage中
      addUserToLocalStorage({ name });
    } catch (error) {
      dispatch({
        type: REGISTER_USER_ERROR,
        payload: { msg: error.response.data.msg },
      });
    }
    clearAlert();
  };

  const loginUser = async (currentUser) => {
    dispatch({ type: LOGIN_USER_BEGIN });
    try {
      const  {data}   = await authFetch.post("/login", currentUser);
      //data 目前为json格式，data.token可以获取token
      // const { name } = data;
      
      // console.log({name})
      // 解析token
      // 解析后的json格式为{email: '928606715@qq.com', iat: 1670899874, exp: 1670935874}
      // const decode = jwt_decode(data.token)
      // console.log(decode)

      // 获取邮箱
      // const email = decode.email
      // console.log(email)

      let storage = window.localStorage
      storage.token = data.token
      const decode = jwt_decode(localStorage.token)
      storage.name = data.name
      storage.email = decode.email
      axios.interceptors.request.use(function(config){
        config.withCredentials = true
        config.headers = {
          Authorization : storage.token
        }
        return config
      },function(error){
        return Promise.reject(error)
      })
      
      const name = storage.name
      const email = storage.email
      dispatch({
        type: LOGIN_USER_SUCCESS,
        payload: { name },
      });
      addUserToLocalStorage({ name });
      addEMailToLocalStorage({ email });

    } catch (error) {
       console.log(error.response)
      // dispatch({
      //   type: LOGIN_USER_ERROR,
      //   payload: { msg: error.response.data.msg },
      // });
    }
    clearAlert();
  };

  const addUserToLocalStorage = ({ name }) => {
    localStorage.setItem("name", JSON.stringify(name));
  };

  const removeUserFromLocalStorage = () => {
    localStorage.removeItem("name");
  };

  // email存入local storage
  const addEMailToLocalStorage = ({ email }) => {
    localStorage.setItem("email",JSON.stringify(email));
  };

  const removeEMailFromLocalStorage = () => {
    localStorage.removeItem("email");
  };

  const logoutUser = () => {
    dispatch({ type: LOGOUT_USER });
    removeUserFromLocalStorage();
    // 移除邮箱
    removeEMailFromLocalStorage();
  };

  const importRepo = async (repoInfo) => {
    dispatch({ type: IMPORT_REPO_BEGIN });
    try {
      const { user } = state;
      const { owner, repoName } = repoInfo;

      await authFetch.post("/import", {
        owner,
        repoName,
        user,
      });
      dispatch({
        type: IMPORT_REPO_SUCCESS,
      });
    } catch (error) {
      dispatch({
        type: IMPORT_REPO_ERROR,
        payload: { msg: error.response.data.msg },
      });
    }
    clearAlert();
    getRepos();
  };

  const getRepos = async () => {
    dispatch({ type: GET_REPOS_BEGIN });
    try {
      const { search } = state;
      const { data } = await authFetch.post("/search", { search });
      const { repos } = data;
      dispatch({
        type: GET_REPOS_SUCCESS,
        payload: {
          repos,
        },
      });
    } catch (error) {
      // logoutUser()
    }
  };

  const getDashBoard = async (id) => {
    dispatch({ type: GET_DETAIL_BEGIN });
    try {
      const { data } = await authFetch.post("/dashboard", { id });
      const { detail } = data;
      dispatch({
        type: GET_DETAIL_SUCCESS,
        payload: {
          detail,
        },
      });
    } catch (error) {
      // logoutUser()
    }
  };

  const deleteRepo = async (id) => {
    dispatch({ type: DELETE_REPO_BEGIN });
    try {
      const { data } = await authFetch.post("/delete", { id });
      dispatch({ type: DELETE_REPO_SUCCESS });
    } catch (error) {
      // logoutUser()
    }
    getRepos();
    clearAlert();
  };

  const toggleSidebar = () => {
    dispatch({ type: TOGGLE_SIDEBAR });
  };

  const changePage = (page) => {
    dispatch({ type: CHANGE_PAGE, payload: { page } });
  };

  const clearFilters = () => {
    dispatch({ type: CLEAR_FILTERS });
  };

  return (
    <AppContext.Provider
      value={{
        ...state,
        displayAlert,
        handleChange,
        registerUser,
        loginUser,
        logoutUser,
        importRepo,
        getRepos,
        getDashBoard,
        deleteRepo,
        toggleSidebar,
        changePage,
        clearFilters,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  return useContext(AppContext);
};

export { AppProvider };
